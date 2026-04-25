# SvelteKit + formsdk

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

## Server Action

```ts
// src/routes/+page.server.ts
import { contactForm } from "$lib/forms";
import { handleRequest } from "$lib/formsdk";

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

## Environment Variables

```env
TURNSTILE_SECRET=your_secret_key
```

Add Turnstile widget to your page:

```svelte
<!-- +page.svelte -->
<script>
  function loadTurnstile() {
    // Add Cloudflare Turnstile script
  }
</script>

<form method="POST">
  <!-- your fields -->
  <div class="cf-turnstile" data-sitekey="your_site_key"></div>
  <button>Submit</button>
</form>
```

## Client-side Validation (optional)

For better UX, validate on blur before submit:

```ts
// src/lib/validation.ts
export function validateField(validator: (v: any) => boolean, value: any): string | null {
  return validator(value) ? null : "Invalid";
}
```