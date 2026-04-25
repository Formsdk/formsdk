import { createForm, registerDBAdapter } from "formsdk";
import { createPrismaAdapter } from "formsdk/adapters/orm/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
registerDBAdapter("prisma", createPrismaAdapter({ client: prisma, modelName: "formSubmission" }));

export const contactForm = createForm({
  fields: {
    email: (v) => typeof v === "string" && v.includes("@"),
    message: (v) => typeof v === "string" && v.length > 10,
  },
  captcha: undefined,
  db: "prisma",
  onSubmit: async (data, ctx) => {
    console.log("Form submitted:", data);
  },
});