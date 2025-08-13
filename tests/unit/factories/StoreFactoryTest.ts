/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MemoryDriver } from '#src'
import { Path } from '@athenna/common'
import { StoreFactory } from '#src/factories/StoreFactory'
import { TestDriver } from '#tests/fixtures/drivers/TestDriver'
import { AfterEach, BeforeEach, Test, type Context } from '@athenna/test'
import { NotFoundDriverException } from '#src/exceptions/NotFoundDriverException'
import { NotImplementedConfigException } from '#src/exceptions/NotImplementedConfigException'

export class StoreFactoryTest {
  @BeforeEach()
  public async beforeEach() {
    await Config.loadAll(Path.fixtures('config'))
    StoreFactory.stores = new Map()
    StoreFactory.drivers.delete('test')
  }

  @AfterEach()
  public async afterEach() {
    Config.clear()
  }

  @Test()
  public async shouldBeAbleToGetAllAvailableDrivers({ assert }: Context) {
    const availableDrivers = StoreFactory.availableDrivers()

    assert.deepEqual(availableDrivers, ['memory'])
  }

  @Test()
  public async shouldBeAbleToGetAllAvailableStores({ assert }: Context) {
    const availableStores = StoreFactory.availableStores()

    assert.deepEqual(availableStores, [])
  }

  @Test()
  public async shouldBeAbleToGetAllAvailableStoresWhenTheyExist({ assert }: Context) {
    StoreFactory.setClient('test', {})

    const availableStores = StoreFactory.availableStores()

    assert.deepEqual(availableStores, ['test'])
  }

  @Test()
  public async shouldBeAbleToFabricateNewStoresAndReturnMemoryDriverInstance({ assert }: Context) {
    const driver = StoreFactory.fabricate('memory')

    assert.instanceOf(driver, MemoryDriver)
  }

  @Test()
  public async shouldThrowNotImplementedConfigExceptionWhenTryingToUseANotImplementedDriver({ assert }: Context) {
    assert.throws(() => StoreFactory.fabricate('not-found-store'), NotImplementedConfigException)
  }

  @Test()
  public async shouldThrowNotFoundDriverExceptionWhenTryingToUseADriverThatDoesNotExist({ assert }: Context) {
    assert.throws(() => StoreFactory.fabricate('not-found'), NotFoundDriverException)
  }

  @Test()
  public async shouldBeAbleToCreateOwnDriverImplementationToUseWithinCacheFacade({ assert }: Context) {
    StoreFactory.createDriver('test', TestDriver)

    const testDriver = StoreFactory.fabricate('test')

    assert.instanceOf(testDriver, TestDriver)

    StoreFactory.drivers.delete('test')
    StoreFactory.stores.delete('test')
  }
}
