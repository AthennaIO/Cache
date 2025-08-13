/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { debug } from '#src/debug'
import type { StoreOptions } from '#src/types'
import type { Driver } from '#src/cache/drivers/Driver'
import { MemoryDriver } from '#src/cache/drivers/MemoryDriver'
import { NotFoundDriverException } from '#src/exceptions/NotFoundDriverException'
import { NotImplementedConfigException } from '#src/exceptions/NotImplementedConfigException'

export class StoreFactory {
  /**
   * Holds all the open stores.
   */
  public static stores: Map<string, any> = new Map()

  /**
   * Holds all the Athenna drivers implementations available.
   */
  public static drivers: Map<string, any> = new Map().set(
    'memory',
    MemoryDriver
  )

  public static fabricate(
    con: 'memory',
    options?: StoreOptions['options']
  ): MemoryDriver

  public static fabricate(
    con: 'memory' | string,
    options?: StoreOptions['options']
  ): MemoryDriver

  /**
   * Fabricate a new connection for a specific driver.
   */
  public static fabricate(
    storeName: string,
    options?: StoreOptions['options']
  ) {
    storeName = this.parseStoreName(storeName)

    const driverName = this.getStoreDriver(storeName)
    const Driver = this.drivers.get(driverName)
    const store = this.stores.get(storeName)

    if (!store) {
      this.stores.set(storeName, { client: null })

      return new Driver(storeName, null, options)
    }

    if (store.client) {
      debug(
        'client found for store %s using driver %s, using it as default',
        storeName,
        driverName
      )

      return new Driver(storeName, store.client, options)
    }

    return new Driver(storeName, null, options)
  }

  /**
   * Verify if client is present on a driver connection.
   */
  public static hasClient(store: string): boolean {
    return !!this.stores.get(store).client
  }

  /**
   * Get client of a connection.
   */
  public static getClient(store: string): any {
    return this.stores.get(store).client
  }

  /**
   * Set store client on driver.
   */
  public static setClient(storeName: string, client: any): void {
    const store = this.stores.get(storeName) || {}

    store.client = client

    this.stores.set(storeName, store)
  }

  /**
   * Return all available drivers.
   */
  public static availableDrivers() {
    const availableDrivers = []

    for (const key of this.drivers.keys()) {
      availableDrivers.push(key)
    }

    return availableDrivers
  }

  /**
   * Return all available stores.
   */
  public static availableStores() {
    const availableStores = []

    for (const key of this.stores.keys()) {
      availableStores.push(key)
    }

    return availableStores
  }

  /**
   * Define your own cache driver implementation to use
   * within Cache facade.
   *
   * @example
   * ```ts
   * import { Driver, StoreFactory } from '@athenna/cache'
   *
   * class TestDriver extends Driver {}
   *
   * StoreFactory.createDriver('test', TestDriver)
   * ```
   */
  public static createDriver(name: string, impl: typeof Driver<any>) {
    this.drivers.set(name, impl)
  }

  /**
   * Parse store config name if is default
   */
  private static parseStoreName(storeName: string): string {
    if (storeName === 'default') {
      return Config.get('cache.default')
    }

    return storeName
  }

  /**
   * Get the store configuration of config/cache file.
   */
  private static getStoreDriver(con: string): string {
    const config = Config.get(`cache.stores.${con}`)

    if (!config) {
      throw new NotImplementedConfigException(con)
    }

    if (!this.drivers.has(config.driver)) {
      throw new NotFoundDriverException(config.driver)
    }

    return config.driver
  }
}
