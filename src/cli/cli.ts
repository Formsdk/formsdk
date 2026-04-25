#!/usr/bin/env bun

import enquirer from "enquirer";
const { Select, Input, Confirm } = enquirer;
import { generateCommand } from "./commands/generate.ts";
import { initCommand } from "./commands/init.ts";
import { listCommand } from "./commands/list.ts";

const CATPPUCCIN = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  overlay0: "#7f7f8a",
  text: "#cdd6f4",
  subtext1: "#bac2de",
  blue: "#89b4fa",
  lavender: "#b4befe",
  sapphire: "#74c7ec",
  sky: "#89dceb",
  teal: "#94e2d5",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  peach: "#fab387",
  maroon: "#eba0ac",
  red: "#f38ba8",
  mauve: "#cba6f7",
  pink: "#f5c2e7",
};

function hexToAnsi(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

const FG = {
  primary: hexToAnsi(CATPPUCCIN.lavender),
  secondary: hexToAnsi(CATPPUCCIN.text),
  muted: hexToAnsi(CATPPUCCIN.subtext1),
  accent: hexToAnsi(CATPPUCCIN.blue),
  success: hexToAnsi(CATPPUCCIN.green),
  warning: hexToAnsi(CATPPUCCIN.yellow),
  error: hexToAnsi(CATPPUCCIN.red),
  info: hexToAnsi(CATPPUCCIN.sapphire),
  highlight: hexToAnsi(CATPPUCCIN.mauve),
  reset: "\x1b[0m",
};

const FRAMEWORKS = [
  { name: "nextjs", message: "Next.js (App Router)" },
  { name: "svelte", message: "SvelteKit" },
  { name: "react", message: "React (Vite)" },
  { name: "astro", message: "Astro" },
  { name: "solidjs", message: "SolidJS + TanStack Start" },
];

const FORM_TYPES = [
  { name: "contact", message: "Contact Form (email, message)" },
  { name: "signup", message: "Signup (name, email, password)" },
  { name: "signin", message: "Sign In (email, password) - Better Auth" },
  { name: "signout", message: "Sign Out - Better Auth" },
  { name: "application", message: "Job Application (full form)" },
  { name: "newsletter", message: "Newsletter (with checkbox)" },
  { name: "survey", message: "Survey (with rating)" },
];

const UI_LIBRARIES = [
  { name: "shadcn", message: "Shadcn/ui components" },
  { name: "chakra", message: "Chakra UI (React only)" },
  { name: "default", message: "Plain HTML/CSS" },
];

const ORMS = [
  { name: "postgres", message: "Generic PostgreSQL" },
  { name: "supabase", message: "Supabase" },
  { name: "neon", message: "Neon (Serverless Postgres)" },
  { name: "turso", message: "Turso (libSQL)" },
  { name: "prisma", message: "Prisma ORM" },
  { name: "drizzle", message: "Drizzle ORM" },
];

async function runInteractive(): Promise<Record<string, any>> {
  console.log(`\n${FG.highlight}╭───────────────────────────────────────╮${FG.reset}`);
  console.log(`${FG.highlight}│${FG.reset}  ${FG.primary}formsdk generate${FG.reset} ${FG.muted}- Interactive Mode${FG.reset}  ${FG.highlight}│${FG.reset}`);
  console.log(`${FG.highlight}╰───────────────────────────────────────╯${FG.reset}\n`);

  const namePrompt = new Input({
    name: "name",
    message: `${FG.info}form name${FG.reset} (e.g. contact, newsletter):`,
    validate: (value: string) => value.length > 0 || "Name is required",
    style: {
      prompt: `${FG.accent}?${FG.reset}`,
      cursor: `${FG.highlight}│${FG.reset}`,
    },
  });
  const name = await namePrompt.run();

  const typePrompt = new Select({
    name: "type",
    message: `${FG.info}select form type${FG.reset}:`,
    choices: FORM_TYPES.map((t) => ({
      name: t.name,
      message: `${FG.secondary}${t.name}${FG.reset}  ${FG.muted}${t.message}${FG.reset}`,
      indicator: {
        selected: `${FG.success}●${FG.reset}`,
        unselected: `${FG.surface0}○${FG.reset}`,
      },
    })),
    initial: 0,
    pointer: `${FG.highlight}▶${FG.reset}`,
  });
  const type = await typePrompt.run();

  const frameworkPrompt = new Select({
    name: "framework",
    message: `${FG.info}select framework${FG.reset}:`,
    choices: FRAMEWORKS.map((f) => ({
      name: f.name,
      message: `${FG.secondary}${f.name}${FG.reset}  ${FG.muted}${f.message}${FG.reset}`,
      indicator: {
        selected: `${FG.success}●${FG.reset}`,
        unselected: `${FG.surface0}○${FG.reset}`,
      },
    })),
    initial: 0,
    pointer: `${FG.highlight}▶${FG.reset}`,
  });
  const framework = await frameworkPrompt.run();

  const uiPrompt = new Select({
    name: "ui",
    message: `${FG.info}select ui library${FG.reset}:`,
    choices: UI_LIBRARIES.map((u) => ({
      name: u.name,
      message: `${FG.secondary}${u.name}${FG.reset}  ${FG.muted}${u.message}${FG.reset}`,
      indicator: {
        selected: `${FG.success}●${FG.reset}`,
        unselected: `${FG.surface0}○${FG.reset}`,
      },
    })),
    initial: 2,
    pointer: `${FG.highlight}▶${FG.reset}`,
  });
  const ui = await uiPrompt.run();

  const ormPrompt = new Select({
    name: "orm",
    message: `${FG.info}select database/orm${FG.reset}:`,
    choices: ORMS.map((o) => ({
      name: o.name,
      message: `${FG.secondary}${o.name}${FG.reset}  ${FG.muted}${o.message}${FG.reset}`,
      indicator: {
        selected: `${FG.success}●${FG.reset}`,
        unselected: `${FG.surface0}○${FG.reset}`,
      },
    })),
    initial: 0,
    pointer: `${FG.highlight}▶${FG.reset}`,
  });
  const orm = await ormPrompt.run();

  const captchaPrompt = new Confirm({
    name: "captcha",
    message: `${FG.warning}enable turnstile captcha?${FG.reset}`,
    initial: false,
    enabled: `${FG.success}yes${FG.reset}`,
    disabled: `${FG.error}no${FG.reset}`,
  });
  const captcha = await captchaPrompt.run();

  const outputPrompt = new Input({
    name: "outputDir",
    message: `${FG.info}output directory${FG.reset}:`,
    initial: "./forms",
  });
  const outputDir = await outputPrompt.run();

  console.log(`\n${FG.accent}╭─ ${FG.highlight}summary${FG.reset} ${FG.accent}───────────────────────────────────╮${FG.reset}`);
  console.log(`${FG.accent}│${FG.reset}`);
  console.log(`${FG.accent} │  ${FG.muted}name:${FG.reset}      ${FG.secondary}${name}${FG.reset}`);
  console.log(`${FG.accent} │  ${FG.muted}framework:${FG.reset} ${FG.highlight}${framework}${FG.reset}`);
  console.log(`${FG.accent} │  ${FG.muted}ui:${FG.reset}        ${FG.secondary}${ui}${FG.reset}`);
  console.log(`${FG.accent} │  ${FG.muted}orm:${FG.reset}       ${FG.secondary}${orm}${FG.reset}`);
  console.log(`${FG.accent} │  ${FG.muted}captcha:${FG.reset}   ${captcha ? FG.success + "yes" : FG.error + "no"}${FG.reset}`);
  console.log(`${FG.accent} │  ${FG.muted}output:${FG.reset}    ${FG.muted}${outputDir}${FG.reset}`);
  console.log(`${FG.accent} │${FG.reset}`);
  console.log(`${FG.accent}╰─────────────────────────────────────────────────────╯${FG.reset}\n`);

  const confirmPrompt = new Confirm({
    name: "confirm",
    message: `${FG.success}proceed with generation?${FG.reset}`,
    initial: true,
    enabled: `${FG.success}yes${FG.reset}`,
    disabled: `${FG.error}no${FG.reset}`,
  });
  const confirmed = await confirmPrompt.run();

  if (!confirmed) {
    console.log(`\n${FG.muted}  aborted.${FG.reset}\n`);
    process.exit(0);
  }

  return { name, type, framework, ui, orm, captcha, outputDir };
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(`
${FG.highlight} ╭───────────────────────────────────────────────────────╮${FG.reset}
${FG.highlight} │${FG.reset}   ${FG.primary}formsdk${FG.reset}  ${FG.muted}- Zero-lock-in form SDK${FG.reset}                      ${FG.highlight}│${FG.reset}
${FG.highlight} ╰───────────────────────────────────────────────────────╯${FG.reset}

${FG.muted}usage:${FG.reset}
  ${FG.secondary}formsdk <command>${FG.reset} ${FG.muted}[options]${FG.reset}

${FG.muted}commands:${FG.reset}
  ${FG.accent}init${FG.reset}         ${FG.muted}initialize formsdk in your project${FG.reset}
  ${FG.accent}generate${FG.reset}     ${FG.muted}generate a form (interactive if no args)${FG.reset}
  ${FG.accent}list${FG.reset}         ${FG.muted}list available templates and adapters${FG.reset}

${FG.muted}generate options:${FG.reset}
  ${FG.warning}-f${FG.reset}, ${FG.warning}--framework${FG.reset}  ${FG.muted}<nextjs|svelte|react|astro|solidjs>${FG.reset}
  ${FG.warning}-t${FG.reset}, ${FG.warning}--type${FG.reset}      ${FG.muted}<contact|signup|application|newsletter|survey>${FG.reset}
  ${FG.warning}-u${FG.reset}, ${FG.warning}--ui${FG.reset}        ${FG.muted}<shadcn|chakra|default>${FG.reset}
  ${FG.warning}-o${FG.reset}, ${FG.warning}--orm${FG.reset}        ${FG.muted}<prisma|drizzle|postgres|supabase|neon|turso>${FG.reset}
  ${FG.warning}-c${FG.reset}, ${FG.warning}--captcha${FG.reset}  ${FG.muted}enable turnstile captcha${FG.reset}
  ${FG.warning}-d${FG.reset}, ${FG.warning}--output-dir${FG.reset}  ${FG.muted}<dir>  output directory${FG.reset}

${FG.muted}examples:${FG.reset}
  ${FG.success}formsdk generate contact${FG.reset} ${FG.muted}                    # interactive mode${FG.reset}
  ${FG.success}formsdk generate contact --framework nextjs --ui shadcn --orm prisma${FG.reset}
  ${FG.success}formsdk generate contact --framework svelte --ui shadcn --orm supabase${FG.reset}
  ${FG.success}formsdk generate contact --framework solidjs --orm neon --captcha${FG.reset}

${FG.muted}frameworks supported:${FG.reset}
  ${FG.info}nextjs${FG.reset}   ${FG.muted}next.js app router${FG.reset}
  ${FG.info}svelte${FG.reset}   ${FG.muted}sveltekit${FG.reset}
  ${FG.info}react${FG.reset}    ${FG.muted}react (vite)${FG.reset}
  ${FG.info}astro${FG.reset}    ${FG.muted}astro (islands)${FG.reset}
  ${FG.info}solidjs${FG.reset}  ${FG.muted}solidjs + tanstack start${FG.reset}

${FG.highlight}version:${FG.reset} ${FG.secondary}1.0.0${FG.reset}
`);
    process.exit(0);
  }

  switch (cmd) {
    case "init":
      await initCommand();
      break;

    case "list":
      await listCommand();
      break;

    case "generate": {
      const remainingArgs = args.slice(1);
      const options: Record<string, any> = {};
      const positional: string[] = [];

      for (let i = 0; i < remainingArgs.length; i++) {
        const arg = remainingArgs[i];
        if (arg.startsWith("--")) {
          const key = arg.replace(/^--/, "");
          options[key] =
            remainingArgs[i + 1] && !remainingArgs[i + 1].startsWith("-")
              ? remainingArgs[++i]
              : true;
        } else if (arg.startsWith("-")) {
          const key = arg.replace(/^-/, "");
          options[key] =
            remainingArgs[i + 1] && !remainingArgs[i + 1].startsWith("-")
              ? remainingArgs[++i]
              : true;
        } else {
          positional.push(arg);
        }
      }

      const config =
        positional.length > 0
          ? { name: positional[0], ...options }
          : await runInteractive();

      await generateCommand(config.name, config);
      break;
    }

    default:
      console.error(`\n${FG.error}  error:${FG.reset} unknown command ${FG.warning}${cmd}${FG.reset}\n`);
      console.error(`  run ${FG.accent}formsdk --help${FG.reset} for usage.\n`);
      process.exit(1);
  }
}

main();