/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Path } from '@athenna/common'
import { Config } from '@athenna/config'
import { Cache, CacheProvider } from '#src'
import { Test, Mock, BeforeEach, AfterEach, type Context } from '@athenna/test'

export class CacheProviderTest {
  @BeforeEach()
  public async beforeEach() {
    await Config.loadAll(Path.fixtures('config'))
  }

  @AfterEach()
  public async afterEach() {
    Mock.restoreAll()
    ioc.reconstruct()
    Config.clear()
  }

  @Test()
  public async shouldBeAbleToRegisterCacheImplementationInTheContainer({ assert }: Context) {
    new CacheProvider().register()

    assert.isTrue(ioc.has('Athenna/Core/Cache'))
  }

  @Test()
  public async shouldBeAbleToUseCacheImplementationFromFacade({ assert }: Context) {
    new CacheProvider().register()

    assert.isDefined(Cache.storeName)
  }

  @Test()
  public async shouldBeAbleToShutdownOpenCacheConnections({ assert }: Context) {
    const cacheProvider = new CacheProvider()

    cacheProvider.register()

    const cache = Cache.store('memory')

    assert.isTrue(cache.isConnected())

    await cacheProvider.shutdown()

    assert.isFalse(cache.isConnected())
  }

  @Test()
  public async shouldNotThrowErrorIfProviderIsNotRegisteredWhenShuttingDown({ assert }: Context) {
    await assert.doesNotReject(() => new CacheProvider().shutdown())
  }
}
