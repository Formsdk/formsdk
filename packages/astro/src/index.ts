import type { FormConfig } from "@formsdk/core";
import { handleRequest } from "@formsdk/core";

export { handleRequest, type FormConfig };

export interface FormActionOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  fields: Record<string, (value: unknown) => boolean>;
  captcha?: "turnstile";
  db?: string;
  onSubmit?: (body: T) => Promise<void>;
}

export function defineAction<T extends Record<string, unknown>>(
  options: FormActionOptions<T>
) {
  return {
    async handler(body: T, context?: { ip?: string }) {
      return handleRequest({
        config: {
          fields: options.fields,
          captcha: options.captcha,
          db: options.db,
          onSubmit: options.onSubmit,
        },
        body,
        ctx: context,
      });
    },
  };
}
