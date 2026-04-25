import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

interface GenerateOptions {
  framework?: string;
  ui?: string;
  orm?: string;
  captcha?: boolean;
  outputDir?: string;
}

const ORM_TEMPLATES: Record<string, string> = {
  prisma: `import { createForm, registerDBAdapter } from "formsdk";
import { createPrismaAdapter } from "formsdk/adapters/orm/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
registerDBAdapter("prisma", createPrismaAdapter({ client: prisma, modelName: "formSubmission" }));`,
  drizzle: `import { createForm, registerDBAdapter } from "formsdk";
import { createDrizzleAdapter } from "formsdk/adapters/orm/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import { formSubmissions } from "./schema";

const db = drizzle(process.env.DATABASE_URL!);
registerDBAdapter("drizzle", createDrizzleAdapter({ db, table: formSubmissions }));`,
  postgres: `import { createForm, registerDBAdapter } from "formsdk";
import { createPostgresAdapter } from "formsdk/adapters/postgres";

registerDBAdapter("postgres", createPostgresAdapter({ connectionString: process.env.DATABASE_URL! }));`,
  supabase: `import { createForm, registerDBAdapter } from "formsdk";
import { createSupabaseAdapter } from "formsdk/adapters/supabase";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: import.meta.env.PUBLIC_SUPABASE_URL!,
  anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
}));`,
  neon: `import { createForm, registerDBAdapter } from "formsdk";
import { createNeonAdapter } from "formsdk/adapters/neon";

registerDBAdapter("neon", createNeonAdapter({ connectionString: import.meta.env.DATABASE_URL! }));`,
  turso: `import { createForm, registerDBAdapter } from "formsdk";
import { createTursoAdapter } from "formsdk/adapters/turso";

registerDBAdapter("turso", createTursoAdapter({
  url: import.meta.env.TURSO_DATABASE_URL!,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
}));`,
};

