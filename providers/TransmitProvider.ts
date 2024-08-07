import { Transport } from '@ioc:Adonis/Addons/Transmit'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Transmit from '../src/Transmit'
import { RedisTransport } from '../transports/RedisTransport'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class TransmitProvider {
  public static needsApplication = true
  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonis/Addons/Transmit', () => {
      const config = this.app.config.get('transmit', {})
      let transport: Transport | null = null

      if (config.transport && config.transport.driver && config.transport.driver === 'redis') {
        const redis: typeof Redis = this.app.container.make('Adonis/Addons/Redis')
        transport = new RedisTransport(redis)
      }

      return new Transmit(config, transport)
    })
  }

  public async boot() {
    const router = await this.app.container.make('Adonis/Core/Route')
    const transmit = await this.app.container.make('Adonis/Addons/Transmit')

    router.get('__transmit/events', (ctx: HttpContextContract) => {
      transmit.createStream(ctx)
    })

    router.post('__transmit/subscribe', async (ctx: HttpContextContract) => {
      const uid = ctx.request.input('uid')
      const channel = ctx.request.input('channel')

      const success = await transmit.subscribeToChannel(uid, channel, ctx)
      if (!success) {
        return ctx.response.badRequest()
      }

      return ctx.response.noContent()
    })

    router.post('__transmit/unsubscribe', (ctx: HttpContextContract) => {
      const uid = ctx.request.input('uid')
      const channel = ctx.request.input('channel')

      const success = transmit.unsubscribeFromChannel(uid, channel, ctx)

      if (!success) {
        return ctx.response.badRequest()
      }

      return ctx.response.noContent()
    })
  }

  public async shutdown() {
    const transmit = await this.app.container.make('Adonis/Addons/Transmit')

    await transmit.shutdown()
  }
}
