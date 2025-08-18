/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default {
  container_name: 'athenna_redis',
  image: 'redis',
  ports: ['6379:6379']
}
