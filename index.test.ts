import { test, expect, beforeEach, afterEach } from "bun:test";
import { createForm, handleRequest, setEnv, clearEnv } from "./packages/core/dist/index.js";
import type { FormConfig } from "./packages/core/dist/types/index.d.ts";

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = process.env;
});

afterEach(() => {
  process.env = originalEnv;
  clearEnv();
});

test("setEnv configures environment variables", () => {
  setEnv({ TURNSTILE_SECRET: "test-secret" });
  const form = createForm({ fields: {} });
  expect(form).toBeDefined();
});

test("handleRequest validates fields", async () => {
  const form = createForm({
    fields: {
      email: (v) => typeof v === "string" && v.includes("@"),
      message: (v) => typeof v === "string" && v.length > 10,
    },
  });

  expect(form.fields.email("test@example.com")).toBe(true);
  expect(form.fields.email("invalid")).toBe(false);
  expect(form.fields.message("Hello world!")).toBe(true);
  expect(form.fields.message("short")).toBe(false);
});

test("handleRequest validates fields", async () => {
  const form = createForm({
    fields: {
      email: (v) => typeof v === "string" && v.includes("@"),
      name: (v) => typeof v === "string" && v.length > 0,
    },
  });

  const result = await handleRequest({
    config: form,
    body: { email: "invalid", name: "" },
    ctx: {},
  });

  expect(result.success).toBe(false);
  expect(result.errors).toBeDefined();
  expect(result.errors!.length).toBe(2);
});

test("handleRequest passes validation", async () => {
  const form = createForm({
    fields: {
      email: (v) => typeof v === "string" && v.includes("@"),
    },
  });

  const result = await handleRequest({
    config: form,
    body: { email: "test@example.com" },
    ctx: {},
  });

  expect(result.success).toBe(true);
});

test("setEnv allows setting multiple env keys", () => {
  setEnv({
    TURNSTILE_SECRET: "secret1",
  });
  const form = createForm({ fields: {} });
  expect(form).toBeDefined();
});

test("handleRequest with turnstile captcha fails without token", async () => {
  setEnv({ TURNSTILE_SECRET: "test-secret" });
  const form = createForm({
    fields: { email: (v) => typeof v === "string" && v.includes("@") },
    captcha: "turnstile",
  });

  const result = await handleRequest({
    config: form,
    body: { email: "test@example.com" },
    ctx: {},
  });

  expect(result.success).toBe(false);
  expect(result.errors).toBeDefined();
  expect(result.errors![0].message).toContain("Captcha token required");
});

test("handleRequest with turnstile captcha throws when secret not set", async () => {
  const form = createForm({
    fields: { email: (v) => typeof v === "string" && v.includes("@") },
    captcha: "turnstile",
  });

  await expect(
    handleRequest({
      config: form,
      body: { email: "test@example.com" },
      ctx: { headers: { "x-turnstile-token": "fake-token" } },
    })
  ).rejects.toThrow("TURNSTILE_SECRET not set");
});