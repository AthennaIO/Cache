/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Macroable, Options } from '@athenna/common'
import { StoreFactory } from '#src/factories/StoreFactory'
import type { StoreOptions } from '#src/types/StoreOptions'
import type { RedisDriver } from '#src/cache/drivers/RedisDriver'
import type { MemoryDriver } from '#src/cache/drivers/MemoryDriver'
import type { Driver as DriverImpl } from '#src/cache/drivers/Driver'

export class CacheImpl<Driver extends DriverImpl = any> extends Macroable {
  /**
   * The store name used for this instance.
   */
  public storeName = Config.get('cache.default')

  /**
   * The drivers responsible for handling cache operations.
   */
  public driver: RedisDriver | MemoryDriver = null

  /**
   * Creates a new instance of CacheImpl.
   */
  public constructor(athennaCacheOpts?: StoreOptions) {
    super()

    this.driver = StoreFactory.fabricate(
      this.storeName,
      athennaCacheOpts?.options
    )

    this.connect(athennaCacheOpts)
  }

  public store(store: 'redis', options?: StoreOptions): CacheImpl<RedisDriver>
  public store(store: 'memory', options?: StoreOptions): CacheImpl<MemoryDriver>

  public store(
    store: 'redis' | 'memory' | string,
    options?: StoreOptions
  ): CacheImpl<RedisDriver> | CacheImpl<MemoryDriver>

  /**
   * Change the store connection.
   *
   * @example
   * ```ts
   * await Cache.store('redis').set('my:cache:key', 'hello')
   * ```
   */
  public store(
    store: 'redis' | 'memory' | string,
    options?: StoreOptions
  ): CacheImpl<Driver> {
    const driver = StoreFactory.fabricate(store, options?.options)
    const cache = new CacheImpl<typeof driver>(options)

    cache.storeName = store
    cache.driver = driver

    return cache.connect(options)
  }

  /**
   * Verify if client is already connected.
   */
  public isConnected(): boolean {
    return StoreFactory.hasClient(this.storeName)
  }

  /**
   * Connect to client.
   *
   * @example
   * ```ts
   * Cache.store('my-con').connect()
   * ```
   */
  public connect(options?: StoreOptions) {
    this.driver.connect(options)

    return this
  }

  /**
   * Close the store connection with cache in this instance.
   *
   * @example
   * ```ts
   * await Cache.store('my-con').close()
   * ```
   */
  public async close(): Promise<void> {
    await this.driver.close()
  }

  /**
   * Close all the open stores of cache.
   *
   * @example
   * ```ts
   * await Cache.closeAll()
   * ```
   */
  public async closeAll(): Promise<void> {
    const stores = StoreFactory.availableStores()
    const promises = stores.map(store => {
      const driver = StoreFactory.fabricate(store)

      return driver.close().then(() => StoreFactory.setClient(store, null))
    })

    await Promise.all(promises)
  }

  /**
   * Get a value from the cache by its key.
   *
   * @example
   * ```ts
   * const defaultValue = 'hello'
   * const cache = await Cache.get('my:cache:key', defaultValue)
   * ```
   */
  public async get(key: string, defaultValue?: string) {
    return this.driver.get(key, defaultValue)
  }

  /**
   * Validate if a value exists on the cache by its key.
   *
   * @example
   * ```ts
   * const defaultValue = 'hello'
   *
   * const exists = await Cache.has('my:cache:key')
   * ```
   */
  public async has(key: string) {
    return this.driver.has(key)
  }

  /**
   * Set a new value in the cache.
   *
   * @example
   * ```ts
   * const cache = await Cache.set('my:cache:key', { hello: 'world' })
   * ```
   */
  public async set(key: string, value: string, options?: { ttl?: number }) {
    options = Options.create({
      ttl: Config.get(`cache.stores.${this.storeName}.ttl`)
    })

    return this.driver.set(key, value, options)
  }

  /**
   * Get a value from the cache and delete it.
   *
   * @example
   * ```ts
   * const cache = await Cache.pull('my:cache:key')
   *
   * await Cache.has('my:cache:key') false
   * ```
   */
  public async pull(key: string) {
    return this.driver.pull(key)
  }

  /**
   * Delete a value from the cache my its key.
   *
   * @example
   * ```ts
   * const cache = await Cache.delete('my:cache:key')
   * ```
   */
  public async delete(key: string) {
    return this.driver.delete(key)
  }

  /**
   * Delete all values from the cache.
   *
   * @example
   * ```ts
   * const cache = await Cache.truncate('my:cache:key')
   * ```
   */
  public async truncate() {
    return this.driver.truncate()
  }
}
