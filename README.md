# enfetch

A minimal, extensible fetch wrapper with a plugin-based architecture. Built around the standard `Request` and `Response` objects.

## Features

- 🔌 **Plugin-based architecture** - Extend functionality with lifecycle hooks
- 🔄 **Retry support** - Configurable retry logic with custom strategies
- ⏱️ **Timeout handling** - Built-in timeout plugin
- 🎯 **Type-safe** - Full TypeScript support
- 🪶 **Lightweight** - Minimal dependencies

## Installation

```bash
npm install enfetch
```

## Basic Usage

```typescript
import { createFetcher } from 'enfetch';

// Create a basic fetch client
const fetcher = createFetcher();

// Use it like fetch
const req = new Request('https://api.example.com/data');
const res = await fetcher(req);
```

## Plugins

Plugins can hook into the request/response lifecycle through three hooks:

```typescript
import type { EnfetchPlugin } from 'enfetch';

const myPlugin: EnfetchPlugin = {
  name: 'my-plugin',

  // Modify request before sending
  onBeforeRequest: async (req) => {
    // Return a new Request to modify it
    return new Request(req, {
      headers: { ...req.headers, 'X-Custom': 'value' }
    });
  },

  // Handle successful responses
  onAfterResponse: async (res, req) => {
    console.log(`${req.url} -> ${res.status}`);
  },

  // Handle errors
  onError: async (req, err) => {
    console.error(`Request to ${req.url} failed:`, err);
  }
};

const fetcher = createFetcher({ plugins: [myPlugin] });
```

### Built-in Plugins

#### Timeout

Add request timeout:

```typescript
import { createFetcher } from 'enfetch';
import { timeout } from 'enfetch/timeout';

const fetcher = createFetcher({
  plugins: [timeout(5000)] // 5 second timeout
});
```

## Retry

The retry functionality is built as a separate client wrapper that allows flexible retry strategies:

```typescript
import { createFetcher } from 'enfetch';
import { createRetryClient, defaultShouldRetry } from 'enfetch/retry';

const baseFetcher = createFetcher();

const retryFetcher = createRetryClient(baseFetcher, {
  maxRetries: 3,
  delay: 1000, // Fixed delay in ms
  shouldRetry: defaultShouldRetry
});
```

### Custom Retry Logic

You can customize retry behavior with a `shouldRetry` function:

```typescript
import { createRetryClient } from 'enfetch/retry';
import type { RetryContext } from 'enfetch/retry';

const retryFetcher = createRetryClient(baseFetcher, {
  maxRetries: 5,

  // Dynamic delay with exponential backoff
  delay: (ctx) => Math.pow(2, ctx.retries) * 1000,

  // Custom retry logic
  shouldRetry: (ctx) => {
    // Retry on network errors
    if (ctx.isError) {
      return true;
    }

    // Retry on specific status codes
    return [429, 500, 502, 503, 504].includes(ctx.res.status);
  }
});
```

### Retry Context

The `RetryContext` provides information for making retry decisions:

```typescript
type RetryContext = {
  retries: number;  // Current retry count
  req: Request;     // The request being retried
} & (
  | { isError: true; error: unknown }      // Network error case
  | { isError: false; res: Response }      // Response case
);
```

## Composing Clients

You can compose retry clients with plugin-based clients:

```typescript
import { createFetcher } from 'enfetch';
import { createRetryClient } from 'enfetch/retry';
import { timeout } from 'enfetch/timeout';

// Create base client with plugins
const baseFetcher = createFetcher({
  plugins: [timeout(5000)]
});

// Wrap with retry logic
const fetcher = createRetryClient(baseFetcher, {
  maxRetries: 3,
  delay: (ctx) => ctx.retries * 1000
});

// Use the composed client
const req = new Request('https://api.example.com/data');
const res = await fetcher(req);
```

## Custom Fetcher

You can provide a custom base fetcher:

```typescript
import { createFetcher } from 'enfetch';

const fetcher = createFetcher({
  fetcher: customFetch // Use custom fetch implementation
});
```

## API

### `createFetcher(opts?)`

Creates a fetch client with plugins.

- `opts.plugins`: Optional array of `EnfetchPlugin` objects
- `opts.fetcher`: Optional custom fetch implementation (defaults to global `fetch`)

Returns an `Enfetch` function: `(req: Request) => Promise<Response>`

### `createRetryClient(fetcher, options)`

Wraps a fetcher with retry logic.

- `fetcher`: Base `Enfetch` function to wrap
- `options.maxRetries`: Maximum retry attempts (default: 3)
- `options.delay`: Fixed delay in ms or function `(ctx: RetryContext) => number`
- `options.shouldRetry`: Function to determine if retry should happen (default: `defaultShouldRetry`)

### `timeout(ms)`

Creates a timeout plugin.

- `ms`: Timeout in milliseconds

### `defaultShouldRetry(ctx)`

Default retry strategy that retries on:
- Network errors
- Status codes: 429, 500, 502, 503, 504

## License

ISC
