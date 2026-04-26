# SvelteKit + @formsdk/sdk

## Install

```bash
npm install @formsdk/sdk
```

## Two APIs

| API | Purpose | Where |
|-----|---------|-------|
| `useForm` | Client-side form state management | Svelte components |
| `handleRequest` | Server-side validation & DB persistence | Server routes |

---

## useForm Hook

```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
  import { useForm } from "@formsdk/sdk";

  const { register, handleSubmit, formState: { errors, status }, reset } = useForm({
    action: "/api/contact",
    onSuccess: () => {
      alert("Message sent!");
      reset();
    },
  });
</script>

<form on:submit={handleSubmit}>
  <div>
    <input {...register("name")} placeholder="Name" />
    {#if errors.name}
      <span class="error">{errors.name}</span>
    {/if}
  </div>

  <div>
    <input {...register("email")} type="email" placeholder="Email" />
    {#if errors.email}
      <span class="error">{errors.email}</span>
    {/if}
  </div>

  <div>
    <textarea {...register("message")} placeholder="Message"></textarea>
    {#if errors.message}
      <span class="error">{errors.message}</span>
    {/if}
  </div>

  <button type="submit" disabled={status === "loading"}>
    {status === "loading" ? "Sending..." : "Send"}
  </button>
</form>
```

---

## API Route

```ts
// src/routes/api/contact/+server.ts
import { handleRequest } from "@formsdk/sdk";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  const body = await request.json();

  const result = await handleRequest({
    config: {
      fields: {
        name: (v) => typeof v === "string" && v.length >= 2,
        email: (v) => typeof v === "string" && v.includes("@"),
        message: (v) => typeof v === "string" && v.length >= 10,
      },
    },
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") },
  });

  return json(result, { status: result.success ? 200 : 400 });
}
```

---

## Form Actions (No JS Required)

```ts
// src/routes/contact/+page.server.ts
import { handleRequest } from "@formsdk/sdk";
import { fail } from "@sveltejs/kit";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const body = Object.fromEntries(data);

    const result = await handleRequest({
      config: {
        fields: {
          name: (v) => typeof v === "string" && v.length >= 2,
          email: (v) => typeof v === "string" && v.includes("@"),
          message: (v) => typeof v === "string" && v.length >= 10,
        },
      },
      body,
      ctx: {},
    });

    if (!result.success) {
      return fail(400, { errors: result.errors });
    }

    return { success: true };
  },
};
```

```svelte
<!-- src/routes/contact/+page.svelte -->
<form method="POST">
  <input name="name" type="text" />
  <input name="email" type="email" />
  <textarea name="message"></textarea>
  <button type="submit">Send</button>
</form>
```

---

## Database Adapters

### Drizzle ORM

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

### Supabase

```ts
import { registerDBAdapter, createSupabaseAdapter } from "@formsdk/sdk";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: process.env.PUBLIC_SUPABASE_URL!,
  apiKey: process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!
}));
```

### Neon

```ts
import { registerDBAdapter, createNeonAdapter } from "@formsdk/sdk";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

### PostgreSQL

```ts
import { registerDBAdapter, createPostgresAdapter } from "@formsdk/sdk";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

---

## Form Config with DB

```ts
// src/lib/forms.ts
import { createForm } from "@formsdk/sdk";

export const contactForm = createForm({
  fields: {
    name: (v) => typeof v === "string" && v.length >= 2,
    email: (v) => typeof v === "string" && v.includes("@"),
    message: (v) => typeof v === "string" && v.length >= 10,
  },
  db: "postgres",
  onSubmit: async (data) => {
    console.log("Form submitted:", data);
  },
});
```

---

## Backend Response Format

FormSDK expects:

### Success

```json
{ "success": true, "message": "Form submitted" }
```

### Validation Errors

```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

---

## Environment Variables

```env
DATABASE_URL=postgres://user:password@host:port/database
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```