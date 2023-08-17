declare module '@ioc:Adonis/Addons/Transmit' {
  export interface Transport {
    send(channel: string, payload: any): Promise<void>
    subscribe(channel: string, handler: any): Promise<void>
    unsubscribe(channel: string): Promise<void>
  }

  export interface TransmitConfig {
    transport: false | { driver: new (...args: any[]) => Transport; channel?: string }
  }

  export interface TransmitContract {
    broadcast(
      channel: string,
      payload: Record<string, unknown>,
      internal?: boolean,
      from?: string
    ): void
  }

  const Transmit: TransmitContract
  export default Transmit
}
