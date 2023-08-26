import { Transform } from 'node:stream'
import type { OutgoingHttpHeaders } from 'node:http'

function dataString(data: string | object): string {
  if (typeof data === 'object') return dataString(JSON.stringify(data))
  return data
    .split(/\r\n|\r|\n/)
    .map((line) => `data: ${line}\n`)
    .join('')
}

interface Message {
  data: string | object
  comment?: string
  event?: string
  id?: string
  retry?: number
}

interface WriteHeaders {
  writeHead?(statusCode: number, headers?: OutgoingHttpHeaders): WriteHeaders
  flushHeaders?(): void
}

export type HeaderStream = NodeJS.WritableStream & WriteHeaders

export class Stream extends Transform {
  readonly #uid: string

  constructor(uid: string, request: any) {
    super({ objectMode: true })
    this.#uid = uid
    if (request.socket) {
      request.socket.setKeepAlive(true)
      request.socket.setNoDelay(true)
      request.socket.setTimeout(0)
    }
  }

  public getUid() {
    return this.#uid
  }

  public pipe<T extends HeaderStream>(
    destination: T,
    options?: { end?: boolean },
    origin?: string
  ): T {
    if (destination.writeHead) {
      destination.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Transfer-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': origin ?? '*',
        'Access-Control-Allow-Credentials': 'true',
      })
      destination.flushHeaders?.()
    }

    // Some clients (Safari) don't trigger onopen until the first frame is received.
    destination.write(':ok\n\n')
    return super.pipe(destination, options)
  }

  public _transform(
    message: Message,
    _encoding: string,
    callback: (error?: Error | null, data?: any) => void
  ) {
    if (message.comment) this.push(`: ${message.comment}\n`)
    if (message.event) this.push(`event: ${message.event}\n`)
    if (message.id) this.push(`id: ${message.id}\n`)
    if (message.retry) this.push(`retry: ${message.retry}\n`)
    if (message.data) this.push(dataString(message.data))
    this.push('\n')
    callback()
  }

  public writeMessage(
    message: Message,
    encoding?: BufferEncoding,
    cb?: (error: Error | null | undefined) => void
  ): boolean {
    return this.write(message, encoding, cb)
  }
}
