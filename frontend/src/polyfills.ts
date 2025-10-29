import { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Global {
    Buffer: typeof Buffer;
  }
}

const globalRef: typeof globalThis = typeof globalThis !== "undefined" ? globalThis : (window as typeof globalThis);

if (globalRef.Buffer !== Buffer) {
  // @ts-expect-error: Buffer is being defined on the global object at runtime
  globalRef.Buffer = Buffer;
}
