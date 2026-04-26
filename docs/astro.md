# Astro + @formsdk/sdk

## Install

```bash
npm install @formsdk/sdk
```

## Two APIs

| API | Purpose | Where |
|-----|---------|-------|
| `useForm` | Client-side form state management | Astro components/scripts |
| `handleRequest` | Server-side validation & DB persistence | API routes |

---

## Client-Side Form (Script Tag)

```astro
---
// src/pages/contact.astro
---

<form id="contact-form">
  <input name="name" type="text" placeholder="Name" />
  <input name="email" type="email" placeholder="Email" />
  <textarea name="message" placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>

<script>
  import { useForm } from "@formsdk/sdk";

  const { register, handleSubmit, formState } = useForm({
    action: "/api/contact",
    onSuccess: () => alert("Message sent!"),
  });

  const form = document.getElementById("contact-form") as HTMLFormElement;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const values = Object.fromEntries(data);
    await handleSubmit({ preventDefault: () => {}, currentTarget: form } as SubmitEvent);
  });
</script>
```

### Simpler Approach (Vanilla Fetch)

```astro
---
// src/pages/contact.astro
---

<form id="contact-form">
  <input name="name" type="text" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>

<script>
  const form = document.getElementById("contact-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form as HTMLFormElement);
    const body = JSON.stringify(Object.fromEntries(data));

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const result = await res.json();
    if (result.success) {
      (form as HTMLFormElement).reset();
      alert("Sent!");
    }
  });
</script>
```

---

## API Route

```ts
// src/pages/api/contact.ts
import { handleRequest } from "@formsdk/sdk";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
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

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { "Content-Type": "application/json" },
  });
};
```

---

## Database Adapters

### Drizzle ORM

```ts
import { registerDBAdapter, createDrizzleAdapter } from "@formsdk/sdk";
import { drizzle } from "drizzle-orm/postgres-js";
import { formSubmissions } from "./db/schema";

const db = drizzle(import.meta.env.DATABASE_URL!);

registerDBAdapter("drizzle", createDrizzleAdapter({
  db,
  table: formSubmissions
}));
```

### Supabase

```ts
import { registerDBAdapter, createSupabaseAdapter } from "@formsdk/sdk";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: import.meta.env.PUBLIC_SUPABASE_URL!,
  apiKey: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!
}));
```

### Neon

```ts
import { registerDBAdapter, createNeonAdapter } from "@formsdk/sdk";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: import.meta.env.DATABASE_URL!
}));
```

### PostgreSQL

```ts
import { registerDBAdapter, createPostgresAdapter } from "@formsdk/sdk";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: import.meta.env.DATABASE_URL!
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
  db: "drizzle",
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