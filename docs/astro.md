# Astro + formsdk

## Install

```bash
bun add formsdk
```

## Setup

Create a centralized formsdk config:

```ts
// src/lib/formsdk.ts
import { createForm, handleRequest, setEnv, registerDBAdapter } from "formsdk";
import { createPostgresAdapter } from "formsdk/adapters/postgres";

setEnv({
  TURNSTILE_SECRET: import.meta.env.TURNSTILE_SECRET
});

registerDBAdapter("postgres", createPostgresAdapter({
  query: Bun.sql,
  table: "contacts"
}));

export { createForm, handleRequest };
```

## Create Form

```ts
// src/lib/forms.ts
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

## API Endpoint

```ts
// src/pages/api/contact.ts
import { contactForm } from "$lib/forms";
import { handleRequest } from "$lib/formsdk";
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
TURNSTILE_SECRET=your_secret_key
```

## HTML Form

```html
<!-- src/pages/index.astro -->
---
---

<form id="contact-form">
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <div class="cf-turnstile" data-sitekey="your_site_key"></div>
  <button type="submit">Send</button>
</form>

<script>
  const form = document.getElementById("contact-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const res = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(data))
    });
    const result = await res.json();
    if (result.success) {
      alert("Sent!");
    }
  });
</script>
```