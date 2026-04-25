import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

interface GenerateOptions {
  framework?: string;
  ui?: string;
  orm?: string;
  captcha?: boolean;
  outputDir?: string;
  type?: "contact" | "signup" | "signin" | "signout" | "application" | "newsletter" | "survey";
}

const FORM_TYPES: Record<string, { name: string; description: string; fields: Record<string, any>; isAuth?: boolean }> = {
  contact: {
    name: "Contact Form",
    description: "Simple contact form with email and message",
    fields: {
      email: "(v) => typeof v === 'string' && v.includes('@')",
      message: "(v) => typeof v === 'string' && v.length > 10",
    },
  },
  signup: {
    name: "Signup Form",
    description: "Registration form with name, email, and password",
    fields: {
      name: "(v) => typeof v === 'string' && v.length >= 2",
      email: "(v) => typeof v === 'string' && v.includes('@')",
      password: "(v) => typeof v === 'string' && v.length >= 8",
    },
  },
  signin: {
    name: "Sign In Form",
    description: "Better Auth sign in with email and password",
    fields: {
      email: "(v) => typeof v === 'string' && v.includes('@')",
      password: "(v) => typeof v === 'string' && v.length >= 1",
    },
    isAuth: true,
  },
  signout: {
    name: "Sign Out",
    description: "Better Auth sign out button",
    fields: {},
    isAuth: true,
  },
  application: {
    name: "Job Application",
    description: "Comprehensive job application with multiple field types",
    fields: {
      firstName: "(v) => typeof v === 'string' && v.length >= 2",
      lastName: "(v) => typeof v === 'string' && v.length >= 2",
      email: "(v) => typeof v === 'string' && v.includes('@')",
      phone: "(v) => typeof v === 'string' && v.length >= 10",
      experience: "(v) => typeof v === 'string' && v.length > 0",
      remote: "(v) => typeof v === 'boolean'",
      availability: "(v) => typeof v === 'string' && ['full-time', 'part-time', 'contract'].includes(v)",
    },
  },
  newsletter: {
    name: "Newsletter",
    description: "Newsletter signup with consent checkbox",
    fields: {
      name: "(v) => typeof v === 'string' && v.length >= 2",
      email: "(v) => typeof v === 'string' && v.includes('@')",
      subscribe: "(v) => v === true",
    },
  },
  survey: {
    name: "Survey Form",
    description: "Survey with rating, text, and multiple choice",
    fields: {
      name: "(v) => typeof v === 'string' && v.length >= 2",
      email: "(v) => typeof v === 'string' && v.includes('@')",
      rating: "(v) => typeof v === 'number' && v >= 1 && v <= 5",
      feedback: "(v) => typeof v === 'string' && v.length > 0",
    },
  },
};

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

