import Emittery from 'emittery'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Stream } from './Stream'
import { StorageBag } from './storage_bag'
import { SecureChannelStore } from './secure_channel_store'
import { TransmitConfig, TransmitContract, Transport } from '@ioc:Adonis/Addons/Transmit'
import { TransportMessageType } from './Types/transportMessage'

interface TransmitHooks {
  connect: { uid: string; ctx: HttpContextContract }
  disconnect: { uid: string; ctx: HttpContextContract }
  broadcast: { channel: string; payload: Record<string, unknown> }
  subscribe: { uid: string; channel: string; ctx: HttpContextContract }
  unsubscribe: { uid: string; channel: string; ctx: HttpContextContract }
}

type TransmitMessage =
  | {
      type: typeof TransportMessageType.Broadcast
      channel: string
      payload: Record<string, any>
    }
  | {
      type: typeof TransportMessageType.Subscribe
      channel: string
      payload: { uid: string }
    }
  | {
      type: typeof TransportMessageType.Unsubscribe
      channel: string
      payload: { uid: string }
    }

export default class Transmit extends Emittery<TransmitHooks> implements TransmitContract {
  /**
   * The storage bag instance to store all the streams.
   */
  private storage: StorageBag

  /**
   * The secure channel store instance to store all the secure channel definitions.
   */
  private secureChannelStore: SecureChannelStore

  /**
   * The secure channel store instance to store all the secure channel callbacks.
   */
  private secureChannelCallbacks: Map<
    string,
    (ctx: HttpContextContract, params?: any) => Promise<boolean> | boolean
  > = new Map()

  /**
   * The transport provider to synchronize messages and subscriptions
   * across multiple instance.
   */
  private transport: Transport | null

  /**
   * The config for the transmit instance.
   */
  private config: TransmitConfig

  /**
   * The interval to send ping messages to all the subscribers.
   */
  private readonly interval: NodeJS.Timeout | undefined

  constructor(config: TransmitConfig, transport: Transport | null) {
    super()

    this.config = config
    this.storage = new StorageBag()
    this.secureChannelStore = new SecureChannelStore()
    this.transport = transport

    // @ts-ignore
    void this.transport?.subscribe<TransmitMessage>(this.#config.transport.channel, (message) => {
      const { type, channel, payload } = message

      if (type === TransportMessageType.Broadcast) {
        void this.broadcastLocally(channel, payload)
      } else if (type === TransportMessageType.Subscribe) {
        void this.storage.addChannelToStream(payload.uid, channel)
      } else if (type === TransportMessageType.Unsubscribe) {
        void this.storage.removeChannelFromStream(payload.uid, channel)
      }
    })

    function parseMilliseconds(interval: string): number {
      const units: { [key: string]: number } = {
        ms: 1,
        s: 1000,
        m: 60000,
        h: 3600000,
      }

      const match = interval.match(/^(\d+)(ms|s|m|h)$/)
      if (match) {
        const value = parseInt(match[1], 10)
        const unit = match[2]
        return value * units[unit]
      }

      throw new Error('Invalid interval format')
    }

    if (this.config.pingInterval) {
      const intervalValue =
        typeof this.config.pingInterval === 'number'
          ? this.config.pingInterval
          : parseMilliseconds(this.config.pingInterval)

      this.interval = setInterval(() => this.ping(), intervalValue)
    }
  }

  /**
   * Creates and register a new stream for the given request and pipes it to the response.
   */
  public createStream(ctx: HttpContextContract): Stream {
    const { request, response } = ctx

    if (!request.input('uid')) {
      throw new Error('Missing required field "uid" in the request body')
    }

    const stream = new Stream(ctx.request.input('uid'), ctx.request.request)
    stream.pipe(response.response, undefined, response.getHeaders())

    void this.emit('connect', { uid: stream.getUid(), ctx })

    this.storage.push(stream)

    response.response.on('close', () => {
      void this.emit('disconnect', { uid: stream.getUid(), ctx })
      this.storage.remove(stream)
    })

    response.stream(stream)

    return stream
  }

  /**
   * Store the authorization callback for the given channel.
   */
  public authorizeChannel<T = undefined>(
    channel: string,
    callback: (ctx: HttpContextContract, params: T) => Promise<boolean>
  ) {
    this.secureChannelStore.add(channel)
    this.secureChannelCallbacks.set(channel, callback)
  }

  public ping() {
    this.storage.getAllSubscribers()

    for (const [stream] of this.storage.getAllSubscribers()) {
      stream.writeMessage({ data: { channel: '$$transmit/ping', payload: {} } })
    }
  }

  public getClients() {
    return Array.from(this.storage.getAllSubscribers()).map(([stream]) => stream.getUid())
  }

  public getSubscriptionsForClient(uid: string) {
    const channels = this.storage.getChannelByClient(uid)
    return channels ? Array.from(channels) : []
  }

  public async subscribeToChannel(
    uid: string,
    channel: string,
    ctx: HttpContextContract
  ): Promise<boolean> {
    const definitions = this.secureChannelStore.match(channel)

    if (definitions) {
      const callback = this.secureChannelCallbacks.get(definitions.url)

      if (!callback) {
        return false
      }

      try {
        const result = await callback(ctx, definitions.params)
        if (!result) {
          ctx.response.forbidden()
          return false
        }
      } catch (e) {
        ctx.response.internalServerError()
        return false
      }
    }

    void this.emit('subscribe', { uid, channel, ctx })
    void this.transport?.send(this.config.transport!.channel!, {
      type: TransportMessageType.Subscribe,
      channel,
      payload: { uid },
    })

    return this.storage.addChannelToStream(uid, channel)
  }

  public unsubscribeFromChannel(uid: string, channel: string, ctx: HttpContextContract): boolean {
    void this.emit('unsubscribe', { uid, channel, ctx })

    void this.transport?.send(this.config.transport!.channel!, {
      type: TransportMessageType.Unsubscribe,
      channel,
      payload: { uid },
    })
    this.storage.removeChannelFromStream(uid, channel)
    return true
  }

  private broadcastLocally(
    channel: string,
    payload: Record<string, unknown>,
    senderUid?: string | string[]
  ) {
    const subscribers = this.storage.findByChannel(channel)

    for (const subscriber of subscribers) {
      if (
        Array.isArray(senderUid)
          ? senderUid.includes(subscriber.getUid())
          : senderUid === subscriber.getUid()
      ) {
        continue
      }

      subscriber.writeMessage({ data: { channel, payload } })
    }
  }

  public broadcastExcept(
    channel: string,
    payload: Record<string, unknown>,
    senderUid: string | string[]
  ) {
    return this.broadcastLocally(channel, payload, senderUid)
  }

  public async broadcast(channel: string, payload: Record<string, unknown>) {
    if (!payload) {
      payload = {}
    }

    void this.transport?.send(this.config.transport!.channel!, {
      type: TransportMessageType.Broadcast,
      payload,
    })
    this.broadcastLocally(channel, payload)

    void this.emit('broadcast', { channel, payload })
  }

  public async shutdown() {
    if (this.interval) {
      clearInterval(this.interval)
    }

    await this.transport?.disconnect()
  }
}
