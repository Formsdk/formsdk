import type { CaptchaAdapter } from "./captcha.ts";

interface TurnstileAdapterOptions {
  secretKey: string;
}

function createTurnstileAdapter(options: TurnstileAdapterOptions): CaptchaAdapter {
  return {
    async verify(token: string, ip?: string): Promise<boolean> {
      const body = new URLSearchParams({
        secret: options.secretKey,
        response: token,
        ...(ip && { remoteip: ip }),
      });

      const result = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        }
      );

      const data = await result.json() as any;
      return data.success === true;
    },
  };
}

export { createTurnstileAdapter };