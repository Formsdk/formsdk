# Next.js + formsdk

## Install

```bash
bun add formsdk
```

## Setup

Create a centralized formsdk config:

```ts
// lib/formsdk.ts
import { createForm, handleRequest, setEnv, registerDBAdapter } from "formsdk";
import { createPostgresAdapter } from "formsdk/adapters/postgres";

setEnv({
  TURNSTILE_SECRET: process.env.TURNSTILE_SECRET
});

registerDBAdapter("postgres", createPostgresAdapter({
  query: Bun.sql,
  table: "contacts"
}));

export { createForm, handleRequest };
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
TURNSTILE_SECRET=your_secret_key
```

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