import { useState, useCallback } from "react";
import type { FormResult, FieldError } from "../types.ts";

interface UseFormOptions {
  onSuccess?: () => void;
  onError?: (errors: FieldError[]) => void;
}

interface UseFormReturn {
  status: "idle" | "loading" | "success" | "error";
  errors: Record<string, string>;
  submit: (endpoint: string, data: Record<string, unknown>) => Promise<FormResult | null>;
  reset: () => void;
}

export function useForm(options: UseFormOptions = {}): UseFormReturn {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useCallback(async (endpoint: string, data: Record<string, unknown>): Promise<FormResult | null> => {
    setStatus("loading");
    setErrors({});

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json() as FormResult;

      if (result && result.success) {
        setStatus("success");
        options.onSuccess?.();
        return result;
      } else if (result && !result.success) {
        setStatus("error");
        if (result.errors) {
          const errs: Record<string, string> = {};
          result.errors.forEach((err: FieldError) => {
            errs[err.field] = err.message;
          });
          setErrors(errs);
          options.onError?.(result.errors);
        }
        return result;
      }
      setStatus("error");
      return null;
    } catch {
      setStatus("error");
      return null;
    }
  }, [options]);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrors({});
  }, []);

  return { status, errors, submit, reset };
}