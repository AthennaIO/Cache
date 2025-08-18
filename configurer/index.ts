/**
 * @athenna/cache
 *
 * (c) João Lenon <lenon@athenna.io>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseConfigurer } from '@athenna/artisan'
import { File, Path, Parser, Module } from '@athenna/common'

export default class CacheConfigurer extends BaseConfigurer {
  public async configure() {
    const stores = await this.prompt.checkbox(
      'Which cache stores do you plan to use?',
      ['redis', 'memory']
    )

    const task = this.logger.task()
    const hasSelectedRedis = stores.find(store => store === 'redis')

    task.addPromise(`Create cache.${Path.ext()} config file`, () => {
      return new File('./cache').copy(Path.config(`cache.${Path.ext()}`))
    })

    task.addPromise('Update providers of .athennarc.json', () => {
      return this.rc
        .pushTo('providers', '@athenna/cache/providers/CacheProvider')
        .save()
    })

    task.addPromise('Update .env, .env.test and .env.example', () => {
      let envs = '\nCACHE_STORE=memory\n'

      if (hasSelectedRedis) {
        envs += 'REDIS_URL=redis://localhost:6379?database=0\n'
      }

      return new File(Path.pwd('.env'), '')
        .append(envs)
        .then(() => new File(Path.pwd('.env.test'), '').append(envs))
        .then(() => new File(Path.pwd('.env.example'), '').append(envs))
    })

    if (hasSelectedRedis) {
      task.addPromise('Add service to docker-compose.yml file', async () => {
        const hasDockerCompose = await File.exists(
          Path.pwd('docker-compose.yml')
        )

        if (hasDockerCompose) {
          const docker = await new File(
            Path.pwd('docker-compose.yml')
          ).getContentAsYaml()

          docker.services.redis = await Module.get(
            import('./docker/redis/service.js')
          )

          return new File(Path.pwd('docker-compose.yml')).setContent(
            Parser.objectToYamlString(docker)
          )
        }

        return new File(`./docker/redis/file.yml`).copy(
          Path.pwd('docker-compose.yml')
        )
      })
    }

    const libraries = {
      redis: ['redis'],
      memory: ['lru-cache']
    }

    task.addPromise(`Install ${stores.join(', ')} libraries`, () => {
      return stores.athenna.concurrently(store => {
        return this.npm.install(libraries[store])
      })
    })

    await task.run()

    console.log()
    this.logger.success(
      'Successfully configured ({dim,yellow} @athenna/cache) library'
    )
  }
}
