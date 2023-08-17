declare module '@ioc:Adonis/Core/Application' {
  import { TransmitContract } from '@ioc:Adonis/Addons/Transmit'

  export interface ContainerBindings {
    'Adonis/Addons/Transmit': TransmitContract
  }
}
