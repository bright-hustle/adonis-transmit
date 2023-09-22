import Redis from '@ioc:Adonis/Addons/Redis'
import { Transport } from '@ioc:Adonis/Addons/Transmit'

export class RedisTransport implements Transport {
  #client!: typeof Redis

  constructor(redis: typeof Redis) {
    this.#client = redis
  }

  public async send(channel: string, payload: any): Promise<void> {
    await this.#client.publish(channel, JSON.stringify(payload))
  }

  public subscribe(channel: string, handler: any): Promise<void> {
    return Promise.resolve(this.#client.subscribe(channel, handler))
  }

  public unsubscribe(channel: string): Promise<void> {
    return Promise.resolve(this.#client.unsubscribe(channel))
  }
}
