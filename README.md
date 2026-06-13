# FormSDK - Zero-Lock-In Form Management

Framework-agnostic form state management with server-side validation.

## Why FormSDK?

**Stop rewriting form boilerplate.**

Every project needs forms. Every project writes the same thing:
- Loading states
- Error handling
- Validation
- Request cancellation
- Reset logic

FormSDK gives you a consistent API across frameworks without locking you into a specific database or hosting provider.

**vs. Writing your own:**
- No need to handle `navigator.sendBeacon` for keepalive
- Automatic request deduplication (no double-submit)
- Unified error format across your entire app
- Captcha support built-in (Turnstile)
- Fewer lines of code to maintain

**vs. Other form libraries:**
- No component library - brings your own UI
- Works with any database via adapters
- Framework-agnostic (React, Svelte, Astro, Solid)
- Tiny bundle (~3KB for useForm hook)

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


---

Arjun Aditya is building Gray Cup - a company which is around tea, coffee, and softwares. You can explore more below

• [https://graycup.org](https://graycup.org)

• [https://graycup.com](https://graycup.com)

• [https://arjunaditya.xyz](https://arjunaditya.xyz)

He still writes code, designs interfaces, and somehow keeps moving forward with a cup of tea or coffee in hand [ the ritual that keeps him sane when the burnout starts creeping in ]

Buy coffee or tea:

[https://graycup.in](https://graycup.in)

Bulk coffee or tea:

[https://b2b.graycup.in](https://b2b.graycup.in)

[https://bulkgreencoffee.com](https://bulkgreencoffee.com)

[https://bulkctc.com](https://bulkctc.com)
