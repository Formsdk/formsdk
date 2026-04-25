import { registerDBAdapter, DBAdapter, FormContext } from "./db";

interface TursoAdapterOptions {
  url: string;
  authToken?: string;
  table?: string;
}

function createTursoAdapter(options: TursoAdapterOptions): DBAdapter {
  return {
    async save(
      _formId: string,
      data: Record<string, any>,
      _ctx: FormContext
    ): Promise<void> {
      const table = options.table || "form_submissions";
      const columns = Object.keys(data);
      const values = Object.values(data);

      const placeholders = values.map(() => "?").join(", ");

      const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

      const { createClient } = await import("@libsql/client");

      const client = createClient({
        url: options.url,
        authToken: options.authToken,
      });

      await client.execute(query, values);
      await client.close();
    },
  };
}

export { createTursoAdapter };