/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type StoreOptions = {
  /**
   * Force the store connection to be created even if the
   * connection is already opened. This option is
   * useful to create a connection from scratch, meaning
   * that your driver will not use the default one. This
   * also means that is your responsibility to close this
   * connection.
   *
   * @default false
   */
  force?: boolean

  /**
   * Save your connection in the DriverFactory class.
   * If this is true, all the drivers will have a shared
   * connection to use.
   *
   * @default true
   */
  saveOnFactory?: boolean

  /**
   * Since we are using the constructor method to create
   * the store connection, it could create the connection when
   * we don't really want to. To avoid creating the
   * connection is certain scenarios where you want to
   * manipulate the driver client, set this option to `false`.
   *
   * @default true
   */
  connect?: boolean

  /**
   * Define the options for your connection.
   */
  options?: {
    [key: string]: any

    /**
     * Define the Time To Live of the value defined in the cache.
     *
     * @default Config.get(`cache.stores.${store}.ttl`)
     */
    ttl?: number

    /**
     * Define if your cache will be enabled or not. Useful when you want
     * to make tests.
     *
     * @default Config.get(`cache.stores.${store}.enabled`)
     */
    enabled?: boolean

    /**
     * Define a prefix for the store. By default, prefix
     * will always be used in front of your keys if it exists.
     *
     * @default Config.get(`cache.stores.${store}.prefix`)
     */
    prefix?: string

    /**
     * Define the max number of items that could be inserted in the cache.
     *
     * @default Config.get(`cache.stores.${store}.maxItems`)
     */
    maxItems?: number

    /**
     * Define the max entry size of an item that could be inserted in the cache.
     *
     * @default Config.get(`cache.stores.${store}.maxEntrySize`)
     */
    maxEntrySize?: number
  }
}
