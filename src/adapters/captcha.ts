export interface CaptchaAdapter {
  verify(token: string, ip?: string): Promise<boolean>;
}

export interface FormContext {
  ip?: string;
  headers?: Record<string, string>;
}

const captchaAdapters: Record<string, CaptchaAdapter> = {};

export function registerCaptchaAdapter(name: string, adapter: CaptchaAdapter): void {
  captchaAdapters[name] = adapter;
}

export function getCaptchaAdapter(name: string): CaptchaAdapter | undefined {
  return captchaAdapters[name];
}