import { createForm, registerDBAdapter } from "formsdk";
import { createPostgresAdapter } from "formsdk/adapters/postgres";

registerDBAdapter("postgres", createPostgresAdapter({ connectionString: process.env.DATABASE_URL! }));

export const signupForm = createForm({
  fields: {
    name: (v) => typeof v === 'string' && v.length >= 2,
    email: (v) => typeof v === 'string' && v.includes('@'),
    password: (v) => typeof v === 'string' && v.length >= 8
  },
  captcha: undefined,
  db: "postgres",
  onSubmit: async (data, ctx) => {
    console.log("Form submitted:", data);
  },
});