function generateFormByType(type: string, ui: string, name: string): string {
  const forms: Record<string, Record<string, string>> = {
    contact: {
      default: `<form onSubmit={handleSubmit} style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="email" name="email" required placeholder="Email" />
  <textarea name="message" required placeholder="Message" />
  <button type="submit">Send</button>
</form>`,
      shadcn: `// Form with shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

<form onSubmit={handleSubmit} className="space-y-4 max-w-md">
  <div>
    <label htmlFor="email" className="block text-sm font-medium">Email</label>
    <Input type="email" name="email" id="email" required placeholder="email@example.com" />
  </div>
  <div>
    <label htmlFor="message" className="block text-sm font-medium">Message</label>
    <Textarea name="message" id="message" required placeholder="Your message..." />
  </div>
  <Button type="submit">Submit</Button>
</form>`,
    },
    signup: {
      default: `<form onSubmit={handleSubmit} style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="text" name="name" required placeholder="Full Name" minLength={2} />
  <input type="email" name="email" required placeholder="Email" />
  <input type="password" name="password" required placeholder="Password (min 8 chars)" minLength={8} />
  <button type="submit">Create Account</button>
</form>`,
      shadcn: `import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

<form onSubmit={handleSubmit} className="space-y-4 max-w-md">
  <div>
    <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
    <Input type="text" name="name" id="name" required placeholder="John Doe" minLength={2} />
  </div>
  <div>
    <label htmlFor="email" className="block text-sm font-medium">Email</label>
    <Input type="email" name="email" id="email" required placeholder="john@example.com" />
  </div>
  <div>
    <label htmlFor="password" className="block text-sm font-medium">Password</label>
    <Input type="password" name="password" id="password" required placeholder="Min 8 characters" minLength={8} />
  </div>
  <Button type="submit">Create Account</Button>
</form>`,
    },
    application: {
      default: `<form onSubmit={handleSubmit} style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
    <input type="text" name="firstName" required placeholder="First Name" />
    <input type="text" name="lastName" required placeholder="Last Name" />
  </div>
  <input type="email" name="email" required placeholder="Email" />
  <input type="tel" name="phone" required placeholder="Phone" pattern="[0-9]{10,}" />
  <textarea name="experience" required placeholder="Describe your experience..."></textarea>
  <select name="availability" required>
    <option value="">Select Availability</option>
    <option value="full-time">Full Time</option>
    <option value="part-time">Part Time</option>
    <option value="contract">Contract</option>
  </select>
  <label><input type="checkbox" name="remote" /> Open to remote work</label>
  <button type="submit">Submit Application</button>
</form>`,
      shadcn: `import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<form onSubmit={handleSubmit} className="space-y-4 max-w-md">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label htmlFor="firstName" className="block text-sm font-medium">First Name</label>
      <Input type="text" name="firstName" id="firstName" required />
    </div>
    <div>
      <label htmlFor="lastName" className="block text-sm font-medium">Last Name</label>
      <Input type="text" name="lastName" id="lastName" required />
    </div>
  </div>
  <div>
    <label htmlFor="email" className="block text-sm font-medium">Email</label>
    <Input type="email" name="email" id="email" required />
  </div>
  <div>
    <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
    <Input type="tel" name="phone" id="phone" required pattern="[0-9]{10,}" />
  </div>
  <div>
    <label htmlFor="experience" className="block text-sm font-medium">Experience</label>
    <Textarea name="experience" id="experience" required />
  </div>
  <div>
    <label htmlFor="availability" className="block text-sm font-medium">Availability</label>
    <Select name="availability" required>
      <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="full-time">Full Time</SelectItem>
        <SelectItem value="part-time">Part Time</SelectItem>
        <SelectItem value="contract">Contract</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="flex items-center gap-2">
    <input type="checkbox" name="remote" id="remote" /> 
    <label htmlFor="remote" className="text-sm">Open to remote work</label>
  </div>
  <Button type="submit">Submit Application</Button>
</form>`,
    },
    newsletter: {
      default: `<form onSubmit={handleSubmit} style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="text" name="name" required placeholder="Your name" />
  <input type="email" name="email" required placeholder="Email address" />
  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
    <input type="checkbox" name="subscribe" required /> 
    Subscribe to newsletter
  </label>
  <button type="submit">Subscribe</button>
</form>`,
      shadcn: `import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

<form onSubmit={handleSubmit} className="space-y-4 max-w-md">
  <div>
    <label htmlFor="name" className="block text-sm font-medium">Name</label>
    <Input type="text" name="name" id="name" required placeholder="Your name" />
  </div>
  <div>
    <label htmlFor="email" className="block text-sm font-medium">Email</label>
    <Input type="email" name="email" id="email" required placeholder="you@example.com" />
  </div>
  <div className="flex items-center gap-2">
    <input type="checkbox" name="subscribe" id="subscribe" required /> 
    <label htmlFor="subscribe" className="text-sm">Subscribe to newsletter</label>
  </div>
  <Button type="submit">Subscribe</Button>
</form>`,
    },
    survey: {
      default: `<form onSubmit={handleSubmit} style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="text" name="name" required placeholder="Your name" />
  <input type="email" name="email" required placeholder="Email" />
  <div>
    <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {[1,2,3,4,5].map(r => (
        <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <input type="radio" name="rating" value={r} required /> {r}
        </label>
      ))}
    </div>
  </div>
  <textarea name="feedback" required placeholder="Your feedback..."></textarea>
  <button type="submit">Submit Survey</button>
</form>`,
      shadcn: `import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

<form onSubmit={handleSubmit} className="space-y-4 max-w-md">
  <div>
    <label htmlFor="name" className="block text-sm font-medium">Name</label>
    <Input type="text" name="name" id="name" required placeholder="Your name" />
  </div>
  <div>
    <label htmlFor="email" className="block text-sm font-medium">Email</label>
    <Input type="email" name="email" id="email" required placeholder="you@example.com" />
  </div>
  <fieldset>
    <legend className="text-sm font-medium mb-2">Rating (1-5)</legend>
    <div className="flex gap-4">
      {[1,2,3,4,5].map(r => (
        <label key={r} className="flex items-center gap-1">
          <input type="radio" name="rating" value={r} required /> {r}
        </label>
      ))}
    </div>
  </fieldset>
  <div>
    <label htmlFor="feedback" className="block text-sm font-medium">Feedback</label>
    <Textarea name="feedback" id="feedback" required placeholder="Your feedback..." />
  </div>
  <Button type="submit">Submit Survey</Button>
</form>`,
    },
    signin: {
      default: `<form id="signin-form" style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="email" name="email" required placeholder="Email address" autocomplete="email" />
  <input type="password" name="password" required placeholder="Password" autocomplete="current-password" />
  <button type="submit">Sign In</button>
  <p style={{ textAlign: "center" }}>
    Don't have an account? <a href="/sign-up">Sign up</a>
  </p>
</form>

<script>
  const form = document.getElementById("signin-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const result = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data)),
    }).then(r => r.json());
    
    if (result.data) {
      window.location.href = "/dashboard";
    } else if (result.error) {
      alert(result.error.message);
    }
  });
</script>`,
      shadcn: `import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "formsdk/adapters/auth/better-auth";

export default function SignInForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    
    const result = await authClient.signIn.email({
      email: data.get("email") as string,
      password: data.get("password") as string,
    }, {
      onSuccess: () => window.location.href = "/dashboard",
      onError: (ctx) => alert(ctx.error.message),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <Input type="email" name="email" id="email" required placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <Input type="password" name="password" id="password" required />
      </div>
      <Button type="submit" className="w-full">Sign In</Button>
      <p className="text-center text-sm">
        Don't have an account? <a href="/sign-up" className="underline">Sign up</a>
      </p>
    </form>
  );
}`,
    },
    signout: {
      default: `<button id="signout-btn" style={{ padding: "0.75rem 1.5rem", background: "#dc2626", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
  Sign Out
</button>

<script>
  const btn = document.getElementById("signout-btn");
  btn?.addEventListener("click", async () => {
    const result = await fetch("/api/auth/sign-out", { method: "POST" }).then(r => r.json());
    if (!result.error) {
      window.location.href = "/sign-in";
    }
  });
</script>`,
      shadcn: `import { Button } from "@/components/ui/button";
import { authClient } from "formsdk/adapters/auth/better-auth";

export default function SignOutButton() {
  async function handleSignOut() {
    await authClient.signIn.signOut({
      onSuccess: () => window.location.href = "/sign-in",
    });
  }

  return (
    <Button onClick={handleSignOut} variant="destructive">
      Sign Out
    </Button>
  );
}`,
    },
  };

  const formTemplate = forms[type] || forms.contact;
  return formTemplate[ui] || formTemplate.default;
}

