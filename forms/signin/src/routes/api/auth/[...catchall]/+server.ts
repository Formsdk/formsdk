import { auth } from "../config";

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
