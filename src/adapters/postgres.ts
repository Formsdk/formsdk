import { registerDBAdapter, DBAdapter, FormContext } from "./db";

type QueryFn = (
  strings: TemplateStringsArray,
  ...values: any[]
) => Promise<any>;

interface PostgresAdapterOptions {
  query: QueryFn;
  table?: string;
}

function createPostgresAdapter(options: PostgresAdapterOptions): DBAdapter {
  return {
    async save(
      _formId: string,
      data: Record<string, any>,
      _ctx: FormContext
    ): Promise<void> {
      const table = options.table || "form_submissions";
      const columns = Object.keys(data);
      const values = Object.values(data);

      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

      const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

      await options.query`${query}`.using(values);
    },
  };
}

export { createPostgresAdapter };