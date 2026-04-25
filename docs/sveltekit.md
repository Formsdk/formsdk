# SvelteKit + @formsdk/sdk

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
--framework <nextjs|svelte|react|astro|solidjs>  Framework (default: svelte)
--ui <shadcn|chakra|default>                      UI library (default: shadcn for svelte)
--orm <prisma|drizzle|postgres|supabase|neon|turso>  ORM/database (default: postgres)
--captcha                                         Enable Turnstile captcha
--output-dir <dir>                                Output directory (default: ./forms)
```

### Examples

```bash
bun x @formsdk/sdk generate contact --framework svelte --ui shadcn --orm supabase
bun x @formsdk/sdk generate contact --framework svelte --orm neon --captcha
```

## Setup

### Database Adapters

@formsdk/sdk supports multiple database adapters for persisting form submissions.

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

const db = drizzle(process.env.DATABASE_URL!);
registerDBAdapter("drizzle", createDrizzleAdapter({ db, table: formSubmissions }));
```

**Supabase:**
```ts
import { createSupabaseAdapter } from "@formsdk/sdk/adapters/supabase";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: process.env.PUBLIC_SUPABASE_URL!,
  anonKey: process.env.PUBLIC_SUPABASE_ANON_KEY!
}));
```

**Neon (Serverless Postgres):**
```ts
import { createNeonAdapter } from "@formsdk/sdk/adapters/neon";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

**Turso (libSQL):**
```ts
import { createTursoAdapter } from "@formsdk/sdk/adapters/turso";

registerDBAdapter("turso", createTursoAdapter({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
}));
```

**Generic PostgreSQL:**
```ts
import { createPostgresAdapter } from "@formsdk/sdk/adapters/postgres";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: process.env.DATABASE_URL!
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

## API Endpoint

```ts
// src/routes/api/contact/+server.ts
import { json } from "@sveltejs/kit";
import { contactForm } from "$lib/forms";
import { handleRequest } from "@formsdk/sdk";

export async function POST({ request }) {
  const body = await request.json();

  const result = await handleRequest({
    config: contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });

  return json(result, { status: result.success ? 200 : 400 });
}
```

## Server Action

```ts
// src/routes/+page.server.ts
import { contactForm } from "$lib/forms";
import { handleRequest } from "@formsdk/sdk";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const body = Object.fromEntries(data);

    const result = await handleRequest({
      config: contactForm,
      body,
      ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
    });

    return result;
  }
};
```

## Form Component

### Shadcn/ui (Recommended)

```svelte
<!-- src/lib/components/ContactForm.svelte -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";

  let loading = false;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    
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
      }
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4 max-w-md">
  <div>
    <label for="email" class="block text-sm font-medium">Email</label>
    <Input type="email" name="email" id="email" required class="w-full" />
  </div>
  <div>
    <label for="message" class="block text-sm font-medium">Message</label>
    <textarea name="message" id="message" required class="w-full min-h-[100px]" />
  </div>
  <div class="cf-turnstile" data-sitekey="your_site_key"></div>
  <Button type="submit" class="w-full" disabled={loading}>
    {loading ? "Submitting..." : "Submit"}
  </Button>
</form>
```

### Default HTML

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  let loading = false;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    
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
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="max-w-md" style="display: flex; flex-direction: column; gap: 1rem;">
  <input type="email" name="email" required placeholder="Email" />
  <textarea name="message" required placeholder="Message"></textarea>
  <button type="submit" disabled={loading}>
    {loading ? "Submitting..." : "Send"}
  </button>
</form>
```

## Environment Variables

```env
DATABASE_URL=postgres://user:password@host:port/database
TURNSTILE_SECRET=your_secret_key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

### Setting Environment Variables

In your @formsdk/sdk config file (`src/lib/formsdk.ts`):

```ts
import { createForm, handleRequest, setEnv, registerDBAdapter } from "@formsdk/sdk";

setEnv({
  TURNSTILE_SECRET: process.env.TURNSTILE_SECRET
});

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

### Security Notes

- Never commit `.env` files containing secrets to version control
- Use `.env.example` for required environment variables without actual values
- In production, set environment variables through your deployment platform (Netlify, Vercel, etc.)

## Client-side Validation (optional)

For better UX, validate on blur before submit:

```ts
// src/lib/validation.ts
export function validateField(validator: (v: any) => boolean, value: any): string | null {
  return validator(value) ? null : "Invalid";
}
```

## Form Actions with SvelteKit Form Actions

```ts
// src/routes/contact/+page.server.ts
import { contactForm } from "$lib/forms";
import { handleRequest } from "@formsdk/sdk";
import { fail } from "@sveltejs/kit";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const body = Object.fromEntries(data);

    const result = await handleRequest({
      config: contactForm,
      body,
      ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
    });

    if (!result.success) {
      return fail(400, { errors: result.errors });
    }

    return { success: true };
  }
};
```

```svelte
<!-- src/routes/contact/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";

  export let form;
</script>

{#if form?.errors}
  <p class="text-red-500">Please fix the errors below.</p>
{/if}

<form method="POST" use:enhance class="max-w-md" style="display: flex; flex-direction: column; gap: 1rem;">
  <input type="email" name="email" required placeholder="Email" />
  <textarea name="message" required placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>
```

## Better Auth (Authentication)

@formsdk/sdk supports Better Auth for authentication. Generate auth forms with the CLI:

```bash
bun x @formsdk/sdk generate signin --framework svelte --type signin --orm prisma
bun x @formsdk/sdk generate signup --framework svelte --type signup --orm drizzle
```

### Better Auth Setup

**Prisma:**
```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
});
```

**Drizzle:**
```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/postgres-js";
import { postgresAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // your drizzle instance

export const auth = betterAuth({
  database: postgresAdapter(db),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
});
```

### Auth API Routes

```ts
// src/routes/api/auth/[...path]/+server.ts
import { auth } from "$lib/auth";

export const { signIn, signOut, signUp, session } = auth.api;

export function GET(req: Request) {
  return auth.api.sessionHandler(req);
}

export function POST(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.split("/api/auth/")[1];

  if (path === "sign-in/email") {
    return auth.api.signInEmail(req as any);
  }
  if (path === "sign-up/email") {
    return auth.api.signUpEmail(req as any);
  }
  if (path === "sign-out") {
    return auth.api.signOut(req as any);
  }

  return new Response("Not found", { status: 404 });
}
```

### Sign In Component

```svelte
<!-- src/lib/components/SignInForm.svelte -->
<script lang="ts">
  let loading = false;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const result = await res.json();

      if (result.data) {
        window.location.href = "/dashboard";
      } else if (result.error) {
        alert(result.error.message);
      }
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="max-w-md" style="display: flex; flex-direction: column; gap: 1rem;">
  <input type="email" name="email" required placeholder="Email" />
  <input type="password" name="password" required placeholder="Password" />
  <button type="submit" disabled={loading}>
    {loading ? "Signing in..." : "Sign In"}
  </button>
  <p style="text-align: center;">
    Don't have an account? <a href="/sign-up">Sign up</a>
  </p>
</form>
```

### Sign Out Button

```svelte
<!-- src/lib/components/SignOutButton.svelte -->
<script lang="ts">
  async function handleSignOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    window.location.href = "/sign-in";
  }
</script>

<button on:click={handleSignOut} class="px-4 py-2 bg-red-600 text-white rounded">
  Sign Out
</button>
```

### Get Current Session

```ts
// src/routes/+page.server.ts
import { auth } from "$lib/auth";

export async function load({ request }) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return {
    session: session?.user ?? null,
  };
}
```