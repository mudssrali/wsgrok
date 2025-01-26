import sleep from "./sleep";
import { v4 as uuid4 } from "uuid";

type Event = "connect" | "disconnect" | "message" | "verify";

const PING_INTERVAL_MS = 5_000;
const RECONNECT_DELAY_MS = 10_000;
const MESSAGE_TIMEOUT_MS = 10_000;

/**
 * Class representing a WebSocket connection with additional features.
 */
export default class Wssgrok {
  url: string;
  ready: boolean;
  ws?: WebSocket;
  pingInterval?: number;
  pending: Map<string, { resolve: (a: any) => any; reject: (a: any) => any }>;
  messageTimeout: number;
  connectionVerified: boolean;

  private onEventFunctions: Record<Event, Function[]>;
  private onNextEventFunctions: Record<Event, Function[]>;

  constructor(url: string) {
    this.url = url;
    this.ready = false;
    this.ws = undefined;
    this.pingInterval = undefined;
    this.messageTimeout = MESSAGE_TIMEOUT_MS;
    this.connectionVerified = false;

    this.pending = new Map(); // key: uuid, value: promise

    this.onEventFunctions = {
      connect: [],
      disconnect: [],
      message: [],
      verify: [],
    };
    this.onNextEventFunctions = {
      connect: [],
      disconnect: [],
      message: [],
      verify: [],
    };

    this.connect();
  }

  /**
   * Verifies the connection.
   */
  public verify(): void {
    this.connectionVerified = true;
    this.trigger("verify");
  }

  /**
   * Establishes a WebSocket connection.
   */
  async connect(): Promise<void> {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.ready = true;
      clearInterval(this.pingInterval);
      this.pingInterval = window.setInterval(() => this.ping(), PING_INTERVAL_MS);

      this.trigger("connect");
    };

    this.ws.onclose = async (event) => {
      if (this.ready) {
        this.pending.forEach((promise) => promise.reject("disconnect"));

        this.trigger("disconnect", event);
      }

      this.connectionVerified = false;
      this.cleanup();
      await sleep(RECONNECT_DELAY_MS * Math.random() + 1000);
      this.connect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      console.log(`[${new Date().toISOString()}] Server: ${msg.type}`);

      if (msg.key) {
        const promise = this.pending.get(msg.key);
        if (promise === undefined) {
          console.error("Message not found in queue - will not process");
          return;
        }

        if (msg.type === "failure") {
          promise.reject(msg.payload);
        } else {
          promise.resolve(msg.payload);
        }
        this.pending.delete(msg.key);
      } else {
        this.trigger("message", msg);
      }
    };
  }

  /**
   * Registers an event handler for a specific event.
   * @param event - The event to listen for.
   * @param f - The event handler function.
   */
  on(event: Event, f: Function): void {
    this.onEventFunctions[event].push(f);
  }

  /**
   * Registers a one-time event handler for a specific event.
   * @param event - The event to listen for.
   * @param f - The event handler function.
   */
  onNext(event: Event, f: Function): void {
    this.onNextEventFunctions[event].push(f);
  }

  /**
   * Triggers an event and calls all registered handlers.
   * @param event - The event to trigger.
   * @param args - Arguments to pass to the event handlers.
   */
  private trigger(event: Event, ...args: any[]): void {
    this.onEventFunctions[event].forEach((f) => f(...args));

    this.onNextEventFunctions[event].forEach((f) => f(...args));
    this.onNextEventFunctions[event] = [];
  }

  /**
   * Cleans up the WebSocket connection.
   */
  cleanup(): void {
    this.ready = false;
    clearInterval(this.pingInterval);
    this.ws = undefined;
  }

  /**
   * Sends a ping message to the server.
   */
  ping(): void {
    if (this.ready) {
      try {
        this.ws && this.ws.send("ping");
      } catch (exception) {
        console.error(exception);
      }
    }
  }

  /**
   * Sends a message to the server and returns a promise that resolves with the response.
   * @param message - The message to send.
   * @param timeout - Optional timeout for the message.
   * @returns A promise that resolves with the response.
   */
  async send(message: any, timeout?: number): Promise<any> {
    if (!this.ready) {
      throw new Error("not ready");
    }

    console.log(`[${new Date().toISOString()}] Server: ${message}`);

    const key = uuid4();

    return new Promise<any>((resolve, reject) => {
      this.pending.set(key, { resolve, reject });

      if (!this.ws) {
        reject("ws is undefined");
      } else {
        this.ws.send(
          JSON.stringify({
            key,
            payload: message,
          }),
        );
      }

      setTimeout(() => {
        const p = this.pending.get(key);
        if (p) {
          console.log("msg timeout!");
          p.reject("timeout");
        }
        this.pending.delete(key);
      }, timeout ?? this.messageTimeout);
    });
  }
}