export {};

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}
