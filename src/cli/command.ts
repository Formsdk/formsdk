interface CommandOption {
  name: string;
  description: string;
  default?: any;
}

class CommandBuilder {
  private cmd: {
    name: string;
    description: string;
    options: CommandOption[];
    action: Function | null;
  };

  constructor(name: string, description: string) {
    this.cmd = {
      name,
      description,
      options: [],
      action: null,
    };
  }

  option(name: string, desc: string, defaultVal?: any): CommandBuilder {
    this.cmd.options.push({ name, description: desc, default: defaultVal });
    return this;
  }

  action(fn: Function): typeof this.cmd {
    this.cmd.action = fn;
    return this.cmd;
  }

  getCommand() {
    return this.cmd;
  }
}

export class Command {
  private cmdName: string = "";
  private cmdDescription: string = "";
  private cmdVersion?: string;
  private commands: Map<string, ReturnType<typeof CommandBuilder.prototype.getCommand>> = new Map();

  name(n: string): this {
    this.cmdName = n;
    return this;
  }

  description(desc: string): this {
    this.cmdDescription = desc;
    return this;
  }

  version(ver: string): this {
    this.cmdVersion = ver;
    return this;
  }

  command(name: string, description: string): CommandBuilder {
    const builder = new CommandBuilder(name, description);
    const baseName = name.split(" ")[0];
    this.commands.set(baseName, builder.getCommand() as any);
    return builder;
  }

  parse(): void {
    const args = process.argv.slice(2);

    if (args.includes("--version") || args.includes("-v")) {
      console.log(this.cmdVersion || "1.0.0");
      return;
    }

    if (args.includes("--help") || args.includes("-h")) {
      this.printHelp();
      return;
    }

    const [commandName, ...rest] = args;
    const baseCommandName = commandName.split(" ")[0];
    const command = this.commands.get(baseCommandName);

    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      this.printHelp();
      process.exit(1);
    }

    const parsedArgs: string[] = [];
    const options: Record<string, any> = {};

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg.startsWith("--")) {
        const key = arg.replace(/^--/, "");
        if (i + 1 < rest.length && !rest[i + 1].startsWith("-")) {
          options[key] = rest[i + 1];
          i++;
        }
      } else if (arg.startsWith("-")) {
        const key = arg.replace(/^-/, "");
        if (i + 1 < rest.length && !rest[i + 1].startsWith("-")) {
          options[key] = rest[i + 1];
          i++;
        }
      } else {
        parsedArgs.push(arg);
      }
    }

    if (command.action) {
      command.action(...parsedArgs, options);
    }
  }

  private printHelp(): void {
    console.log(`
${this.cmdName} - ${this.cmdDescription}
Version: ${this.cmdVersion || "1.0.0"}

Usage:
  ${this.cmdName} <command> [options]

Commands:
${Array.from(this.commands.entries())
  .map(([name, cmd]) => `  ${name.padEnd(15)} ${cmd.description}`)
  .join("\n")}
`);
  }
}