import type { CaptchaAdapter } from "../types.ts";

export function createTurnstileAdapter({ secretKey }: { secretKey: string }): CaptchaAdapter {
  return {
    async verify(token: string, ip?: string): Promise<boolean> {
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          ...(ip && { remoteip: ip }),
        }),
      });

      const result = await response.json() as { success: boolean };
      return result.success;
    },
  };
}
