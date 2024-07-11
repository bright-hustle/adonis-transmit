import matchit from '@poppinss/matchit'

export class SecureChannelStore {
  private securedChannelsDefinition: any[] = []

  public add(channel: string) {
    const encodedDefinition = matchit.parse(channel)

    this.securedChannelsDefinition.push(encodedDefinition)
  }

  public match(channel: string) {
    const matchedChannel = matchit.match(channel, this.securedChannelsDefinition)

    if (matchedChannel.length > 0) {
      const params = matchit.exec(channel, matchedChannel)
      return { params, url: matchedChannel[0].old }
    }
  }
}
