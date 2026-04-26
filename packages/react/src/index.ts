import { useState, useCallback, useRef, useEffect } from "react";
import { FormStore, createFormStore, type FormConfig, type FormState, type FormStatus } from "@formsdk/core";

export type { FormConfig, FormState, FormStatus };

export interface UseFormOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  action: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  validateOn?: "submit" | "change" | "blur";
  initialValues?: T;
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

export interface RegisterReturn {
  name: string;
  value: unknown;
  onChange: (event: InputEvent | { target: { value: unknown; name: string } }) => void;
  onBlur: () => void;
  checked?: boolean;
}

export interface GetFieldStateReturn {
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface UseFormReturn<T extends Record<string, unknown> = Record<string, unknown>> {
  register: (name: string) => RegisterReturn;
  handleSubmit: (event?: SubmitEvent) => Promise<void>;
  setError: (name: string, message: string) => void;
  clearErrors: (name?: string) => void;
  reset: (values?: Partial<T>) => void;
  formState: FormState;
  values: T;
  getFieldState: (name: string) => GetFieldStateReturn;
}

function isInputEvent(
  eventOrTarget: InputEvent | { target: { value: unknown; name: string } }
): eventOrTarget is InputEvent {
  return "target" in eventOrTarget && "value" in eventOrTarget.target;
}

export function useForm<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const formStoreRef = useRef<FormStore<T> | null>(null);
  const [formState, setFormState] = useState<FormState>({
    status: "idle",
    errors: {},
    touched: new Set(),
    dirty: false,
    isSubmitting: false,
  });
  const [values, setValues] = useState<T>(options.initialValues || ({} as T));

  if (!formStoreRef.current) {
    formStoreRef.current = createFormStore(options as FormConfig<T>);
  }

  const formStore = formStoreRef.current;

  useEffect(() => {
    const unsubscribe = formStore.subscribe(() => {
      setFormState(formStore.getFormState());
      setValues(formStore.getValues() as T);
    });
    return unsubscribe;
  }, [formStore]);

  const register = useCallback(
    (name: string): RegisterReturn => {
      const field = formStore.getField(name);
      return {
        name,
        value: field.value,
        onChange: (eventOrTarget) => {
          const newValue = isInputEvent(eventOrTarget)
            ? (eventOrTarget.target as HTMLInputElement).value
            : eventOrTarget.target.value;
          formStore.setValue(name, newValue);
        },
        onBlur: () => {
          formStore.getField(name).setTouched(true);
        },
        error: field.error,
        touched: field.touched,
        dirty: field.dirty,
      };
    },
    [formStore]
  );

  const handleSubmit = useCallback(
    async (event?: SubmitEvent) => {
      if (event) {
        event.preventDefault();
      }
      await formStore.submit();
    },
    [formStore]
  );

  const setError = useCallback(
    (name: string, message: string) => {
      formStore.setError(name, message);
    },
    [formStore]
  );

  const clearErrors = useCallback(
    (name?: string) => {
      formStore.clearErrors(name);
    },
    [formStore]
  );

  const reset = useCallback(
    (values?: Partial<T>) => {
      formStore.reset(values);
    },
    [formStore]
  );

  const getFieldState = useCallback(
    (name: string): GetFieldStateReturn => {
      return formStore.getFieldState(name);
    },
    [formStore]
  );

  return {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState,
    values,
    getFieldState,
  };
}