const UI_TEMPLATES: Record<string, Record<string, { form: string; api: string }>> = {
  nextjs: {
    shadcn: {
      form: `// app/[name]/page.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

export default function FormPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", message: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await fetch("/api/[name]", { method: "POST", body: JSON.stringify(values) });
    const result = await res.json();
    if (result.success) alert("Submitted!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>Message</FormLabel>
            <FormControl><Textarea placeholder="Your message..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}`,
      api: `// app/api/[name]/route.ts
import { handleRequest } from "@/lib/formsdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: { ip: req.headers.get("x-forwarded-for") }
  });
  return Response.json(result, { status: result.success ? 200 : 400 });
}`,
    },
    default: {
      form: `// app/[name]/page.tsx
"use client";
export default function FormPage() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/[name]", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const result = await res.json();
    if (result.success) alert("Submitted!");
  }
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input type="email" name="email" required placeholder="Email" />
      <textarea name="message" required placeholder="Message" />
      <button type="submit">Send</button>
    </form>
  );
}`,
      api: `// app/api/[name]/route.ts
import { handleRequest } from "@/lib/formsdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: { ip: req.headers.get("x-forwarded-for") }
  });
  return Response.json(result, { status: result.success ? 200 : 400 });
}`,
    },
  },
  svelte: {
    shadcn: {
      form: `<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
</script>

<form method="POST" action="?/submit" class="space-y-4 max-w-md">
  <div>
    <label for="email" class="block text-sm font-medium">Email</label>
    <Input type="email" name="email" required class="w-full" />
  </div>
  <div>
    <label for="message" class="block text-sm font-medium">Message</label>
    <Textarea name="message" required class="w-full min-h-[100px]" />
  </div>
  <Button type="submit" class="w-full">Submit</Button>
</form>`,
      api: `// src/routes/api/[name]/+server.ts
import { json } from "@sveltejs/kit";
import { handleRequest } from "$lib/formsdk";

export async function POST({ request }) {
  const body = await request.json();
  const result = await handleRequest({
    config: require("$lib/forms").contactForm,
    body,
    ctx: {}
  });
  return json(result, { status: result.success ? 200 : 400 });
}`,
    },
    default: {
      form: `<script lang="ts">
  async function handleSubmit(e: Event) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const res = await fetch("/api/[name]", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const result = await res.json();
    if (result.success) alert("Submitted!");
  }
</script>

<form on:submit|preventDefault={handleSubmit} style="max-width: 400px; display: flex; flex-direction: column; gap: 1rem;">
  <input type="email" name="email" required placeholder="Email" />
  <textarea name="message" required placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>`,
      api: `// src/routes/api/[name]/+server.ts
import { json } from "@sveltejs/kit";
import { handleRequest } from "$lib/formsdk";

export async function POST({ request }) {
  const body = await request.json();
  const result = await handleRequest({
    config: require("$lib/forms").contactForm,
    body,
    ctx: {}
  });
  return json(result, { status: result.success ? 200 : 400 });
}`,
    },
  },
  react: {
    chakra: {
      form: `import { Box, Button, FormControl, FormLabel, Input, Textarea, useToast } from "@chakra-ui/react";

export default function FormPage() {
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/[name]", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const result = await res.json();
    if (result.success) toast({ title: "Submitted!", status: "success" });
    else toast({ title: "Error", status: "error" });
  }

  return (
    <Box as="form" onSubmit={handleSubmit} maxW="400px" display="flex" flexDirection="column" gap={4}>
      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input type="email" name="email" required />
      </FormControl>
      <FormControl>
        <FormLabel>Message</FormLabel>
        <Textarea name="message" required />
      </FormControl>
      <Button type="submit" colorScheme="blue">Submit</Button>
    </Box>
  );
}`,
      api: `// src/pages/api/[name].ts
import { handleRequest } from "@/lib/formsdk";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: {}
  });
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { "Content-Type": "application/json" }
  });
}`,
    },
    default: {
      form: `export default function FormPage() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/[name]", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const result = await res.json();
    if (result.success) alert("Submitted!");
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input type="email" name="email" required placeholder="Email" />
      <textarea name="message" required placeholder="Message" />
      <button type="submit">Send</button>
    </form>
  );
}`,
      api: `// src/pages/api/[name].ts
import { handleRequest } from "@/lib/formsdk";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: {}
  });
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { "Content-Type": "application/json" }
  });
}`,
    },
  },
  astro: {
    shadcn: {
      form: `---
// src/pages/[name].astro
---
<div class="max-w-md mx-auto p-4">
  <form id="contact-form" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium">Email</label>
      <input type="email" name="email" id="email" required 
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
    </div>
    <div>
      <label for="message" class="block text-sm font-medium">Message</label>
      <textarea name="message" id="message" required 
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 min-h-[100px]"></textarea>
    </div>
    <button type="submit" class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
      Submit
    </button>
  </form>
</div>

<script>
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form as HTMLFormElement);
    const res = await fetch('/api/[name]', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const result = await res.json();
    if (result.success) alert('Submitted!');
  });
</script>`,
      api: `// src/pages/api/[name].ts
import type { APIRoute } from "astro";
import { handleRequest } from "formsdk";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });
  return new Response(JSON.stringify(result), { status: result.success ? 200 : 400 });
};`,
    },
    default: {
      form: `---
// src/pages/[name].astro
---
<form id="contact-form" class="max-w-md mx-auto p-4" style="display: flex; flex-direction: column; gap: 1rem;">
  <input type="email" name="email" required placeholder="Email" 
    style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
  <textarea name="message" required placeholder="Message"
    style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; min-height: 100px;"></textarea>
  <button type="submit" style="padding: 0.75rem; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
    Send
  </button>
</form>

<script>
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form as HTMLFormElement);
    const res = await fetch('/api/[name]', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const result = await res.json();
    if (result.success) alert('Submitted!');
  });
</script>`,
      api: `// src/pages/api/[name].ts
import type { APIRoute } from "astro";
import { handleRequest } from "formsdk";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });
  return new Response(JSON.stringify(result), { status: result.success ? 200 : 400 });
};`,
    },
  },
  solidjs: {
    shadcn: {
      form: `// src/components/[name]/Form.tsx
import { createSignal } from "solid-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FormPage() {
  const [loading, setLoading] = createSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    
    try {
      const res = await fetch("/api/[name]", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const result = await res.json();
      if (result.success) alert("Submitted!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4 max-w-md">
      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <Input type="email" name="email" id="email" required />
      </div>
      <div>
        <label for="message" class="block text-sm font-medium">Message</label>
        <textarea name="message" id="message" required class="min-h-[100px]" />
      </div>
      <Button type="submit" disabled={loading()}>
        {loading() ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}`,
      api: `// src/routes/api/[name].ts
import { JSONResponse } from "@solidjs/router";
import { handleRequest } from "formsdk";

export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });
  return new JSONResponse(result, { status: result.success ? 200 : 400 });
}`,
    },
    default: {
      form: `// src/components/[name]/Form.tsx
import { createSignal } from "solid-js";

export default function FormPage() {
  const [loading, setLoading] = createSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    
    try {
      const res = await fetch("/api/[name]", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(data)),
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
}`,
      api: `// src/routes/api/[name].ts
import { JSONResponse } from "@solidjs/router";
import { handleRequest } from "formsdk";

export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const result = await handleRequest({
    config: require("@/lib/forms").contactForm,
    body,
    ctx: { ip: request.headers.get("x-forwarded-for") || undefined }
  });
  return new JSONResponse(result, { status: result.success ? 200 : 400 });
}`,
    },
  },
};

