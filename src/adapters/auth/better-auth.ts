export interface BetterAuthAdapterOptions {
  database: {
    provider: "prisma" | "drizzle" | "postgres" | "sqlite" | "mysql" | "mongo" | "mssql";
    connection: any;
  };
  emailAndPassword?: {
    enabled?: boolean;
    autoSignIn?: boolean;
    minPasswordLength?: number;
    maxPasswordLength?: number;
    requireEmailVerification?: boolean;
    disableSignUp?: boolean;
  };
  socialProviders?: Record<string, any>;
  plugins?: any[];
}

export async function createBetterAuthAdapter(options: BetterAuthAdapterOptions): Promise<any> {
  const { betterAuth } = await import("better-auth");
  return betterAuth({
    database: options.database,
    emailAndPassword: options.emailAndPassword?.enabled !== false
      ? {
          enabled: true,
          autoSignIn: options.emailAndPassword?.autoSignIn ?? false,
          minPasswordLength: options.emailAndPassword?.minPasswordLength ?? 8,
          maxPasswordLength: options.emailAndPassword?.maxPasswordLength ?? 128,
          requireEmailVerification: options.emailAndPassword?.requireEmailVerification ?? false,
          disableSignUp: options.emailAndPassword?.disableSignUp ?? false,
        }
      : undefined,
    ...(options.socialProviders && { socialProviders: options.socialProviders }),
    ...(options.plugins?.length && { plugins: options.plugins }),
  });
}

export const authClient = {
  signIn: {
    email: async (
      params: {
        email: string;
        password: string;
        callbackURL?: string;
        rememberMe?: boolean;
      },
      handlers?: {
        onSuccess?: (ctx: any) => void;
        onError?: (ctx: any) => void;
        onRequest?: (ctx: any) => void;
      }
    ) => {
      try {
        const result = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        }).then((r) => r.json() as Promise<any>);

        if (result.error && handlers?.onError) {
          handlers.onError({ error: result.error });
        } else if (handlers?.onSuccess) {
          handlers.onSuccess({ data: result });
        }

        return result;
      } catch (error) {
        if (handlers?.onError) {
          handlers.onError({ error });
        }
        return { error };
      }
    },
    signUp: async (
      params: {
        email: string;
        password: string;
        name?: string;
        callbackURL?: string;
      },
      handlers?: {
        onSuccess?: (ctx: any) => void;
        onError?: (ctx: any) => void;
        onRequest?: (ctx: any) => void;
      }
    ) => {
      try {
        const result = await fetch("/api/auth/sign-up/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        }).then((r) => r.json() as Promise<any>);

        if (result.error && handlers?.onError) {
          handlers.onError({ error: result.error });
        } else if (handlers?.onSuccess) {
          handlers.onSuccess({ data: result });
        }

        return result;
      } catch (error) {
        if (handlers?.onError) {
          handlers.onError({ error });
        }
        return { error };
      }
    },
    signOut: async (handlers?: {
      onSuccess?: () => void;
      onError?: (ctx: any) => void;
    }) => {
      try {
        const result = await fetch("/api/auth/sign-out", {
          method: "POST",
        }).then((r) => r.json() as Promise<any>);

        if (result.error && handlers?.onError) {
          handlers.onError({ error: result.error });
        } else if (handlers?.onSuccess) {
          handlers.onSuccess();
        }

        return result;
      } catch (error) {
        if (handlers?.onError) {
          handlers.onError({ error });
        }
        return { error };
      }
    },
  },
  useSession: async () => {
    return fetch("/api/auth/session").then((r) => r.json());
  },
};