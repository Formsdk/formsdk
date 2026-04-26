export type FieldError = {
  field: string;
  message: string;
};

export type FormStatus = "idle" | "loading" | "success" | "error";

export type ValidateOn = "submit" | "change" | "blur";

export type HTTPMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface FieldState {
  value: unknown;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface FormState {
  status: FormStatus;
  errors: Record<string, string>;
  touched: Set<string>;
  dirty: boolean;
  isSubmitting: boolean;
}

export interface FormConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  action: string;
  method?: HTTPMethod;
  validateOn?: ValidateOn;
  initialValues?: T;
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

export interface FormContext {
  ip?: string;
  headers?: Record<string, string>;
}

export interface DBAdapter {
  save(formId: string, data: Record<string, any>, ctx: FormContext): Promise<void>;
}

export interface CaptchaAdapter {
  verify(token: string, ip?: string): Promise<boolean>;
}

export type FormResult = 
  | { success: true; message?: string }
  | { success: false; errors: FieldError[] };
