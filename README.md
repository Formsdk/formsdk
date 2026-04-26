# FormSDK - Zero-Lock-In Form Management

Framework-agnostic form state management with server-side validation.

## Features

**Client-Side**
- `useForm` hook for React form state
- Field registration with `register()`
- Built-in validation (custom validator functions)
- Status tracking (`idle`, `loading`, `success`, `error`)
- Field-level errors and error clearing
- Form reset with `reset()`
- Request deduplication
- Keepalive via `navigator.sendBeacon`

**Server-Side**
- `handleRequest` for validation
- Custom field validators
- Cloudflare Turnstile captcha support
- IP and header context passing

**Database Adapters**
- PostgreSQL, Supabase, Neon, Turso
- Drizzle ORM, Prisma, Better Auth

**Bundle Size**
- ~3KB gzipped (useForm)
- ~10KB gzipped (handleRequest + adapters)

## Quick Start

```tsx
// Client
import { useForm } from "@formsdk/react";

const { register, handleSubmit, formState: { errors } } = useForm({
  action: "/api/contact",
});
```

```ts
// Server
import { handleRequest } from "@formsdk/core";

const result = await handleRequest({
  config: {
    fields: {
      email: (v) => typeof v === "string" && v.includes("@"),
    },
  },
  body: await req.json(),
});
```

## License

MIT
