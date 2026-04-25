import { test, expect } from "bun:test";
import { createForm, handleRequest } from "./src/index";

test("createForm returns config", () => {
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