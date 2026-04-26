import type { FormConfig, FieldError, FormResult, FormContext } from "./types.ts";
import { getDBAdapter } from "./adapters/db.ts";

interface EnvConfig {
  TURNSTILE_SECRET?: string;
}

let envConfig: EnvConfig = {};

export function setEnv(config: EnvConfig): void {
  envConfig = config;
}

export function clearEnv(): void {
  envConfig = {};
}

export function getEnv(key: keyof EnvConfig): string | undefined {
  return envConfig[key] || process.env[key];
}

interface HandleRequestOptions {
  config: {
    fields: Record<string, (value: unknown) => boolean>;
    captcha?: "turnstile";
    db?: string;
    onSubmit?: (body: Record<string, unknown>, ctx?: FormContext) => Promise<void>;
  };
  body: Record<string, unknown>;
  ctx?: FormContext;
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
    const token = ctx?.headers?.["x-turnstile-token"];
    if (!token) {
      return { success: false, errors: [{ field: "captcha", message: "Captcha token required" }] };
    }

    const secretKey = getEnv("TURNSTILE_SECRET");
    if (!secretKey) {
      throw new Error("TURNSTILE_SECRET not set");
    }

    const { createTurnstileAdapter } = await import("./adapters/turnstile.ts");
    const adapter = createTurnstileAdapter({ secretKey });
    const valid = await adapter.verify(token, ctx?.ip);
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

export function createForm<T extends Record<string, unknown>>(config: FormConfig<T>): FormConfig<T> {
  return config;
}

export type { EnvConfig };
