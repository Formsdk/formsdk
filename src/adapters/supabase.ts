import { registerDBAdapter, DBAdapter, FormContext } from "./db";

interface SupabaseAdapterOptions {
  url: string;
  anonKey: string;
  table?: string;
}

function createSupabaseAdapter(options: SupabaseAdapterOptions): DBAdapter {
  return {
    async save(
      _formId: string,
      data: Record<string, any>,
      _ctx: FormContext
    ): Promise<void> {
      const table = options.table || "form_submissions";

      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(options.url, options.anonKey);

      await client.from(table).insert(data);
    },
  };
}

export { createSupabaseAdapter };