import type { DBAdapter, FormContext } from "../types.ts";

const dbAdapters: Record<string, DBAdapter> = {};

export function registerDBAdapter(name: string, adapter: DBAdapter): void {
  dbAdapters[name] = adapter;
}

export function getDBAdapter(name: string): DBAdapter | undefined {
  return dbAdapters[name];
}
