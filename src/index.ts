import type { FormResult, FieldError } from "./types";
import { handleRequest, createForm, setEnv, clearEnv, getEnv } from "./core";
import type { EnvConfig } from "./core";
import type { FormConfig, FormContext } from "./types";

export type { FormResult, FieldError };

export { handleRequest, createForm, setEnv, clearEnv, getEnv };
export type { EnvConfig, FormConfig, FormContext };