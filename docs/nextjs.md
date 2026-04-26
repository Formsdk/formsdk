# Next.js + @formsdk/sdk

## Install

```bash
npm install @formsdk/sdk
```

## Two APIs

| API | Purpose | Where |
|-----|---------|-------|
| `useForm` | Client-side form state management | React components |
| `handleRequest` | Server-side validation & DB persistence | API routes |

---

## useForm Hook (Recommended)

```tsx
// app/contact/page.tsx
"use client";

import { useForm } from "@formsdk/sdk";

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, status, isSubmitting },
    reset,
  } = useForm({
    action: "/api/contact",
    onSuccess: () => {
      alert("Message sent!");
      reset();
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input {...register("name")} placeholder="Name" />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div>
        <input {...register("email")} type="email" placeholder="Email" />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <textarea {...register("message")} placeholder="Message" />
        {errors.message && <span className="error">{errors.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {status === "loading" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

### useForm Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `action` | `string` | *required* | Endpoint URL |
| `method` | `"POST" \| "PUT"` | `"POST"` | HTTP method |
| `initialValues` | `object` | `{}` | Initial values |
| `onSuccess` | `function` | - | Success callback |
| `onError` | `function` | - | Error callback |

### useForm Return Value

| Property | Description |
|----------|-------------|
| `register(name)` | Returns `{ name, value, onChange, onBlur }` for controlled inputs |
| `handleSubmit` | Submit handler (also accepts `SubmitEvent`) |
| `setError(name, msg)` | Manually set field error |
| `clearErrors(name?)` | Clear field(s) or all errors |
| `reset(values?)` | Reset form |
| `formState` | `{ status, errors, touched, dirty, isSubmitting }` |
| `values` | Current form values |

---

## API Route (handleRequest)

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

## Database Adapters

### Drizzle ORM

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

### Prisma

```ts
import { registerDBAdapter, createPrismaAdapter } from "@formsdk/sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

registerDBAdapter("prisma", createPrismaAdapter({
  client: prisma,
  modelName: "formSubmission"
}));
```

### Supabase

```ts
import { registerDBAdapter, createSupabaseAdapter } from "@formsdk/sdk";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  apiKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
}));
```

### Neon (PostgreSQL Serverless)

```ts
import { registerDBAdapter, createNeonAdapter } from "@formsdk/sdk";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

### PostgreSQL (Generic)

```ts
import { registerDBAdapter, createPostgresAdapter } from "@formsdk/sdk";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

---

## Full Example with Database

### 1. Setup (lib/formsdk.ts)

```ts
import { registerDBAdapter, createDrizzleAdapter } from "@formsdk/sdk";
import { drizzle } from "drizzle-orm/postgres-js";
import { formSubmissions } from "./db/schema";

const db = drizzle(process.env.DATABASE_URL!);

registerDBAdapter("drizzle", createDrizzleAdapter({
  db,
  table: formSubmissions
}));
```

### 2. Form Config (lib/forms.ts)

```ts
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

### 3. API Route (app/api/contact/route.ts)

```ts
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

### 4. Client Component

```tsx
"use client";

import { useForm } from "@formsdk/sdk";

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors, status } } = useForm({
    action: "/api/contact",
    onSuccess: () => alert("Sent!"),
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...register("name")} placeholder="Name" />
      {errors.name && <span>{errors.name}</span>}

      <input {...register("email")} type="email" placeholder="Email" />
      {errors.email && <span>{errors.email}</span>}

      <textarea {...register("message")} placeholder="Message" />
      {errors.message && <span>{errors.message}</span>}

      <button type="submit" disabled={status === "loading"}>Send</button>
    </form>
  );
}
```

---

## Backend Response Format

FormSDK expects your server to return:

### Success

```json
{
  "success": true,
  "message": "Form submitted successfully"
}
```

### Validation Errors

```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## Environment Variables

```env
DATABASE_URL=postgres://user:password@host:port/database
TURNSTILE_SECRET=your_cloudflare_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

---

## TypeScript Support

```tsx
interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const { register, handleSubmit, values } = useForm<ContactFormData>({
  action: "/api/contact",
});

// values is typed as ContactFormData
console.log(values.name);
```