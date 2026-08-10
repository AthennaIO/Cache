/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Log } from '@athenna/logger'
import { Config } from '@athenna/config'
import type { RedisClientType } from 'redis'
import type { StoreOptions } from '#src/types'
import { Driver } from '#src/cache/drivers/Driver'
import { Is, Parser, Options } from '@athenna/common'
import { StoreFactory } from '#src/factories/StoreFactory'

export class RedisDriver extends Driver<RedisClientType> {
  /**
   * Redis database URL.
   */
  public url: string

  /**
   * Redis database socket.
   */
  public socket: any

  /**
   * Redis database host.
   */
  public host: string

  /**
   * Redis database port.
   */
  public port: number

  /**
   * Redis connection protocol.
   */
  public protocol: string

  /**
   * Redis database username.
   */
  public username: string

  /**
   * Redis database password.
   */
  public password: string

  /**
   * Redis database number.
   */
  public database: number

  /**
   * In-flight resurrection attempt, shared so concurrent commands
   * don't race multiple connect() calls against a closed client.
   */
  private reconnectPromise: Promise<void> = null

  /**
   * Log without ever throwing: driver logs fire from node-redis event
   * listeners and reconnect callbacks, where an exception (e.g. Logger
   * service not bound in the container) would crash the process over a
   * cache connection blip.
   */
  private log(level: 'success' | 'warn' | 'error', message: string) {
    try {
      Log.channelOrVanilla('application')[level](message)
    } catch {
      /* logging must never take the process down */
    }
  }

  public constructor(
    store: string,
    client: any = null,
    options?: StoreOptions['options']
  ) {
    super(store, client, options)

    const config = Config.get(`cache.stores.${store}`)

    this.url = options?.url || config?.url
    this.host = options?.host || config?.host
    this.port = options?.port || config?.port || 6379
    this.socket = options?.socket || config?.socket
    this.username = options?.username || config?.username
    this.password = options?.password || config?.password
    this.database = options?.database || config?.database || 0
    this.protocol = options?.protocol || config?.protocol || 'redis'

    if (!this.url) {
      this.url = Parser.connectionObjToDbUrl({
        host: this.host,
        port: this.port,
        user: this.username,
        password: this.password,
        protocol: this.protocol,
        database: ''
      })

      this.url = `${this.url.slice(0, -1)}?database=${this.database}`
    }
  }

  /**
   * Connect to client.
   */
  public connect(options: StoreOptions) {
    options = Options.create(options, {
      force: false,
      connect: true,
      saveOnFactory: true
    })

    if (!options.connect) {
      return
    }

    if (this.isConnected && !options.force) {
      return
    }

    const config = Config.get(`cache.stores.${this.store}`)
    const { createClient } = this.getRedis()

    /**
     * Never stop retrying: returning an Error here makes node-redis close
     * the client permanently, so a Redis restart longer than the retry
     * window would leave every future command throwing "The client is
     * closed" until the process restarts.
     */
    const defaultReconnectStrategy = (retries: number) => {
      if (retries > 0 && retries % 10 === 0) {
        this.log(
          'warn',
          `Cache store ({yellow} ${this.store}) still reconnecting after ${retries} retries`
        )
      }

      return Math.min(retries * 200, 5000)
    }

    this.client = createClient({
      url: this.url,
      socket: {
        ...this.socket,
        reconnectStrategy: config?.reconnectStrategy ?? defaultReconnectStrategy
      }
    })

    // Required: without this listener node-redis emits 'error' events as
    // unhandled rejections whenever the connection drops after initial connect.
    this.client.on('error', err => {
      this.log(
        'error',
        `({red} Error) on ({yellow} ${this.store}) cache store: ${err.message}`
      )
    })

    this.client
      .connect()
      .then(() => {
        if (Config.is('rc.bootLogs', true)) {
          this.log(
            'success',
            `Successfully connected to ({yellow} ${this.store}) cache store`
          )
        }
      })
      .catch(err => {
        this.log(
          'error',
          `Failed to connect to ({yellow} ${this.store}) cache store: ${err.message}`
        )
      })

    this.isConnected = true
    this.isSavedOnFactory = options.saveOnFactory

    if (options.saveOnFactory) {
      StoreFactory.setClient(this.store, this.client)
    }
  }

  /**
   * Reconnect a client that node-redis has permanently closed — a custom
   * reconnect strategy that gave up, or a connection that never came up at
   * boot. Without this, every command on that client throws "The client is
   * closed" until the process restarts; with it, the next command heals the
   * connection instead.
   */
  private async ensureConnection() {
    if (!this.client || this.client.isOpen) {
      return
    }

    if (!this.reconnectPromise) {
      this.reconnectPromise = this.client
        .connect()
        .then(() => {
          if (Config.is('rc.bootLogs', true)) {
            this.log(
              'success',
              `Reconnected to ({yellow} ${this.store}) cache store`
            )
          }
        })
        .finally(() => (this.reconnectPromise = null))
    }

    await this.reconnectPromise
  }

  /**
   * Close the connection with the client in this instance.
   */
  public async close() {
    if (!this.client || !this.isConnected) {
      return
    }

    try {
      await this.client.quit()
    } finally {
      this.client = null
      this.isConnected = false

      StoreFactory.setClient(this.store, null)
    }
  }

  /**
   * Reset all data defined inside cache.
   */
  public async truncate() {
    if (!this.enabled) {
      return
    }

    await this.ensureConnection()

    let cursor = '0'

    do {
      const response = await this.client.scan(cursor, {
        COUNT: 500,
        MATCH: `${this.prefix}*`
      })

      cursor = response.cursor

      if (response.keys.length) {
        await this.client.del(response.keys)
      }
    } while (cursor !== '0')
  }

  /**
   * Get a value from the cache.
   */
  public async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    if (!this.enabled) {
      return
    }

    await this.ensureConnection()

    const value = await this.client.get(this.getCacheKey(key))

    if (Is.Null(value) || Is.Undefined(value)) {
      return defaultValue
    }

    return value as T
  }

  /**
   * Validate if a value exists in the cache.
   */
  public async has(key: string): Promise<boolean> {
    if (!this.enabled) {
      return
    }

    const value = await this.get(key)

    return !!value
  }

  /**
   * Set a value in the cache.
   */
  public async set(key: string, value: any, options?: { ttl?: number }) {
    if (!this.enabled) {
      return
    }

    await this.ensureConnection()

    const driverOptions: any = {}

    options = Options.create(options, {
      ttl: this.ttl
    })

    if (options.ttl) {
      driverOptions.expiration = {
        type: 'EX',
        value: Math.ceil((options?.ttl || this.ttl) / 1000)
      }
    }

    await this.client.set(this.getCacheKey(key), value, driverOptions)
  }

  /**
   * Get a value from the cache and delete it at
   * the same time.
   */
  public async pull<T = any>(key: string) {
    if (!this.enabled) {
      return
    }

    const value = await this.get<T>(key)

    await this.delete(key)

    return value
  }

  /**
   * Delete a value from the cache.
   */
  public async delete(key: string) {
    if (!this.enabled) {
      return
    }

    await this.ensureConnection()

    await this.client.del(this.getCacheKey(key))
  }
}
