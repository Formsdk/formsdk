import { createForm, registerDBAdapter, createNeonAdapter } from "@formsdk/sdk";

registerDBAdapter("neon", createNeonAdapter({ connectionString: import.meta.env.DATABASE_URL! }));

export const surveyForm = createForm({
  fields: {
    name: (v) => typeof v === 'string' && v.length >= 2,
    email: (v) => typeof v === 'string' && v.includes('@'),
    rating: (v) => typeof v === 'number' && v >= 1 && v <= 5,
    feedback: (v) => typeof v === 'string' && v.length > 0
  },
  captcha: undefined,
  db: "neon",
  onSubmit: async (data, ctx) => {
    console.log("Form submitted:", data);
  },
});