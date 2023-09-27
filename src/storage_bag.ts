import type { Stream } from './Stream'

export class StorageBag {
  #subscribers = new Map<Stream, Set<string>>()
  #channelByUid = new Map<string, Set<string>>()

  public push(stream: Stream) {
    const channels = new Set<string>()
    this.#subscribers.set(stream, channels)
    this.#channelByUid.set(stream.getUid(), channels)
  }

  public remove(stream: Stream) {
    this.#subscribers.delete(stream)
    this.#channelByUid.delete(stream.getUid())
  }

  public addChannelToStream(uid: string, channel: string): boolean {
    let channels = this.#channelByUid.get(uid)

    if (!channels) {
      channels = new Set<string>()
      this.#channelByUid.set(uid, channels)
    }

    channels.add(channel)

    return true
  }

  public removeChannelFromStream(uid: string, channel: string): boolean {
    const channels = this.#channelByUid.get(uid)

    if (!channels) return false

    channels.delete(channel)

    return true
  }

  public findByChannel(channel: string) {
    const subscribers = new Set<Stream>()
    for (const [stream, streamChannels] of this.#subscribers) {
      if (streamChannels.has(channel)) {
        subscribers.add(stream)
      }
    }

    return subscribers
  }

  public getChannelByClient(uid: string) {
    return this.#channelByUid.get(uid)
  }

  public getAllSubscribers() {
    return this.#subscribers
  }
}
