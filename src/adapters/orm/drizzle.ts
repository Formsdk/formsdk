import { registerDBAdapter, DBAdapter, FormContext } from "../db";

interface DrizzleAdapterOptions {
  db: any;
  table: any;
}

function createDrizzleAdapter(options: DrizzleAdapterOptions): DBAdapter {
  return {
    async save(
      _formId: string,
      data: Record<string, any>,
      _ctx: FormContext
    ): Promise<void> {
      const { insert } = await import("drizzle-orm");
      const tableName = options.table;

      await options.db.insert(tableName).values(data);
    },
  };
}

export { createDrizzleAdapter };