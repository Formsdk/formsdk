// src/pages/api/[name].ts
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
};