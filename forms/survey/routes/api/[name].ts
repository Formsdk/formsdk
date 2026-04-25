// src/routes/api/[name].ts
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
}