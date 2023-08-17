![adonis-transmit](https://socialify.git.ci/Bright-Hustle/adonis-transmit?language=1&logo=https%3A%2F%2Fbrighthustle.in%2Fassets%2Fimages%2Fmisc%2Ffront_banner.png&name=1&owner=1&stargazers=1&theme=Light)

## What's this

This package makes it easy for developers to implement sse service in the AdonisJS 5 application.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Channels](#channels)
  - [Channel Names](#channel-names)
  - [Channel Authorization](#channel-authorization)
- [Events](#events)


## Setup

Install the package using npm or yarn:

```bash
npm i @brighthustle/adonis-transmit
# or
yarn add @brighthustle/adonis-transmit
```

Then, configure the package using the configure command:

```bash
node ace configure @brighthustle/adonis-transmit
```

## Usage

The module exposes a `transmit` instance, which can be used to send events to the client.

```ts
import transmit from '@adonisjs/transmit/services/main'

// Anywhere in your code
transmit.broadcast('channelName', { username: 'lanz' })
```

## Channels

Channels are a way to group events. For example, you can have a channel for `users` and another for `posts`. The client can subscribe to one or more channels to receive events.

### Channel Names

Channels names must be a string and must not contain any special characters except `/`. The following are valid channel names.

```ts
transmit.broadcast('users', { username: 'lanz' })
transmit.broadcast('users/1', { username: 'lanz' })
transmit.broadcast('users/1/posts', { username: 'lanz' })
```

### Channel Authorization

You can mark a channel as private and then authorize the client to subscribe to it. The authorization is done using a callback function.

```ts
import type { HttpContext } from '@adonisjs/core/http'

transmit.authorizeChannel<{ id: string }>('users/:id', (ctx: HttpContext, { id }) => {
  return ctx.auth.user?.id === +id
})
```

When a client tries to subscribe to a private channel, the callback function is invoked with the channel params and the HTTP context. The callback function must return a boolean value to allow or disallow the subscription.

# Events

Transmit uses [Emittery](https://github.com/sindresorhus/emittery) to emit any lifecycle events. You can listen for events using the `on` method.

```ts
transmit.on('connect', ({ uid }) => {
  console.log(`Connected: ${uid}`)
})

transmit.on('disconnect', ({ uid }) => {
  console.log(`Disconnected: ${uid}`)
})

transmit.on('broadcast', ({ channel }) => {
  console.log(`Broadcasted to channel ${channel}`)
})

transmit.on('subscribe', ({ uid, channel }) => {
  console.log(`Subscribed ${uid} to ${channel}`)
})

transmit.on('unsubscribe', ({ uid, channel }) => {
  console.log(`Unsubscribed ${uid} from ${channel}`)
})
```

## Changelog

Please see the [CHANGELOG](./CHANGELOG.md) for more information on what has changed recently.

## License

The MIT License (MIT). Please see [LICENSE](./LICENSE.md) file for more information.

## Disclaimer

This package is not officially maintained by Adonis. This page is migrated for Adonis v5 from original author plugin for Adonis v6, Inc.
