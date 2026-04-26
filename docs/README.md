# @formsdk/sdk

Zero-lock-in, framework-agnostic Form SDK with two complementary APIs for complete form handling.

## Two APIs

| API | Purpose | Where |
|-----|---------|-------|
| `useForm` | Client-side form state management | In your React components |
| `handleRequest` | Server-side validation & DB persistence | In your API routes |

---

## Quick Start

### 1. Install

```bash
npm install @formsdk/sdk
```

### 2. Client Component

```tsx
// app/contact/page.tsx
"use client";

import { useForm } from "@formsdk/sdk";

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors, status }, reset } = useForm({
    action: "/api/contact",
    onSuccess: () => {
      alert("Message sent!");
      reset();
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...register("name")} placeholder="Name" />
      {errors.name && <span>{errors.name}</span>}

      <input {...register("email")} type="email" placeholder="Email" />
      {errors.email && <span>{errors.email}</span>}

      <textarea {...register("message")} placeholder="Message" />
      {errors.message && <span>{errors.message}</span>}

      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

### 3. API Route

```ts
// app/api/contact/route.ts
import { handleRequest } from "@formsdk/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const result = await handleRequest({
    config: {
      fields: {
        name: (v) => typeof v === "string" && v.length >= 2,
        email: (v) => typeof v === "string" && v.includes("@"),
        message: (v) => typeof v === "string" && v.length >= 10,
      },
    },
    body: await req.json(),
    ctx: { ip: req.headers.get("x-forwarded-for") },
  });

  return Response.json(result, { status: result.success ? 200 : 400 });
}
```

---

## useForm Hook API

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `action` | `string` | *required* | Endpoint URL |
| `method` | `"POST" \| "PUT" \| "PATCH" \| "DELETE"` | `"POST"` | HTTP method |
| `initialValues` | `Record<string, unknown>` | `{}` | Initial form values |
| `onSuccess` | `(data: unknown) => void` | - | Success callback |
| `onError` | `(error: unknown) => void` | - | Error callback |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `register(name)` | `(name: string) => RegisterReturn` | Register a field |
| `handleSubmit(event?)` | `(e?: SubmitEvent) => Promise<void>` | Submit form |
| `setError(name, message)` | `(name: string, message: string) => void` | Set field error |
| `clearErrors(name?)` | `(name?: string) => void` | Clear errors |
| `reset(values?)` | `(values?: Partial<T>) => void` | Reset form |
| `formState` | `FormState` | Current form state |
| `values` | `T` | Current form values |

### register(name) Return

```ts
{
  name: string;
  value: unknown;
  onChange: (event: InputEvent | { target: { value, name } }) => void;
  onBlur: () => void;
}
```

### formState

```ts
{
  status: "idle" | "loading" | "success" | "error";
  errors: Record<string, string>;
  touched: Set<string>;
  dirty: boolean;
  isSubmitting: boolean;
}
```

---

## handleRequest API

### Options

| Option | Type | Description |
|--------|------|-------------|
| `config` | `FormConfig` | Form definition with fields validation |
| `body` | `Record<string, any>` | Form submission data |
| `ctx` | `FormContext` | Context (ip, headers) |

### FormConfig

```ts
{
  fields: Record<string, (value: any) => boolean>;  // Validation functions
  captcha?: "turnstile";                            // Cloudflare Turnstile
  db?: string;                                       // DB adapter name
  onSubmit?: (data, ctx) => Promise<void>;           // After successful submission
}
```

---

## Database Adapters

Register once, use anywhere:

```ts
import { registerDBAdapter, createPostgresAdapter } from "@formsdk/sdk";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

### Available Adapters

| Adapter | Function | Package |
|---------|----------|---------|
| PostgreSQL | `createPostgresAdapter` | `postgres` |
| Supabase | `createSupabaseAdapter` | `@supabase/supabase-js` |
| Neon | `createNeonAdapter` | `@neondatabase/serverless` |
| Turso | `createTursoAdapter` | `@libsql/client` |
| Drizzle ORM | `createDrizzleAdapter` | `drizzle-orm` |
| Prisma | `createPrismaAdapter` | `@prisma/client` |
| Better Auth | `createBetterAuthAdapter` | `better-auth` |

---

## Next.js + Database Example

### 1. Setup DB Adapter

```ts
// lib/formsdk.ts
import { registerDBAdapter, createDrizzleAdapter } from "@formsdk/sdk";
import { drizzle } from "drizzle-orm/postgres-js";
import { formSubmissions } from "./db/schema";

const db = drizzle(process.env.DATABASE_URL!);

registerDBAdapter("drizzle", createDrizzleAdapter({
  db,
  table: formSubmissions
}));
```

### 2. Create Form Config

```ts
// lib/forms.ts
import { createForm } from "./formsdk";

export const contactForm = createForm({
  fields: {
    name: (v) => typeof v === "string" && v.length >= 2,
    email: (v) => typeof v === "string" && v.includes("@"),
    message: (v) => typeof v === "string" && v.length >= 10,
  },
  db: "drizzle",
  onSubmit: async (data) => {
    console.log("Form submitted:", data);
  },
});
```

### 3. API Route

```ts
// app/api/contact/route.ts
import { contactForm } from "@/lib/forms";
import { handleRequest } from "@formsdk/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await handleRequest({
    config: contactForm,
    body,
    ctx: { ip: req.headers.get("x-forwarded-for") },
  });

  return Response.json(result, { status: result.success ? 200 : 400 });
}
```

---

## Framework Guides

- [Next.js](./nextjs.md)
- [SvelteKit](./sveltekit.md)
- [Astro](./astro.md)
- [SolidJS](./solidjs.md)