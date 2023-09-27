import Redis from '@ioc:Adonis/Addons/Redis'
import { Transport } from '@ioc:Adonis/Addons/Transmit'

export class RedisTransport implements Transport {
  constructor(private redis: typeof Redis) {}

  public async send(channel: string, payload: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(payload))
  }

  public subscribe(channel: string, handler: any): any {
    return this.redis.subscribe(channel, handler)
  }

  public unsubscribe(channel: string): any {
    return this.redis.unsubscribe(channel)
  }
}
