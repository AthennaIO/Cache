/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Facade } from '@athenna/ioc'
import type { CacheImpl } from '#src/cache/CacheImpl'

export const Cache = Facade.createFor<CacheImpl>('Athenna/Core/Cache')
