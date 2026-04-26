import type { FormConfig, FormState, FormResult, FormContext } from "./types.ts";

type Subscriber = () => void;

class Field {
  name: string;
  value: unknown = "";
  error: string | null = null;
  touched: boolean = false;
  dirty: boolean = false;
  initialValue: unknown = "";
  subscribers: Set<Subscriber> = new Set();

  constructor(name: string, initialValue?: unknown) {
    this.name = name;
    this.initialValue = initialValue ?? "";
    this.value = this.initialValue;
  }

  update(value: unknown, error: string | null = null) {
    const wasDirty = this.dirty;
    this.value = value;
    this.dirty = this.value !== this.initialValue;
    this.error = error;
    this.notify();
  }

  setTouched(touched: boolean = true) {
    if (this.touched !== touched) {
      this.touched = touched;
      this.notify();
    }
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    this.subscribers.forEach((fn) => fn());
  }

  destroy() {
    this.subscribers.clear();
  }
}

type FormErrors = Record<string, string>;

export class FormStore<T extends Record<string, unknown> = Record<string, unknown>> {
  fields: Map<string, Field> = new Map();
  config: FormConfig<T>;
  status: FormStatus = "idle";
  globalError: string | null = null;
  subscribers: Set<Subscriber> = new Set();
  abortController: AbortController | null = null;

  constructor(config: FormConfig<T>) {
    this.config = config;
    this.initFields(config.initialValues);
  }

  private initFields(initialValues?: T) {
    if (initialValues) {
      Object.entries(initialValues).forEach(([name, value]) => {
        const field = new Field(name, value);
        this.fields.set(name, field);
      });
    }
  }

  getField(name: string): Field {
    let field = this.fields.get(name);
    if (!field) {
      field = new Field(name);
      this.fields.set(name, field);
    }
    return field;
  }

  getFieldState(name: string) {
    const field = this.getField(name);
    return {
      error: field.error,
      touched: field.touched,
      dirty: field.dirty,
    };
  }

  setValue(name: string, value: unknown) {
    const field = this.getField(name);
    field.update(value);
    this.notify();
  }

  setError(name: string, message: string) {
    const field = this.getField(name);
    field.update(field.value, message);
    this.notify();
  }

  setGlobalError(message: string) {
    this.globalError = message;
    this.notify();
  }

  clearErrors(name?: string) {
    if (name) {
      const field = this.getField(name);
      field.error = null;
      field.notify();
    } else {
      this.fields.forEach((field) => {
        field.error = null;
        field.notify();
      });
      this.globalError = null;
    }
    this.notify();
  }

  setStatus(status: FormStatus) {
    this.status = status;
    this.notify();
  }

  reset(values?: Partial<T>) {
    this.status = "idle";
    this.globalError = null;
    this.abortController?.abort();
    this.abortController = null;

    if (values) {
      Object.entries(values).forEach(([name, value]) => {
        const field = this.getField(name);
        field.value = value;
        field.error = null;
        field.touched = false;
        field.dirty = false;
        field.notify();
      });
    } else {
      this.fields.forEach((field) => {
        field.value = field.initialValue;
        field.error = null;
        field.touched = false;
        field.dirty = false;
        field.notify();
      });
    }
    this.notify();
  }

  getValues(): T {
    const values: Record<string, unknown> = {};
    this.fields.forEach((field, name) => {
      values[name] = field.value;
    });
    return values as T;
  }

  getFormState(): FormState {
    const errors: FormErrors = {};
    this.fields.forEach((field, name) => {
      if (field.error) {
        errors[name] = field.error;
      }
    });

    const touched = new Set<string>();
    this.fields.forEach((field, name) => {
      if (field.touched) touched.add(name);
    });

    let dirty = false;
    this.fields.forEach((field) => {
      if (field.dirty) {
        dirty = true;
        return;
      }
    });

    return {
      status: this.status,
      errors,
      touched,
      dirty,
      isSubmitting: this.status === "loading",
    };
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    this.subscribers.forEach((fn) => fn());
  }

  async submit(): Promise<{ success: boolean; data?: unknown; error?: unknown }> {
    if (this.status === "loading") {
      return { success: false, error: "Already submitting" };
    }

    this.abortController?.abort();
    this.abortController = new AbortController();

    this.setStatus("loading");
    this.clearErrors();

    try {
      const method = this.config.method || "POST";
      const keepalive = typeof navigator !== "undefined" && "sendBeacon" in navigator
        ? true
        : false;

      const response = await fetch(this.config.action, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.getValues()),
        signal: this.abortController.signal,
        keepalive,
      });

      const result = await response.json() as {
        success: boolean;
        errors?: FieldError[];
        message?: string;
      };

      if (result.success) {
        this.setStatus("success");
        this.config.onSuccess?.(result);
        return { success: true, data: result };
      }

      if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach((err) => {
          this.setError(err.field, err.message);
        });
      }

      if (!result.errors && result.message) {
        this.setGlobalError(result.message);
      }

      this.setStatus("error");
      this.config.onError?.(result);
      return { success: false, error: result };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, error: "Request cancelled" };
      }
      this.setStatus("error");
      this.config.onError?.(err);
      return { success: false, error: err };
    }
  }

  destroy() {
    this.fields.forEach((field) => field.destroy());
    this.fields.clear();
    this.subscribers.clear();
    this.abortController?.abort();
  }
}

export function createFormStore<T extends Record<string, unknown> = Record<string, unknown>>(
  config: FormConfig<T>
): FormStore<T> {
  return new FormStore(config);
}
