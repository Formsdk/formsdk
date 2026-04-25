# formsdk

Zero-lock-in, framework-agnostic Form SDK.

## Quick Start

```ts
// lib/formsdk.ts
import { createForm, handleRequest, setEnv, registerDBAdapter } from "formsdk";
import { createPostgresAdapter } from "formsdk/adapters/postgres";

setEnv({
  TURNSTILE_SECRET: process.env.TURNSTILE_SECRET
});

registerDBAdapter("postgres", createPostgresAdapter({
  query: Bun.sql,
  table: "contacts"
}));

export { createForm, handleRequest };
```

```ts
// lib/forms.ts
import { createForm } from "./formsdk";

export const contactForm = createForm({
  fields: {
    email: (v) => typeof v === "string" && v.includes("@"),
    message: (v) => typeof v === "string" && v.length > 10
  },
  captcha: "turnstile",
  db: "postgres",
  onSubmit: async (data, ctx) => {
    console.log("saved", data);
  }
});
```

```ts
// In your handler
const result = await handleRequest({
  config: contactForm,
  body: { email: "test@example.com", message: "Hello world!" },
  ctx: { ip: "1.2.3.4" }
});
```

## Core API

### `setEnv(config)`

Configure environment variables programmatically (optional - also reads from `process.env`).

```ts
setEnv({
  TURNSTILE_SECRET: "your_secret"
});
```

### `registerDBAdapter(name, adapter)`

Register a database adapter.

```ts
registerDBAdapter("postgres", createPostgresAdapter({ query: Bun.sql }));
```

### `createForm(config)`

Creates a form definition.

```ts
const form = createForm({
  fields: {
    email: (v) => typeof v === "string" && v.includes("@"),
    name: (v) => typeof v === "string" && v.length > 0
  },
  captcha: "turnstile",
  db: "postgres",
  onSubmit: async (data, ctx) => { /* ... */ }
});
```

### `handleRequest(options)`

Processes a form submission.

```ts
const result = await handleRequest({
  config: form,
  body: { email: "test@example.com" },
  ctx: { ip: "1.2.3.4", headers: {} }
});
```

Returns:
```ts
{ success: boolean; errors?: FieldError[]; message?: string }
```

## Adapters

### Database Adapters

- **postgres** - Uses `Bun.sql` for PostgreSQL

### Captcha Adapters

- **turnstile** - Cloudflare Turnstile (set via `TURNSTILE_SECRET` env var or `setEnv()`)

## Framework Guides

- [SvelteKit](./sveltekit.md)
- [Astro](./astro.md)
- [Next.js](./nextjs.md)