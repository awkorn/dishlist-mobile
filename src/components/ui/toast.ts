export type ToastVariant = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

export interface ToastMessage extends Omit<ToastOptions, "duration"> {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

type ToastListener = (message: ToastMessage) => void;

const listeners = new Set<ToastListener>();
let nextToastId = 1;

function show(
  variant: ToastVariant,
  message: string,
  options: ToastOptions = {},
): void {
  const toastMessage: ToastMessage = {
    id: nextToastId++,
    variant,
    message,
    duration: options.duration ?? 2600,
    action: options.action,
  };

  listeners.forEach((listener) => listener(toastMessage));
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    show("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    show("error", message, options),
  info: (message: string, options?: ToastOptions) =>
    show("info", message, options),
};

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
