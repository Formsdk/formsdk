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
      await options.db.insert(options.table).values(data);
    },
  };
}

export { createDrizzleAdapter };