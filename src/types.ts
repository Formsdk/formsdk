export interface FormContext {
  ip?: string;
  headers?: Record<string, string>;
}

export interface FormConfig {
  fields: Record<string, (value: any) => boolean>;
  captcha?: "turnstile";
  db?: string;
  onSubmit?: (data: Record<string, any>, ctx: FormContext) => Promise<void>;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface FormResult {
  success: boolean;
  errors?: FieldError[];
  message?: string;
}