import { createForm, registerDBAdapter } from "formsdk";
import { createSupabaseAdapter } from "formsdk/adapters/supabase";

registerDBAdapter("supabase", createSupabaseAdapter({
  url: import.meta.env.PUBLIC_SUPABASE_URL!,
  anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
}));

export const applicationForm = createForm({
  fields: {
    firstName: (v) => typeof v === 'string' && v.length >= 2,
    lastName: (v) => typeof v === 'string' && v.length >= 2,
    email: (v) => typeof v === 'string' && v.includes('@'),
    phone: (v) => typeof v === 'string' && v.length >= 10,
    experience: (v) => typeof v === 'string' && v.length > 0,
    remote: (v) => typeof v === 'boolean',
    availability: (v) => typeof v === 'string' && ['full-time', 'part-time', 'contract'].includes(v)
  },
  captcha: undefined,
  db: "supabase",
  onSubmit: async (data, ctx) => {
    console.log("Form submitted:", data);
  },
});