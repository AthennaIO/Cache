/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ServiceProvider } from '@athenna/ioc'
import { CacheImpl } from '#src/cache/CacheImpl'

export class CacheProvider extends ServiceProvider {
  public async register() {
    this.container.instance('athennaCacheOpts', undefined)
    this.container.transient('Athenna/Core/Cache', CacheImpl)
  }

  public async shutdown() {
    const cache = this.container.use('Athenna/Core/Cache')

    if (!cache) {
      return
    }

    await cache.closeAll()
  }
}
