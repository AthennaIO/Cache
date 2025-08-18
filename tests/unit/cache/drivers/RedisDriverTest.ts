/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Cache, CacheProvider } from '#src'
import { Path, Sleep } from '@athenna/common'
import { Test, type Context, BeforeEach, AfterEach } from '@athenna/test'

export class RedisDriverTest {
  @BeforeEach()
  public async beforeEach() {
    await Config.loadAll(Path.fixtures('config'))

    new CacheProvider().register()

    /**
     * Sleep to wait until redis is connected.
     */
    await Sleep.for(100).milliseconds().wait()
  }

  @AfterEach()
  public async afterEach() {
    await Cache.store('redis').truncate()
    await Cache.closeAll()
    ioc.reconstruct()

    Config.clear()
  }

  @Test()
  public async shouldBeAbleToConnectToDriver({ assert }: Context) {
    Cache.store('redis')

    await Sleep.for(100).milliseconds().wait()

    assert.isTrue(Cache.isConnected())
  }

  @Test()
  public async shouldBeAbleToCloseTheConnectionWithDriver({ assert }: Context) {
    const cache = Cache.store('redis')

    await Sleep.for(100).milliseconds().wait()

    await cache.close()

    assert.isFalse(cache.isConnected())
  }

  @Test()
  public async shouldBeAbleToCloneTheCacheInstance({ assert }: Context) {
    const driver = Cache.store('redis').driver
    const otherDriver = driver.clone()

    await Sleep.for(100).milliseconds().wait()

    driver.isConnected = false

    assert.isTrue(otherDriver.isConnected)
  }

  @Test()
  public async shouldBeAbleToGetDriverClient({ assert }: Context) {
    const client = Cache.store('redis').driver.getClient()

    assert.isDefined(client)
  }

  @Test()
  public async shouldBeAbleToSetDifferentClientForDriver({ assert }: Context) {
    const driver = Cache.store('redis').driver

    driver.setClient({ hello: 'world' } as any)

    assert.deepEqual(driver.client, { hello: 'world' })
  }

  @Test()
  public async shouldBeAbleToSetValueToTheCache({ assert }: Context) {
    const cache = Cache.store('redis')

    await cache.set('hello', 'world')

    assert.isDefined(cache.driver.client.get('hello'))
  }

  @Test()
  public async shouldBeAbleToVerifyIfTheCacheKeyExists({ assert }: Context) {
    const cache = Cache.store('redis')

    assert.isFalse(await cache.has('hello'))

    await cache.set('hello', 'world')

    assert.isTrue(await cache.has('hello'))
  }

  @Test()
  public async shouldBeAbleToGetAValueFromTheCache({ assert }: Context) {
    const cache = Cache.store('redis')

    await cache.set('hello', 'world')

    assert.deepEqual(await cache.get('hello'), 'world')
  }

  @Test()
  public async shouldBeAbleToDeleteAValueFromTheCache({ assert }: Context) {
    const cache = Cache.store('redis')

    await cache.set('hello', 'world')

    assert.isTrue(await cache.has('hello'))

    await cache.delete('hello')

    assert.isFalse(await cache.has('hello'))
  }

  @Test()
  public async shouldBeAbleToPullAValueFromTheCache({ assert }: Context) {
    const cache = Cache.store('redis')

    await cache.set('hello', 'world')

    assert.isTrue(await cache.has('hello'))
    assert.deepEqual(await cache.pull('hello'), 'world')
    assert.isFalse(await cache.has('hello'))
  }

  @Test()
  public async shouldBeAbleToTruncateTheCache({ assert }: Context) {
    const cache = Cache.store('redis')

    await cache.set('hello', 'world')
    await cache.set('other', 'world')

    assert.isTrue(await cache.has('hello'))
    assert.isTrue(await cache.has('other'))

    await cache.truncate()

    assert.isFalse(await cache.has('hello'))
    assert.isFalse(await cache.has('other'))
  }
}
