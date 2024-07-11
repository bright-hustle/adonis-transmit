declare module '@ioc:Adonis/Addons/Transmit' {
  import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

  export interface Transport {
    send(channel: string, payload: any): Promise<void>
    subscribe(channel: string, handler: any): Promise<void>
    unsubscribe(channel: string): Promise<void>
    disconnect(): Promise<void>
  }

  /**
   * A Duration can be a number in milliseconds or a string formatted as a duration
   *
   * Formats accepted are :
   * - Simple number in milliseconds
   * - String formatted as a duration. Uses https://github.com/lukeed/ms under the hood
   */
  export type Duration = number | string

  export interface TransmitConfig {
    pingInterval: Duration | false
    transport: null | { driver: string; channel?: string }
  }
  export interface TransmitContract {
    broadcast(channel: string, payload: Record<string, unknown>): void

    createStream(ctx: HttpContextContract): void

    subscribeToChannel(uid: string, channel: string, ctx: HttpContextContract): Promise<boolean>

    unsubscribeFromChannel(uid: string, channel: string, ctx: HttpContextContract): boolean

    broadcastExcept(channel: string, payload: Record<string, unknown>, senderUid: string | string[])
  }

  const Transmit: TransmitContract
  export default Transmit
}
