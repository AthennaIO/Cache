/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { File, Path } from '@athenna/common'
import { BaseConfigurer } from '@athenna/artisan'

export default class CacheConfigurer extends BaseConfigurer {
  public async configure() {
    const task = this.logger.task()

    task.addPromise(`Create cache.${Path.ext()} config file`, () => {
      return new File('./cache').copy(Path.config(`cache.${Path.ext()}`))
    })

    task.addPromise('Update providers of .athennarc.json', () => {
      return this.rc
        .pushTo('providers', '@athenna/cache/providers/CacheProvider')
        .save()
    })

    await task.run()

    console.log()
    this.logger.success(
      'Successfully configured ({dim,yellow} @athenna/cache) library'
    )
  }
}
