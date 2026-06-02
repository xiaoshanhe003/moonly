import { useSyncExternalStore } from "react";

export type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform?: string;
};

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

let installPrompt: BeforeInstallPromptEvent | null = null;
let isSetupComplete = false;
const listeners = new Set<() => void>();

function emitInstallPromptChange() {
  listeners.forEach((listener) => listener());
}

export function getInstallPromptSnapshot() {
  return installPrompt;
}

export function clearInstallPrompt() {
  if (!installPrompt) {
    return;
  }

  installPrompt = null;
  emitInstallPromptChange();
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function setupInstallPromptCapture() {
  if (isSetupComplete) {
    return;
  }

  isSetupComplete = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    emitInstallPromptChange();
  });

  window.addEventListener("appinstalled", () => {
    clearInstallPrompt();
  });
}

export function useInstallPrompt() {
  return useSyncExternalStore(subscribeInstallPrompt, getInstallPromptSnapshot, () => null);
}
