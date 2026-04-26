import { get } from "svelte/store";
import type { FormConfig, FormState } from "@formsdk/core";
import { FormStore, createFormStore } from "@formsdk/core";

export { createFormStore, type FormConfig, type FormState };

export interface UseFormOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  action: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  initialValues?: T;
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

export interface FieldValue {
  value: unknown;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface UseFormReturn<T extends Record<string, unknown> = Record<string, unknown>> {
  form: {
    action: string;
    method: string;
  };
  fields: Record<string, FieldValue>;
  handleSubmit: (e: SubmitEvent) => void;
  setError: (name: string, message: string) => void;
  clearErrors: (name?: string) => void;
  reset: (values?: Partial<T>) => void;
  formState: FormState;
  values: T;
  getFieldState: (name: string) => { error: string | null; touched: boolean; dirty: boolean };
  subscribe: (fn: () => void) => () => void;
}

export function enhance<T extends Record<string, unknown> = Record<string, unknown>>(
  node: HTMLFormElement,
  options: UseFormOptions<T>
): { destroy: () => void } {
  const formStore = createFormStore(options as FormConfig<T>);
  let currentValues = formStore.getValues() as T;

  const updateValues = () => {
    currentValues = formStore.getValues() as T;
  };

  const unsubscribe = formStore.subscribe(() => {
    updateValues();
  });

  node.addEventListener("submit", (e) => {
    e.preventDefault();
    formStore.submit();
  });

  node.querySelectorAll("input, textarea, select").forEach((field) => {
    const el = field as HTMLInputElement;
    const name = el.name;

    if (name) {
      el.addEventListener("input", () => {
        formStore.setValue(name, el.value);
      });

      el.addEventListener("blur", () => {
        formStore.getField(name).setTouched(true);
      });
    }
  });

  return {
    destroy() {
      unsubscribe();
      formStore.destroy();
    },
  };
}

export function useForm<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const formStore = createFormStore(options as FormConfig<T>);

  const subscribe = (fn: () => void) => {
    return formStore.subscribe(fn);
  };

  return {
    form: {
      action: options.action,
      method: options.method || "POST",
    },
    fields: {} as Record<string, FieldValue>,
    handleSubmit: (e: SubmitEvent) => {
      e.preventDefault();
      formStore.submit();
    },
    setError: (name: string, message: string) => {
      formStore.setError(name, message);
    },
    clearErrors: (name?: string) => {
      formStore.clearErrors(name);
    },
    reset: (values?: Partial<T>) => {
      formStore.reset(values);
    },
    formState: formStore.getFormState(),
    values: formStore.getValues() as T,
    getFieldState: (name: string) => {
      return formStore.getFieldState(name);
    },
    subscribe,
  };
}
