export interface CLIConfig {
  framework: "nextjs" | "svelte" | "react";
  ui: "shadcn" | "chakra" | "default";
  orm: "prisma" | "drizzle" | "postgres" | "supabase" | "neon" | "turso";
  adapter: string;
  captcha: boolean;
  outputDir: string;
}

export const DEFAULT_CONFIG: Partial<CLIConfig> = {
  framework: "nextjs",
  ui: "default",
  orm: "postgres",
  captcha: false,
  outputDir: "./forms",
};