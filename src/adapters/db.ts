export interface DBAdapter {
  save(formId: string, data: Record<string, any>, ctx: FormContext): Promise<void>;
}

export interface FormContext {
  ip?: string;
  headers?: Record<string, string>;
}

const dbAdapters: Record<string, DBAdapter> = {};

export function registerDBAdapter(name: string, adapter: DBAdapter): void {
  dbAdapters[name] = adapter;
}

export function getDBAdapter(name: string): DBAdapter | undefined {
  return dbAdapters[name];
}