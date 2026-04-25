import type { DBAdapter, FormContext } from "./db.ts";

interface PostgresAdapterOptions {
  connectionString: string;
  table?: string;
}

function createPostgresAdapter(options: PostgresAdapterOptions): DBAdapter {
  return {
    async save(
      _formId: string,
      data: Record<string, any>,
      _ctx: FormContext
    ): Promise<void> {
      const postgres = (await import("postgres")).default;
      const sql = postgres(options.connectionString);

      const table = options.table || "form_submissions";
      const columns = Object.keys(data);
      const values = Object.values(data);

      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

      const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

      await sql.unsafe(query, values);
      await sql.end();
    },
  };
}

export { createPostgresAdapter };