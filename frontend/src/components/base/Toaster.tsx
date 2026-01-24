/* eslint-disable react-refresh/only-export-components */

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FiAlertOctagon, FiX } from "react-icons/fi";

// types
interface Toast {
  id: number;
  message: string;
  duration: number;
  icon?: React.ReactNode;
}
interface ToastStore {
  toasts: Toast[];
  subscribers: Set<() => void>;
  get: () => Toast[];
  subscribe: (callback: () => void) => () => void;
  toast: (message: string, icon?: React.ReactNode, duration?: number) => number;
  makeToast: (toast: Toast) => void;
  dropToast: (index: number) => void;
}

// custom store implementation
const toastStore: ToastStore = {
  toasts: [],
  subscribers: new Set(),
  get() {
    return toastStore.toasts;
  },
  subscribe(callback) {
    toastStore.subscribers.add(callback);
    return () => toastStore.subscribers.delete(callback);
  },
  toast(message, icon, duration) {
    const id = Date.now();
    toastStore.makeToast({ id, message, icon, duration: duration || 5000 });
    return id;
  },
  makeToast(toast) {
    setTimeout(
      () => toastStore.dropToast(toast.id),
      toast.duration - (Date.now() - toast.id)
    );
    toastStore.toasts = [...toastStore.toasts, toast];
    toastStore.subscribers.forEach((callback) => callback());
  },
  dropToast(id: number) {
    toastStore.toasts = toastStore.toasts.filter((toast) => toast.id !== id);
    toastStore.subscribers.forEach((callback) => callback());
  },
};

/**
 * Toaster-hook that exports
 * @prop "toast" callback to generate new Toast
 * @prop "makeToast" callback to insert existing Toast
 * @prop "dropToast" callback to drop specific Toast
 */
export function useToaster() {
  return {
    toast: toastStore.toast,
    makeToast: toastStore.makeToast,
    dropToast: toastStore.dropToast,
  };
}

/**
 * Toast-hook that returns currently existing Toasts.
 */
export function useToasts() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.get);
  return toasts;
}

// toaster-component
export default function Toaster() {
  const toasts = useToasts();

  return createPortal(
    <div className="fixed z-50 w-full sm:w-8/12 md:w-1/2 lg:w-1/3 right-2 bottom-2">
      <div className="flex flex-col space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex flex-row space-x-4 items-center p-4 bg-gray-900 border-2 border-gray-800 text-gray-200 rounded-lg shadow-lg"
          >
            <div className="flex max-w-8 h-8 overflow-clip items-center justify-center">
              {toast.icon ?? <FiAlertOctagon size={20} />}
            </div>
            <div className="grow">
              <span>{toast.message}</span>
            </div>
            <div
              className="text-gray-500 hover:text-gray-800 p-2 rounded-md border border-transparent hover:border-gray-200 active:bg-gray-300 hover:bg-gray-300 transition hover:cursor-pointer"
              onClick={() => toastStore.dropToast(toast.id)}
            >
              <FiX size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.getElementById("toaster") ?? document.body
  );
}
