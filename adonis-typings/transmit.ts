declare module '@ioc:Adonis/Addons/Transmit' {
  export interface Transport {
    send(channel: string, payload: any): Promise<void>
    subscribe(channel: string, handler: any): Promise<void>
    unsubscribe(channel: string): Promise<void>
  }

  export interface TransmitConfig {
    transport: false | { driver: string }
  }

  export interface TransmitContract {
    broadcast(
      channel: string,
      payload: Record<string, unknown>,
      internal?: boolean,
      from?: string
    ): void

    createStream(ctx: any): void

    subscribeToChannel(uid: string, channel: string, ctx: any): Promise<boolean>

    unsubscribeFromChannel(uid: string, channel: string): boolean
  }

  const Transmit: TransmitContract
  export default Transmit
}
