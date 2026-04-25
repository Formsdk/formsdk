import { registerDBAdapter, DBAdapter, FormContext } from "../db";

interface PrismaAdapterOptions {
  client: any;
  modelName?: string;
}

function createPrismaAdapter(options: PrismaAdapterOptions): DBAdapter {
  return {
    async save(
      _formId: string,
      data: Record<string, any>,
      _ctx: FormContext
    ): Promise<void> {
      const modelName = options.modelName || "formSubmission";
      const model = options.client[modelName.charAt(0).toUpperCase() + modelName.slice(1)];

      if (!model) {
        throw new Error(`Prisma model "${modelName}" not found`);
      }

      await model.create({ data });
    },
  };
}

export { createPrismaAdapter };