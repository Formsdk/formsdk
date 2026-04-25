import { registerDBAdapter, DBAdapter, FormContext } from "./db";

interface NeonAdapterOptions {
  connectionString: string;
  table?: string;
}

function createNeonAdapter(options: NeonAdapterOptions): DBAdapter {
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

      const { Pool, neonConfig } = await import("@neondatabase/serverless");
      const ws = await import("ws");

      neonConfig.webSocketConstructor = ws.default;
      const pool = new Pool({ connectionString: options.connectionString });

      try {
        await pool.query(query, values);
      } finally {
        await pool.end();
      }
    },
  };
}

export { createNeonAdapter };