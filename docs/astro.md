# Astro + formsdk

## Install

```bash
bun add formsdk
```

## CLI

formsdk provides an interactive CLI to generate forms:

```bash
bun x formsdk generate           # Interactive mode
bun x formsdk generate contact   # With options
```

### CLI Options

```
--framework <nextjs|svelte|react|astro|solidjs>  Framework (default: astro)
--ui <shadcn|chakra|default>                      UI library (default: default)
--orm <prisma|drizzle|postgres|supabase|neon|turso>  ORM/database (default: postgres)
--captcha                                         Enable Turnstile captcha
--output-dir <dir>                                Output directory (default: ./forms)
```

### Examples

```bash
bun x formsdk generate contact --framework astro --ui shadcn --orm supabase
bun x formsdk generate contact --framework astro --orm neon --captcha
```

## Setup

### Database Adapters

formsdk supports multiple database adapters for persisting form submissions.

**Prisma ORM:**
```ts
import { createPrismaAdapter } from "formsdk/adapters/orm/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
registerDBAdapter("prisma", createPrismaAdapter({
  client: prisma,
  modelName: "formSubmission"
}));
```

**Drizzle ORM:**
```ts
import { createDrizzleAdapter } from "formsdk/adapters/orm/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";

const db = drizzle(import.meta.env.DATABASE_URL!);
registerDBAdapter("drizzle", createDrizzleAdapter({ db, table: formSubmissions }));
```

**Supabase:**
```ts
import { createSupabaseAdapter } from "formsdk/adapters/supabase";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: import.meta.env.PUBLIC_SUPABASE_URL!,
  anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
}));
```

**Neon (Serverless Postgres):**
```ts
import { createNeonAdapter } from "formsdk/adapters/neon";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: import.meta.env.DATABASE_URL!
}));
```

**Turso (libSQL):**
```ts
import { createTursoAdapter } from "formsdk/adapters/turso";

registerDBAdapter("turso", createTursoAdapter({
  url: import.meta.env.TURSO_DATABASE_URL!,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
}));
```

**Generic PostgreSQL:**
```ts
import { createPostgresAdapter } from "formsdk/adapters/postgres";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: import.meta.env.DATABASE_URL!
}));
```

### Long-Linking Methods

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
// src/lib/forms.ts
import { createForm } from "formsdk";

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

## API Endpoint

```ts
// src/pages/api/contact.ts
import { contactForm } from "$lib/forms";
import { handleRequest } from "formsdk";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const result = await handleRequest({
    config: contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { "Content-Type": "application/json" }
  });
};
```

## Environment Variables

In `.env`:

```env
DATABASE_URL=postgres://user:password@host:port/database
TURNSTILE_SECRET=your_secret_key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

### Setting Environment Variables

In your formsdk config file (`src/lib/formsdk.ts`):

```ts
import { createForm, handleRequest, setEnv } from "formsdk";

setEnv({
  TURNSTILE_SECRET: import.meta.env.TURNSTILE_SECRET
});
```

### Security Notes

- Never commit `.env` files containing secrets to version control
- Use `.env.example` for required environment variables without actual values
- In production, set environment variables through your deployment platform (Netlify, Vercel, etc.)

## HTML Form Component

```astro
---
// src/pages/contact.astro
---
<form id="contact-form" class="max-w-md mx-auto p-4">
  <div class="mb-4">
    <label for="email" class="block text-sm font-medium mb-1">Email</label>
    <input type="email" name="email" id="email" required
      class="w-full px-3 py-2 border border-gray-300 rounded-md" />
  </div>
  <div class="mb-4">
    <label for="message" class="block text-sm font-medium mb-1">Message</label>
    <textarea name="message" id="message" required
      class="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"></textarea>
  </div>
  <div class="cf-turnstile" data-sitekey="your_site_key"></div>
  <button type="submit" class="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90">
    Send
  </button>
</form>

<script>
  const form = document.getElementById("contact-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form as HTMLFormElement);
    const res = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(data))
    });
    const result = await res.json();
    if (result.success) {
      alert("Sent!");
    } else {
      console.error(result.errors);
    }
  });
</script>
```

## With Astro Actions (Experimental)

```ts
// src/actions.ts
import { contactForm } from "$lib/forms";
import { handleRequest } from "formsdk";

export const contactAction = async ({ request }: { request: Request }) => {
  const data = await request.formData();
  const body = Object.fromEntries(data);

  return handleRequest({
    config: contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });
};
```

```astro
---
// src/pages/contact.astro
import { contactAction } from "@/actions";
---
<form action={contactAction} method="post">
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>
```