const BETTER_AUTH_PRISMA_TEMPLATE = `import { betterAuth } from "better-auth";
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

export type { auth };
`;

const BETTER_AUTH_DRIZZLE_TEMPLATE = `import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/postgres-js";
import { postgresAdapter } from "better-auth/adapters/drizzle";
import { db } from "./schema"; // your drizzle db instance

export const auth = betterAuth({
  database: postgresAdapter(db),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
});

export type { auth };
`;

const BETTER_AUTH_API_TEMPLATE = `import { auth } from "../config";

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
`;

export async function generateCommand(name: string, options: GenerateOptions = {}): Promise<void> {
  const {
    framework = "nextjs",
    ui = "default",
    orm = "postgres",
    captcha = false,
    outputDir = "./forms",
    type = "contact"
  } = options;

  const formType = FORM_TYPES[type] || FORM_TYPES.contact;

  console.log(`Generating form "${name}" (${formType.name}) for ${framework} with ${ui} UI and ${orm} ORM...`);

  if (formType.isAuth) {
    const baseDir = join(outputDir, name);
    await mkdir(baseDir, { recursive: true });

    const formCode = generateFormByType(type, ui, name);
    await writeFile(join(baseDir, "Form.tsx"), formCode);

    const authTemplate = orm === "prisma"
      ? BETTER_AUTH_PRISMA_TEMPLATE
      : orm === "drizzle"
        ? BETTER_AUTH_DRIZZLE_TEMPLATE
        : BETTER_AUTH_PRISMA_TEMPLATE;
    await writeFile(join(baseDir, "config.ts"), authTemplate);

    if (framework === "nextjs") {
      await mkdir(join(baseDir, "app/api/auth/[...catchall]"), { recursive: true });
      await writeFile(join(baseDir, "app/api/auth/[...catchall]/route.ts"), BETTER_AUTH_API_TEMPLATE);
    } else if (framework === "svelte") {
      await mkdir(join(baseDir, "src/routes/api/auth/[...catchall]"), { recursive: true });
      await writeFile(join(baseDir, "src/routes/api/auth/[...catchall]/+server.ts"), BETTER_AUTH_API_TEMPLATE);
    } else if (framework === "astro") {
      await mkdir(join(baseDir, "src/pages/api/auth"), { recursive: true });
      await writeFile(join(baseDir, "src/pages/api/auth/[...path].ts"), BETTER_AUTH_API_TEMPLATE);
    }

    await writeFile(join(baseDir, "README.md"), `# ${name} - Better Auth

Generated by formsdk CLI - Better Auth Integration

**Type:** ${formType.name}
**Framework:** ${framework}
**ORM:** ${orm}

## Setup

1. Install better-auth: \`bun add better-auth\`
2. Install the ${orm} adapter: \`bun add @prisma/client\` (for Prisma)
3. Run \`npx prisma db push\` to create the auth tables

## Files

- \`Form.tsx\` - Auth form component
- \`config.ts\` - Better Auth configuration  
- API route handler

## API Endpoints

- \`POST /api/auth/sign-in/email\` - Sign in with email/password
- \`POST /api/auth/sign-up/email\` - Sign up with email/password
- \`POST /api/auth/sign-out\` - Sign out

## Environment Variables

\`\`\`env
DATABASE_URL=postgres://user:password@host:port/database
\`\`\`
`);
    return;
  }

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

  const formCode = generateFormByType(type, ui, name);
  await writeFile(join(baseDir, "Form.tsx"), formCode);

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

  const fieldsCode = Object.entries(formType.fields)
    .map(([key, validator]) => `    ${key}: ${validator}`)
    .join(",\n");

  const ormCode = ORM_TEMPLATES[orm] || ORM_TEMPLATES.postgres;
  await writeFile(join(baseDir, "config.ts"), `${ormCode}

export const ${name}Form = createForm({
  fields: {
${fieldsCode}
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