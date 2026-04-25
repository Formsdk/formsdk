import { useState, useCallback } from "react";
import type { FormResult, FieldError } from "./types";

export interface UseFormOptions {
  action: string;
  onSuccess?: () => void;
  onError?: (errors: FieldError[]) => void;
}

export interface UseFormReturn {
  status: "idle" | "loading" | "success" | "error";
  errors: Record<string, string>;
  submit: (data: Record<string, unknown>) => Promise<FormResult | null>;
  reset: () => void;
}

export function useForm({ action, onSuccess, onError }: UseFormOptions): UseFormReturn {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useCallback(async (data: Record<string, unknown>): Promise<FormResult | null> => {
    setStatus("loading");
    setErrors({});

    try {
      const res = await fetch(action, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json() as FormResult;

      if (result && result.success) {
        setStatus("success");
        onSuccess?.();
        return result;
      }

      if (result && !result.success && result.errors) {
        setStatus("error");
        const errs: Record<string, string> = {};
        result.errors.forEach((err: FieldError) => {
          errs[err.field] = err.message;
        });
        setErrors(errs);
        onError?.(result.errors);
        return result;
      }

      setStatus("error");
      return null;
    } catch {
      setStatus("error");
      return null;
    }
  }, [action, onSuccess, onError]);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrors({});
  }, []);

  return { status, errors, submit, reset };
}
