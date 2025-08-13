/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Path, Exception } from '@athenna/common'
import { StoreFactory } from '#src/factories/StoreFactory'

export class NotFoundDriverException extends Exception {
  public constructor(driver: string) {
    const message = `The driver ${driver} has not been found.`
    const availableDrivers = StoreFactory.availableDrivers().join(', ')

    super({
      message,
      code: 'E_NOT_FOUND_DRIVER_ERROR',
      help: `Available drivers are: ${availableDrivers}. Look into your config/cache.${Path.ext()} file if ${driver} driver is implemented by cache.`
    })
  }
}
