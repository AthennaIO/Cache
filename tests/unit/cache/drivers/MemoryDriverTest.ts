/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Path } from '@athenna/common'
import { Cache, CacheProvider } from '#src'
import { Test, type Context, BeforeEach, AfterEach } from '@athenna/test'

export class MemoryDriverTest {
  @BeforeEach()
  public async beforeEach() {
    await Config.loadAll(Path.fixtures('config'))

    new CacheProvider().register()
  }

  @AfterEach()
  public async afterEach() {
    await Cache.closeAll()
    ioc.reconstruct()

    Config.clear()
  }

  @Test()
  public async shouldBeAbleToConnectToDriver({ assert }: Context) {
    Cache.store('memory')

    assert.isTrue(Cache.isConnected())
  }

  @Test()
  public async shouldBeAbleToCloseTheConnectionWithDriver({ assert }: Context) {
    const cache = Cache.store('memory')

    await cache.close()

    assert.isFalse(cache.isConnected())
  }

  @Test()
  public async shouldBeAbleToCloneTheCacheInstance({ assert }: Context) {
    const driver = Cache.store('memory').driver
    const otherDriver = driver.clone()

    driver.isConnected = false

    assert.isTrue(otherDriver.isConnected)
  }

  @Test()
  public async shouldBeAbleToGetDriverClient({ assert }: Context) {
    const client = Cache.store('memory').driver.getClient()

    assert.isDefined(client)
  }

  @Test()
  public async shouldBeAbleToSetDifferentClientForDriver({ assert }: Context) {
    const driver = Cache.store('memory').driver

    driver.setClient({ hello: 'world' } as any)

    assert.deepEqual(driver.client, { hello: 'world' })
  }

  @Test()
  public async shouldBeAbleToSetValueToTheCache({ assert }: Context) {
    const cache = Cache.store('memory')

    await cache.set('hello', 'world')

    assert.isDefined(cache.driver.client.get('hello'))
  }

  @Test()
  public async shouldBeAbleToVerifyIfTheCacheKeyExists({ assert }: Context) {
    const cache = Cache.store('memory')

    assert.isFalse(await cache.has('hello'))

    await cache.set('hello', 'world')

    assert.isTrue(await cache.has('hello'))
  }

  @Test()
  public async shouldBeAbleToGetAValueFromTheCache({ assert }: Context) {
    const cache = Cache.store('memory')

    await cache.set('hello', 'world')

    assert.deepEqual(await cache.get('hello'), 'world')
  }

  @Test()
  public async shouldBeAbleToDeleteAValueFromTheCache({ assert }: Context) {
    const cache = Cache.store('memory')

    await cache.set('hello', 'world')

    assert.isTrue(await cache.has('hello'))

    await cache.delete('hello')

    assert.isFalse(await cache.has('hello'))
  }

  @Test()
  public async shouldBeAbleToPullAValueFromTheCache({ assert }: Context) {
    const cache = Cache.store('memory')

    await cache.set('hello', 'world')

    assert.isTrue(await cache.has('hello'))
    assert.deepEqual(await cache.pull('hello'), 'world')
    assert.isFalse(await cache.has('hello'))
  }

  @Test()
  public async shouldBeAbleToTruncateTheCache({ assert }: Context) {
    const cache = Cache.store('memory')

    await cache.set('hello', 'world')
    await cache.set('other', 'world')

    assert.isTrue(await cache.has('hello'))
    assert.isTrue(await cache.has('other'))

    await cache.truncate()

    assert.isFalse(await cache.has('hello'))
    assert.isFalse(await cache.has('other'))
  }
}
