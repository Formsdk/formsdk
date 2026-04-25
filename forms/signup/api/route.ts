// app/api/[name]/route.ts
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
}