import { mkdir, writeFile } from "fs/promises";

export async function initCommand(): Promise<void> {
  console.log("Initializing formsdk...");

  await mkdir("./formsdk", { recursive: true });
  await writeFile("./formsdk/config.ts", `import { createForm, registerDBAdapter } from "formsdk";

export const config = {
  adapters: {},
  forms: {},
};
`);

  console.log("Created ./formsdk/config.ts");
  console.log("Run 'bun x formsdk generate <form-name>' to create your first form.");
}