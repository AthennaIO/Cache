/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Config } from '@athenna/config'
import type { StoreOptions } from '#src/types'

export abstract class Driver<Client = any> {
  /**
   * Set if this instance is connected.
   */
  public isConnected = false

  /**
   * Set if the connection will be saved on factory.
   */
  public isSavedOnFactory = false

  /**
   * The store name used for this instance.
   */
  public store: string = null

  /**
   * Set the client of this driver.
   */
  public client: Client

  /**
   * Set the default ttl of the driver.
   */
  public ttl: number

  /**
   * Define the max number of items that could be inserted in the cache.
   */
  public maxItems: number

  /**
   * Define the max entry size of an item that could be inserted in the cache.
   */
  public maxEntrySize: number

  /**
   * Creates a new instance of the Driver.
   */
  public constructor(
    store: string | any,
    client: Client = null,
    options?: StoreOptions['options']
  ) {
    const config = Config.get(`cache.stores.${store}`)

    this.ttl = options?.ttl || config.ttl
    this.maxItems = options?.maxItems || config.maxItems || 1000
    this.maxEntrySize = options?.maxEntrySize || config.maxEntrySize
    this.store = store

    if (client) {
      this.client = client
      this.isConnected = true
      this.isSavedOnFactory = true
    }
  }

  /**
   * Clone the driver instance.
   */
  public clone(): this {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new this.constructor(this.store, this.client)
  }

  /**
   * Return the client of driver.
   */
  public getClient(): Client {
    return this.client
  }

  /**
   * Set a client in driver.
   */
  public setClient(client: Client) {
    this.client = client

    return this
  }

  /**
   * Connect to client.
   */
  public abstract connect(options?: StoreOptions): void

  /**
   * Close the connection with the client in this instance.
   */
  public abstract close(): Promise<void>

  /**
   * Reset all data defined inside cache.
   */
  public abstract truncate(): Promise<void>

  /**
   * Get a value from the cache.
   */
  public abstract get(key: string, defaultValue?: string): Promise<string>

  /**
   * Validate if a value exists in the cache.
   */
  public abstract has(key: string): Promise<boolean>

  /**
   * Set a value in the cache.
   */
  public abstract set(
    key: string,
    value: string,
    options?: { ttl?: number }
  ): Promise<void>

  /**
   * Get a value from the cache and delete it at
   * the same time.
   */
  public abstract pull(key: string): Promise<string>

  /**
   * Delete a value from the cache.
   */
  public abstract delete(key: string): Promise<void>
}
