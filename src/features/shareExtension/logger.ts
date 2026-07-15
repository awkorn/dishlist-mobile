// Tiny prefixed logger for the share extension. The extension runs in its own
// process, so its console output is separate from the main app's — the prefix
// makes it easy to spot in the Metro/Xcode console. Kept dependency-free so it
// can be imported anywhere in the extension bundle.

const PREFIX = "[ShareExtension]";

export const shareLog = {
  info(message: string, ...args: unknown[]) {
    console.log(`${PREFIX} ${message}`, ...args);
  },
  warn(message: string, ...args: unknown[]) {
    console.warn(`${PREFIX} ${message}`, ...args);
  },
  error(message: string, ...args: unknown[]) {
    console.error(`${PREFIX} ${message}`, ...args);
  },
};
