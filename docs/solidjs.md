# SolidJS + @formsdk/sdk

## Install

```bash
bun add @formsdk/sdk
```

## CLI

@formsdk/sdk provides an interactive CLI to generate forms:

```bash
bun x @formsdk/sdk generate           # Interactive mode (uses Enquirer)
bun x @formsdk/sdk generate contact   # With options
```

### CLI Options

```
--framework <nextjs|svelte|react|astro|solidjs>  Framework (default: solidjs)
--ui <shadcn|default>                              UI library (default: default)
--orm <prisma|drizzle|postgres|supabase|neon|turso>  ORM/database (default: postgres)
--captcha                                         Enable Turnstile captcha
--output-dir <dir>                                Output directory (default: ./forms)
```

### Examples

```bash
bun x @formsdk/sdk generate contact --framework solidjs --orm supabase
bun x @formsdk/sdk generate contact --framework solidjs --orm neon --captcha
```

## Setup

### TanStack Start (Recommended)

@formsdk/sdk works with TanStack Start for file-based routing:

```ts
// app/lib/formsdk.ts
import { createForm, handleRequest, setEnv, registerDBAdapter } from "@formsdk/sdk";
import { createPostgresAdapter } from "@formsdk/sdk/adapters/postgres";

setEnv({
  TURNSTILE_SECRET: import.meta.env.VITE_TURNSTILE_SECRET
});

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: import.meta.env.VITE_DATABASE_URL!
}));

export { createForm, handleRequest };
```

### Database Adapters

**Prisma ORM:**
```ts
import { createPrismaAdapter } from "@formsdk/sdk/adapters/orm/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
registerDBAdapter("prisma", createPrismaAdapter({
  client: prisma,
  modelName: "formSubmission"
}));
```

**Drizzle ORM:**
```ts
import { createDrizzleAdapter } from "@formsdk/sdk/adapters/orm/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";

const db = drizzle(import.meta.env.VITE_DATABASE_URL!);
registerDBAdapter("drizzle", createDrizzleAdapter({ db, table: formSubmissions }));
```

**Supabase:**
```ts
import { createSupabaseAdapter } from "@formsdk/sdk/adapters/supabase";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: import.meta.env.VITE_SUPABASE_URL!,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!
}));
```

**Neon (Serverless Postgres):**
```ts
import { createNeonAdapter } from "@formsdk/sdk/adapters/neon";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: import.meta.env.VITE_DATABASE_URL!
}));
```

**Turso (libSQL):**
```ts
import { createTursoAdapter } from "@formsdk/sdk/adapters/turso";

registerDBAdapter("turso", createTursoAdapter({
  url: import.meta.env.VITE_TURSO_DATABASE_URL!,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN
}));
```

**Generic PostgreSQL:**
```ts
import { createPostgresAdapter } from "@formsdk/sdk/adapters/postgres";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: import.meta.env.VITE_DATABASE_URL!
}));
```

### Long-Linking Methods

**Neon:**
```env
VITE_DATABASE_URL=postgres://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Supabase:**
```env
VITE_DATABASE_URL=postgres://postgres.xxx@aws-0.region.supabase.co:5432/postgres
```

**Turso:**
```env
VITE_TURSO_DATABASE_URL=libsql://your-db.turso.io?authToken=your-token
```

## Create Form

```ts
// app/lib/forms.ts
import { createForm } from "@formsdk/sdk";

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
// app/routes/api/contact.ts
import { JSONResponse } from "@solidjs/router";
import { contactForm } from "~/lib/forms";
import { handleRequest } from "~/lib/formsdk";

export async function POST({ request }: { request: Request }) {
  const body = await request.json();

  const result = await handleRequest({
    config: contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });

  return new JSONResponse(result, { status: result.success ? 200 : 400 });
}
```

## Form Component

### With SolidJS Signals (Recommended)

```tsx
// app/components/ContactForm.tsx
import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function ContactForm() {
  const [loading, setLoading] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(data)),
        headers: { "Content-Type": "application/json" }
      });
      const result = await res.json();

      if (result.success) {
        setSubmitted(true);
        form.reset();
      } else {
        console.error(result.errors);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4 max-w-md">
      <div>
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <Input type="email" name="email" id="email" required />
      </div>
      <div>
        <label for="message" class="block text-sm font-medium mb-1">Message</label>
        <textarea name="message" id="message" required class="min-h-[100px]" />
      </div>
      <div class="cf-turnstile" data-sitekey="your_site_key"></div>
      <Button type="submit" disabled={loading()}>
        {loading() ? "Submitting..." : "Submit"}
      </Button>
      {submitted() && <p class="text-green-600">Form submitted successfully!</p>}
    </form>
  );
}
```

### Default HTML

```tsx
// app/components/ContactForm.tsx
import { createSignal } from "solid-js";

export default function ContactForm() {
  const [loading, setLoading] = createSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(data))
      });
      const result = await res.json();
      if (result.success) alert("Submitted!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input type="email" name="email" required placeholder="Email" />
      <textarea name="message" required placeholder="Message" style={{ minHeight: "100px" }} />
      <button type="submit" disabled={loading()}>
        {loading() ? "Submitting..." : "Send"}
      </button>
    </form>
  );
}
```

## Environment Variables

```env
VITE_DATABASE_URL=postgres://user:password@host:port/database
VITE_TURNSTILE_SECRET=your_secret_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_TURSO_DATABASE_URL=libsql://your-db.turso.io
VITE_TURSO_AUTH_TOKEN=your-auth-token
```

### Setting Environment Variables

In your @formsdk/sdk config file (`app/lib/formsdk.ts`):

```ts
import { createForm, handleRequest, setEnv } from "@formsdk/sdk";

setEnv({
  TURNSTILE_SECRET: import.meta.env.VITE_TURNSTILE_SECRET
});
```

### Security Notes

- Never commit `.env` files containing secrets to version control
- Use `.env.example` for required environment variables without actual values
- Prefix client-side variables with `VITE_` for SolidJS/TanStack Start
- In production, set environment variables through your deployment platform

## Server Functions (RPC)

With TanStack Start, you can use server functions:

```ts
// app/routes/api/contact.ts
import { JSONResponse } from "@solidjs/router";
import { contactForm } from "~/lib/forms";
import { handleRequest } from "~/lib/formsdk";

export async function POST({ request }: { request: Request }) {
  const body = await request.json();

  const result = await handleRequest({
    config: contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });

  return new JSONResponse(result, {
    status: result.success ? 200 : 400,
    headers: { "Content-Type": "application/json" }
  });
}
```

```tsx
// app/components/ContactForm.tsx
import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";

export default function ContactForm() {
  const [loading, setLoading] = createSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(data)),
        headers: { "Content-Type": "application/json" }
      });
      const result = await res.json();

      if (result.success) {
        alert("Submitted!");
        form.reset();
      } else {
        console.error(result.errors);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4 max-w-md">
      <input type="email" name="email" required />
      <textarea name="message" required></textarea>
      <Button type="submit" disabled={loading()}>
        {loading() ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```