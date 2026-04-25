export { registerDBAdapter, getDBAdapter } from "./db";
export type { DBAdapter } from "./db";

export { registerCaptchaAdapter, getCaptchaAdapter } from "./captcha";
export type { CaptchaAdapter } from "./captcha";

export { createTurnstileAdapter } from "./turnstile";

export { createPostgresAdapter } from "./postgres";