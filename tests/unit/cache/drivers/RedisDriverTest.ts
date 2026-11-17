/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Cache, CacheProvider } from '#src'
import { RedisDriver } from '#src/cache/drivers/RedisDriver'
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
  public async shouldResurrectAClosedClientOnTheNextCommand({ assert }: Context) {
    const cache = Cache.store('redis')

    await Sleep.for(100).milliseconds().wait()

    await cache.set('resurrect', 'alive')

    cache.driver.client.destroy()

    assert.isFalse(cache.driver.client.isOpen)

    const value = await cache.get('resurrect')

    assert.equal(value, 'alive')
    assert.isTrue(cache.driver.client.isOpen)
  }

  @Test()
  public async shouldShareASingleReconnectAttemptBetweenConcurrentCommands({ assert }: Context) {
    const cache = Cache.store('redis')

    await Sleep.for(100).milliseconds().wait()

    await cache.set('concurrent', 'ok')

    cache.driver.client.destroy()

    const values = await Promise.all([cache.get('concurrent'), cache.get('concurrent'), cache.get('concurrent')])

    assert.deepEqual(values, ['ok', 'ok', 'ok'])
    assert.isTrue(cache.driver.client.isOpen)
  }

  @Test()
  public async shouldSelectTheDatabaseByTheUrlPathWhenBuildingTheUrl({ assert }: Context) {
    const driver = new RedisDriver('redis', null, { database: 2 })

    assert.equal(new RedisDriver('redis').url, 'redis://localhost:6382/0')
    assert.equal(driver.url, 'redis://localhost:6382/2')
    assert.equal(driver.database, 2)
  }

  @Test()
  public async shouldMoveADatabaseQueryOfTheUrlToItsPath({ assert }: Context) {
    const driver = new RedisDriver('redis', null, { url: 'redis://:p%40ss@localhost:6382?database=1' })

    assert.equal(driver.url, 'redis://:p%40ss@localhost:6382/1')
    assert.equal(driver.database, 1)
  }

  @Test()
  public async shouldKeepTheDatabaseOfTheUrlPathUnlessTheOptionsNameOne({ assert }: Context) {
    assert.equal(new RedisDriver('redis', null, { url: 'redis://localhost:6382/3' }).url, 'redis://localhost:6382/3')
    assert.equal(
      new RedisDriver('redis', null, { url: 'redis://localhost:6382/3?database=4', database: 5 }).url,
      'redis://localhost:6382/5'
    )
  }

  @Test()
  public async shouldWriteToTheDatabaseTheUrlQueryNames({ assert }: Context) {
    const cache = Cache.store('redis', {
      force: true,
      saveOnFactory: false,
      options: { url: 'redis://localhost:6382?database=1' }
    })

    await Sleep.for(100).milliseconds().wait()

    const info = await cache.driver.client.sendCommand(['CLIENT', 'INFO'])

    await cache.close()

    assert.match(info, /\bdb=1\b/)
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
