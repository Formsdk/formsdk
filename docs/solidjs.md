# SolidJS + @formsdk/sdk

## Install

```bash
npm install @formsdk/sdk
```

## Two APIs

| API | Purpose | Where |
|-----|---------|-------|
| `useForm` | Client-side form state management | SolidJS components |
| `handleRequest` | Server-side validation & DB persistence | API routes |

---

## useForm Hook

```tsx
// src/components/ContactForm.tsx
import { useForm } from "@formsdk/sdk";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, status },
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

      <button type="submit" disabled={status === "loading"}>
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
| `register(name)` | Returns `{ name, value, onInput, onBlur }` for controlled inputs |
| `handleSubmit` | Submit handler |
| `setError(name, msg)` | Manually set field error |
| `clearErrors(name?)` | Clear field(s) or all errors |
| `reset(values?)` | Reset form |
| `formState` | `{ status, errors, touched, dirty, isSubmitting }` |
| `values` | Current form values |

---

## API Route

```ts
// src/routes/api/contact.ts
import { handleRequest } from "@formsdk/sdk";

export async function POST({ request }: { request: Request }) {
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
}
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
  url: import.meta.env.VITE_SUPABASE_URL!,
  apiKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
}));
```

### Neon

```ts
import { registerDBAdapter, createNeonAdapter } from "@formsdk/sdk";

registerDBAdapter("neon", createNeonAdapter({
  connectionString: import.meta.env.VITE_DATABASE_URL!
}));
```

### PostgreSQL

```ts
import { registerDBAdapter, createPostgresAdapter } from "@formsdk/sdk";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: import.meta.env.VITE_DATABASE_URL!
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
VITE_DATABASE_URL=postgres://user:password@host:port/database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
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