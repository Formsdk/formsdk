import { FormConfig, FormContext, FieldError, FormResult } from "./types";
import { getDBAdapter } from "./adapters/db";
import { getCaptchaAdapter } from "./adapters/captcha";
import { createTurnstileAdapter } from "./adapters/turnstile";

interface EnvConfig {
  TURNSTILE_SECRET?: string;
}

let envConfig: EnvConfig = {};

export function setEnv(config: EnvConfig): void {
  envConfig = config;
}

interface HandleRequestOptions {
  config: FormConfig;
  body: Record<string, any>;
  ctx: FormContext;
}

export async function handleRequest(
  options: HandleRequestOptions
): Promise<FormResult> {
  const { config, body, ctx } = options;
  const errors: FieldError[] = [];

  for (const [field, validator] of Object.entries(config.fields)) {
    if (!validator(body[field])) {
      errors.push({ field, message: `Invalid ${field}` });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  if (config.captcha === "turnstile") {
    const token = ctx.headers?.["x-turnstile-token"];
    if (!token) {
      return { success: false, errors: [{ field: "captcha", message: "Captcha token required" }] };
    }

    const secretKey = envConfig.TURNSTILE_SECRET || process.env.TURNSTILE_SECRET;
    if (!secretKey) {
      throw new Error("TURNSTILE_SECRET not set");
    }

    const adapter = createTurnstileAdapter({ secretKey });
    const valid = await adapter.verify(token, ctx.ip);
    if (!valid) {
      return { success: false, errors: [{ field: "captcha", message: "Captcha verification failed" }] };
    }
  }

  if (config.db) {
    const adapter = getDBAdapter(config.db);
    if (!adapter) {
      throw new Error(`DB adapter "${config.db}" not found`);
    }
    await adapter.save(config.db, body, ctx);
  }

  if (config.onSubmit) {
    await config.onSubmit(body, ctx);
  }

  return { success: true, message: "Form submitted successfully" };
}

export function createForm(config: FormConfig): FormConfig {
  return config;
}