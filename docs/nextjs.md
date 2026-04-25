# Next.js + formsdk

## Install

```bash
bun add formsdk
```

## CLI

formsdk provides an interactive CLI to generate forms:

```bash
bun x formsdk generate           # Interactive mode (arrow keys + space)
bun x formsdk generate contact   # With options
```

### CLI Options

```
--framework <nextjs|svelte|react>  Framework (default: nextjs)
--ui <shadcn|chakra|default>        UI library (default: default)
--orm <prisma|drizzle|postgres|supabase|neon|turso>  ORM/database (default: postgres)
--captcha                           Enable Turnstile captcha
--output-dir <dir>                   Output directory (default: ./forms)
```

### Examples

```bash
bun x formsdk generate contact --framework nextjs --ui shadcn --orm prisma --captcha
bun x formsdk generate contact --framework svelte --ui shadcn --orm supabase
bun x formsdk generate contact              # Interactive mode
```

## Database Adapters

formsdk supports multiple database adapters for persisting form submissions.

### Prisma ORM

```ts
import { createPrismaAdapter } from "formsdk/adapters/orm/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

registerDBAdapter("prisma", createPrismaAdapter({
  client: prisma,
  modelName: "formSubmission"
}));
```

### Drizzle ORM

```ts
import { createDrizzleAdapter } from "formsdk/adapters/orm/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import { formSubmissions } from "./schema";

const db = drizzle(process.env.DATABASE_URL!);

registerDBAdapter("drizzle", createDrizzleAdapter({
  db,
  table: formSubmissions
}));
```

### Supabase

```ts
import { createSupabaseAdapter } from "formsdk/adapters/supabase";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  table: "contacts"
}));
```

### Neon (PostgreSQL Serverless)

```ts
import { createNeonAdapter } from "formsdk/adapters/neon";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: process.env.DATABASE_URL!,
  table: "contacts"
}));
```

### Turso (libSQL)

```ts
import { createTursoAdapter } from "formsdk/adapters/turso";

registerDBAdapter("turso", createTursoAdapter({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
  table: "contacts"
}));
```

### Generic PostgreSQL (Any remote Postgres)

```ts
import { createPostgresAdapter } from "formsdk/adapters/postgres";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: process.env.DATABASE_URL!,
  table: "contacts"
}));
```

### Long-Linking Methods

Each adapter supports long-linking connections via environment variables:

**Prisma (schema.prisma):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Neon:**
```env
DATABASE_URL=postgres://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Supabase:**
```env
DATABASE_URL=postgres://postgres.xxx@aws-0.region.supabase.co:5432/postgres
```

**Turso:**
```env
TURSO_DATABASE_URL=libsql://your-db.turso.io?authToken=your-token
```

## Create Form

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
    console.log("submitted", data);
  }
});
```

## API Route

```ts
// app/api/contact/route.ts
import { contactForm } from "@/lib/forms";
import { handleRequest } from "@/lib/formsdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await handleRequest({
    config: contactForm,
    body,
    ctx: { ip: req.headers.get("x-forwarded-for") || undefined }
  });

  return Response.json(result, { status: result.success ? 200 : 400 });
}
```

## Environment Variables

```env
DATABASE_URL=postgres://user:password@host:port/database
TURNSTILE_SECRET=your_secret_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

### Setting Environment Variables

In your formsdk config file (`lib/formsdk.ts`), you can set the environment variables using `setEnv()`:

```ts
import { createForm, handleRequest, setEnv } from "formsdk";

setEnv({
  TURNSTILE_SECRET: process.env.TURNSTILE_SECRET
});
```

**Important:** The environment variable name in your `.env` file and the key in `setEnv()` must match exactly. Next.js automatically makes variables from `.env` files available via `process.env`.

### Security Notes

- Never commit `.env` files containing secrets to version control
- Use `.env.example` for required environment variables without actual values
- In production, set environment variables through your deployment platform (Vercel, Railway, etc.)

## Client Component

```tsx
// app/contact/page.tsx
"use client";

export default function ContactPage() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const res = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(data)),
      headers: { "Content-Type": "application/json" }
    });

    const result = await res.json();
    if (result.success) {
      alert("Sent!");
    } else {
      console.error(result.errors);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <textarea name="message" required />
      <div className="cf-turnstile" data-sitekey="your_site_key" />
      <button type="submit">Send</button>
    </form>
  );
}
```

## With React Server Actions (Next.js 14+)

```ts
// app/actions.ts
"use server";

import { contactForm } from "@/lib/forms";
import { handleRequest } from "@/lib/formsdk";

export async function submitContact(formData: FormData) {
  const body = Object.fromEntries(formData);

  return handleRequest({
    config: contactForm,
    body,
    ctx: {}
  });
}
```

```tsx
// app/contact/page.tsx
import { submitContact } from "@/app/actions";

export default function ContactPage() {
  return (
    <form action={submitContact}>
      <input type="email" name="email" required />
      <textarea name="message" required />
      <div className="cf-turnstile" data-sitekey="your_site_key" />
      <button type="submit">Send</button>
    </form>
  );
}
```