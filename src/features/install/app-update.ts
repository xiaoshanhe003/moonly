import { useSyncExternalStore } from "react";

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

type AppUpdateSnapshot = {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
};

const listeners = new Set<() => void>();

let updateServiceWorker: UpdateServiceWorker | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
let snapshot: AppUpdateSnapshot = {
  isUpdateAvailable: false,
  isUpdating: false
};

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setSnapshot(nextSnapshot: AppUpdateSnapshot) {
  snapshot = nextSnapshot;
  emitChange();
}

export function configureAppUpdate({
  registration,
  update
}: {
  registration?: ServiceWorkerRegistration;
  update?: UpdateServiceWorker;
}) {
  serviceWorkerRegistration = registration ?? serviceWorkerRegistration;
  updateServiceWorker = update ?? updateServiceWorker;
}

export function markAppUpdateAvailable() {
  if (snapshot.isUpdateAvailable) {
    return;
  }

  setSnapshot({
    ...snapshot,
    isUpdateAvailable: true
  });
}

export async function checkForAppUpdate() {
  await serviceWorkerRegistration?.update();
}

export async function installAppUpdate() {
  if (!updateServiceWorker || snapshot.isUpdating) {
    return;
  }

  setSnapshot({
    ...snapshot,
    isUpdating: true
  });

  try {
    await updateServiceWorker(true);
  } catch (error) {
    setSnapshot({
      ...snapshot,
      isUpdating: false
    });
    throw error;
  }
}

export function useAppUpdateStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    () => snapshot,
    () => snapshot
  );
}
