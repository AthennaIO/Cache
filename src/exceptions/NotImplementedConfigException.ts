/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Path, Exception, Is } from '@athenna/common'

export class NotImplementedConfigException extends Exception {
  public constructor(con: string) {
    let help = ''

    const stores = Config.get('cache.stores')

    if (stores && !Is.Empty(stores)) {
      const availableConfigs = Object.keys(stores).join(', ')

      help += `Available configurations are: ${availableConfigs}.`
    } else {
      help += `The "Config.get('cache.stores')" is empty, maybe your configuration files are not loaded?`
    }

    help += ` Create your configuration inside connections object to use it. Or load your configuration files using "Config.safeLoad(Path.config('cache.${Path.ext()}'))`

    super({
      status: 500,
      code: 'E_NOT_IMPLEMENTED_CONFIG_ERROR',
      message: `Connection ${con} is not configured inside cache.stores object from config/cache.${Path.ext()} file.`,
      help
    })
  }
}
