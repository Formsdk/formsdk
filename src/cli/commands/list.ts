export async function listCommand(): Promise<void> {
  console.log(`
formsdk CLI - Available Templates

Frameworks:
  nextjs    Next.js (App Router)
  svelte    SvelteKit  
  react     React (Vite)

UI Libraries:
  shadcn    Shadcn/ui components
  chakra    Chakra UI (React only)
  default   Plain HTML/CSS

ORM Adapters:
  prisma    Prisma ORM
  drizzle   Drizzle ORM
  postgres  Generic PostgreSQL (postgres.js)
  supabase  Supabase
  neon      Neon (Serverless Postgres)
  turso     Turso (libSQL)

Captcha:
  turnstile Cloudflare Turnstile

Usage:
  formsdk generate myform --framework nextjs --ui shadcn --orm prisma --captcha
  formsdk list
  formsdk init
`);
}