export async function generateCommand(name: string, options: GenerateOptions = {}): Promise<void> {
  const {
    framework = "nextjs",
    ui = "default",
    orm = "postgres",
    captcha = false,
    outputDir = "./forms"
  } = options;

  console.log(`Generating form "${name}" for ${framework} with ${ui} UI and ${orm} ORM...`);

  const frameworkTemplates = UI_TEMPLATES[framework as keyof typeof UI_TEMPLATES];
  const uiTemplates = frameworkTemplates?.[ui as keyof typeof frameworkTemplates];

  if (!frameworkTemplates || !uiTemplates) {
    console.error(`Unsupported framework "${framework}" or UI "${ui}"`);
    console.error("Supported frameworks: nextjs, svelte, react, astro, solidjs");
    console.error("Supported UI: shadcn, chakra, default");
    process.exit(1);
  }

  const baseDir = join(outputDir, name);
  await mkdir(baseDir, { recursive: true });

  await writeFile(join(baseDir, "Form.tsx"), uiTemplates.form);

  if (framework === "nextjs" || framework === "react") {
    await mkdir(join(baseDir, "api"), { recursive: true });
    await writeFile(join(baseDir, "api/route.ts"), uiTemplates.api);
  } else if (framework === "svelte") {
    await mkdir(join(baseDir, "routes/api"), { recursive: true });
    await writeFile(join(baseDir, "routes/api/+server.ts"), uiTemplates.api);
  } else if (framework === "astro") {
    await mkdir(join(baseDir, "pages/api"), { recursive: true });
    await writeFile(join(baseDir, "pages/api/[name].ts"), uiTemplates.api);
  } else if (framework === "solidjs") {
    await mkdir(join(baseDir, "routes/api"), { recursive: true });
    await writeFile(join(baseDir, "routes/api/[name].ts"), uiTemplates.api);
  }

  const ormCode = ORM_TEMPLATES[orm] || ORM_TEMPLATES.postgres;
  await writeFile(join(baseDir, "config.ts"), `${ormCode}

export const ${name}Form = createForm({
  fields: {
    email: (v) => typeof v === "string" && v.includes("@"),
    message: (v) => typeof v === "string" && v.length > 10,
  },
  captcha: ${captcha ? '"turnstile"' : "undefined"},
  db: "${orm}",
  onSubmit: async (data, ctx) => {
    console.log("Form submitted:", data);
  },
});`);

  await writeFile(join(baseDir, "README.md"), `# ${name} Form

Generated by formsdk CLI

**Framework:** ${framework}  
**UI:** ${ui}  
**ORM:** ${orm}${captcha ? "\n**Captcha:** Turnstile" : ""}

## Setup

1. Install formsdk: \`bun add formsdk\`
2. Configure database connection in \`config.ts\`
${captcha ? '3. Set TURNSTILE_SECRET environment variable\n' : ""}
3. Run dev server to start

## Files

- \`Form.tsx\` - The form component
- \`config.ts\` - Form configuration and adapters  
- API route handler
`);

  console.log(`\nGenerated form at ${baseDir}`);
  console.log("\nNext steps:");
  console.log(`  cd ${baseDir}`);
  console.log("  bun add formsdk");
  console.log("  # Edit config.ts to configure your database");
}