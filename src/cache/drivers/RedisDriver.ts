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
import type { StoreOptions } from '#src/types'
import { Driver } from '#src/cache/drivers/Driver'
import { Is, Parser, Options } from '@athenna/common'
import { StoreFactory } from '#src/factories/StoreFactory'
import { createClient, type RedisClientType } from 'redis'

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

    this.client = createClient({ url: this.url, socket: this.socket })
    this.client
      .connect()
      .then(() => {
        if (Config.is('rc.bootLogs', true)) {
          Log.channelOrVanilla('application').success(
            `Successfully connected to ({yellow} ${this.store}) cache store`
          )
        }
      })
      .catch(err => {
        console.error(err)
      })
    this.isConnected = true
    this.isSavedOnFactory = options.saveOnFactory

    if (options.saveOnFactory) {
      StoreFactory.setClient(this.store, this.client)
    }
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
    const value = await this.get(key)

    return !!value
  }

  /**
   * Set a value in the cache.
   */
  public async set(key: string, value: any, options?: { ttl?: number }) {
    await this.client.set(this.getCacheKey(key), value, {
      expiration: {
        type: 'EX',
        value: Math.ceil((options?.ttl || this.ttl) / 1000)
      }
    })
  }

  /**
   * Get a value from the cache and delete it at
   * the same time.
   */
  public async pull<T = any>(key: string) {
    const value = await this.get<T>(key)

    await this.delete(key)

    return value
  }

  /**
   * Delete a value from the cache.
   */
  public async delete(key: string) {
    await this.client.del(this.getCacheKey(key))
  }
}
