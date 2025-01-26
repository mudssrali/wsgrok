# Wssgrok

WebSocket API wrapper for creating and managing WebSocket connections

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
<a aria-label="Package size" href="https://bundlephobia.com/result?p=wssgrok">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/wssgrok">
</a>


## Install

Install with npm or yarn via

```
yarn add wssgrok
```

or

```
npm i wssgrok
```

## API

```ts
type Event = "connect" | "disconnect" | "message" | "verify"
interface Wssgrok {
    url: string
    ready: boolean
    ws?: WebSocket
    pingInterval?: number
    pending: Map<string, {
        resolve: (a: any) => any
        reject: (a: any) => any
    }>
    messageTimeout: number
    connectionVerified: boolean
    verify(): void
    connect(): Promise<void>
    on(event: Event, f: Function): void
    onNext(event: Event, f: Function): void
    cleanup(): void
    ping(): void
    send(message: any, timeout?: number): Promise<any>
}
```

## Usage

- Use `Wssgrok` with events

  ```ts
  import Wssgrok from 'wssgrok'

  const wssgrok = new Wssgrok("wss://example.com/ws")

  // on connected to host
  wssgrok.on('connect', () => console.log("connected to a host"))

  // on disconnected from a host
  wssgrok.on('disconnect', () => console.log("disconnected from a host"))

  // on receiving a new message from host
  wssgrok.on('message', (message: any) => console.log("new message", message))

  // on verify a connection to host
  wssgrok.on('verify', () => console.log("connection is verified"))
  ```

- Make a request to host using `wssgrok.Send()` with `Promise`

  ```ts
  import Wssgrok from 'wssgrok'
  export const invokeService = () => {
    const wssgrok = new Wssgrok("wss://www.example.com/ws")

    wssgrok.send({
      type: "INVOKE_SERVICE",
      clientType: "XNGINX"
      payload: {
        initiatorId: "xxxx-xxxx-xxxx"
        reqToken: "xxxx-xxxx-xxxx"
      }
    })
      .then(response => {
        // do your work here
      })
      .catch(error => {
        // do your work here
      })
  }
  ```

  `Or with async arrow style`

  ```ts
  import Wssgrok from 'wssgrok'

  export const invokeService = aysnc () => {
    const wssgrok = new Wssgrok("wss://www.example.com/ws")

    try {
      const response = await wssgrok.send({
        type: "INVOKE_SERVICE",
        clientType: "XNGINX",
        payload: {
          initiatorId: "xxxx-xxxx-xxxx"
          reqToken: "xxxx-xxxx-xxxx"
        }
      })
  
      // handle server response here

    } catch(error) {
      // handle server error here
    }
  }
  ```