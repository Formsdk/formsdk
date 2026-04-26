# FormSDK - Zero-Lock-In Form Management

A minimal, high-performance form state manager with pluggable database adapters. Works with any JavaScript framework.

## Two APIs for Complete Form Handling

FormSDK provides two complementary APIs:

| API | Purpose | Import |
|-----|---------|--------|
| `useForm` | Client-side form state management | `@formsdk/sdk` |
| `handleRequest` | Server-side form validation & DB persistence | `@formsdk/sdk` |

---

## Quick Start

### 1. Client-Side (React Example)

```tsx
import { useForm } from "@formsdk/sdk";

export default function ContactForm() {
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

### 2. Server-Side (Next.js API Route)

```typescript
import { handleRequest } from "@formsdk/sdk";

export async function POST(req: Request) {
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

## Installation

```bash
npm install @formsdk/sdk
```

---

## useForm Hook API

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `action` | `string` | *required* | Endpoint URL for form submission |
| `method` | `"POST" \| "PUT" \| "PATCH" \| "DELETE"` | `"POST"` | HTTP method |
| `initialValues` | `Record<string, unknown>` | `{}` | Initial form values |
| `onSuccess` | `(data: unknown) => void` | - | Success callback |
| `onError` | `(error: unknown) => void` | - | Error callback |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `register(name)` | `(name: string) => RegisterReturn` | Register a field for controlled input |
| `handleSubmit(event?)` | `(e?: SubmitEvent) => Promise<void>` | Submit the form |
| `setError(name, message)` | `(name: string, message: string) => void` | Set field error |
| `clearErrors(name?)` | `(name?: string) => void` | Clear field(s) error |
| `reset(values?)` | `(values?: Partial<T>) => void` | Reset form |
| `formState` | `FormState` | Current form state |
| `getFieldState(name)` | `(name: string) => GetFieldStateReturn` | Get field-specific state |
| `values` | `T` | Current form values |

### register(name) Return

```typescript
{
  name: string;
  value: unknown;
  onChange: (event: InputEvent | { target: { value, name } }) => void;
  onBlur: () => void;
}
```

### formState

```typescript
{
  status: "idle" | "loading" | "success" | "error";
  errors: Record<string, string>;
  touched: Set<string>;
  dirty: boolean;
  isSubmitting: boolean;
}
```

---

## Server-Side handleRequest API

### Options

| Option | Type | Description |
|--------|------|-------------|
| `config` | `FormConfig` | Form configuration with fields validation |
| `body` | `Record<string, any>` | Form submission data |
| `ctx` | `FormContext` | Context (ip, headers, etc.) |

### FormConfig

```typescript
{
  fields: Record<string, (value: any) => boolean>;  // Validation functions
  captcha?: "turnstile";                          // Enable Cloudflare turnstile
  db?: string;                                     // DB adapter name (e.g., "postgres")
  onSubmit?: (data, ctx) => Promise<void>;        // Hook after successful submission
}
```

---

## Database Adapters

Register your database adapter once:

```typescript
import { registerDBAdapter, createPostgresAdapter } from "@formsdk/sdk";

registerDBAdapter("postgres", createPostgresAdapter({
  connectionString: process.env.DATABASE_URL!
}));
```

Then use it in your form config:

```typescript
export const contactForm = createForm({
  fields: { /* ... */ },
  db: "postgres",
  onSubmit: async (data) => {
    console.log("Form submitted:", data);
  },
});
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
| Turnstile | `createTurnstileAdapter` | Cloudflare |

---

## React Example

```tsx
import { useForm } from "@formsdk/sdk";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, status, isSubmitting },
    setError,
    clearErrors,
    reset,
    values,
  } = useForm<ContactFormData>({
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
        {errors.name && <span>{errors.name}</span>}
      </div>

      <div>
        <input {...register("email")} type="email" placeholder="Email" />
        {errors.email && <span>{errors.email}</span>}
      </div>

      <div>
        <textarea {...register("message")} placeholder="Message" />
        {errors.message && <span>{errors.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {status === "loading" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

---

## Next.js API Route with DB Persistence

```typescript
import { handleRequest, registerDBAdapter, createDrizzleAdapter } from "@formsdk/sdk";
import { drizzle } from "drizzle-orm/postgres-js";
import { formSubmissions } from "./db/schema";

const db = drizzle(process.env.DATABASE_URL!);
registerDBAdapter("drizzle", createDrizzleAdapter({ db, table: formSubmissions }));

export async function POST(req: Request) {
  const result = await handleRequest({
    config: {
      fields: {
        name: (v) => typeof v === "string" && v.length >= 2,
        email: (v) => typeof v === "string" && v.includes("@"),
        message: (v) => typeof v === "string" && v.length >= 10,
      },
      db: "drizzle",
    },
    body: await req.json(),
    ctx: { ip: req.headers.get("x-forwarded-for") },
  });

  return Response.json(result, { status: result.success ? 200 : 400 });
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
    { "field": "email", "message": "Invalid email format" },
    { "field": "name", "message": "Name is required" }
  ]
}
```

---

## TypeScript

All APIs are fully typed:

```typescript
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const form = useForm<ContactForm>({
  action: "/api/contact",
});

const { values } = form;
// values is typed as ContactForm
```

---

## Advanced Features

### Field-Level Error Setting

```typescript
const { setError, clearErrors } = useForm({ action: "/api/contact" });

setError("email", "This email is already taken");
clearErrors("email");  // Clear specific field
clearErrors();         // Clear all errors
```

### Form Reset

```typescript
const { reset } = useForm<ContactFormData>({
  action: "/api/contact",
  initialValues: { name: "", email: "", message: "" },
});

reset();                              // Reset to initial values
reset({ name: "John" });             // Reset with new values
```

### Getting Specific Field State

```typescript
const { getFieldState } = useForm({ action: "/api/contact" });

const nameState = getFieldState("name");
// { error: null, touched: true, dirty: false }
```

### Request Deduplication

FormSDK automatically cancels in-flight requests if you submit again.

### Keepalive

Forms automatically use `navigator.sendBeacon` when available, ensuring form submission even if the user navigates away.

---

## Bundle Size

- **useForm hook**: ~3KB gzipped
- **handleRequest + adapters**: ~10KB gzipped
- **No heavy dependencies**

---

## License

MIT - arjunaditya