/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { LRUCache } from 'lru-cache'
import type { StoreOptions } from '#src/types'
import { Driver } from '#src/cache/drivers/Driver'
import { Parser, Options, Is } from '@athenna/common'
import { StoreFactory } from '#src/factories/StoreFactory'

export class MemoryDriver extends Driver<LRUCache<string, any>> {
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

    const { LRUCache } = this.getLruCache()

    this.client = new LRUCache({
      max: this.maxItems,
      maxEntrySize: this.maxEntrySize
        ? Parser.byteToSize(this.maxEntrySize)
        : undefined,
      ttlAutopurge: false
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

    this.client = null
    this.isConnected = false

    StoreFactory.setClient(this.store, null)
  }

  /**
   * Reset all data defined inside cache.
   */
  public async truncate() {
    for (const key of this.client.keys()) {
      this.client.delete(key)
    }
  }

  /**
   * Get a value from the cache.
   */
  public async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    const value = this.client.get(key)

    if (Is.Null(value) || Is.Undefined(value)) {
      return defaultValue
    }

    return value
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
    this.client.set(key, value, { ttl: options?.ttl || this.ttl })
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
    this.client.delete(key)
  }
}
