import { useCycleStore } from "../cycle/store";
import type { AppScenario, CycleProfile, DailyEntry } from "../cycle/types";

const cycleStoreKey = "moonly-store";
const handoffChannelName = "moonly-storage-handoff";

type PersistedCycleState = {
  state?: {
    profile?: CycleProfile | null;
    entries?: Record<string, DailyEntry>;
    activeScenario?: AppScenario;
    lastUpdatedAt?: number;
  };
  version?: number;
};

type HandoffMessage =
  | {
      type: "moonly-store-request";
      requestId: string;
      senderId: string;
    }
  | {
      type: "moonly-store-response";
      requestId: string;
      senderId: string;
      storeValue: string;
    }
  | {
      type: "moonly-store-sync";
      senderId: string;
      storeValue: string;
    };

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone))
  );
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readCycleStore() {
  try {
    return window.localStorage.getItem(cycleStoreKey);
  } catch {
    return null;
  }
}

function writeCycleStore(value: string) {
  try {
    window.localStorage.setItem(cycleStoreKey, value);
    return true;
  } catch {
    return false;
  }
}

function parseCycleStore(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PersistedCycleState;
  } catch {
    return null;
  }
}

function hasUserCycleData(value: string | null) {
  const persistedState = parseCycleStore(value);
  const profile = persistedState?.state?.profile;
  const entries = persistedState?.state?.entries;

  return Boolean(profile) || Boolean(entries && Object.keys(entries).length > 0);
}

function getPersistedUpdatedAt(value: string | null) {
  const updatedAt = parseCycleStore(value)?.state?.lastUpdatedAt;

  return typeof updatedAt === "number" ? updatedAt : 0;
}

function applyPersistedCycleStore(value: string | null) {
  const persistedState = parseCycleStore(value);
  const nextState = persistedState?.state;

  if (!nextState) {
    return false;
  }

  const currentUpdatedAt = useCycleStore.getState().lastUpdatedAt;
  const nextUpdatedAt = typeof nextState.lastUpdatedAt === "number" ? nextState.lastUpdatedAt : 0;

  if (nextUpdatedAt <= currentUpdatedAt) {
    return false;
  }

  useCycleStore.setState({
    profile: nextState.profile ?? null,
    entries: nextState.entries ?? {},
    activeScenario: nextState.activeScenario ?? "first-run",
    lastUpdatedAt: nextUpdatedAt
  });

  return true;
}

export function setupInstallStorageHandoff() {
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(handoffChannelName) : null;
  const senderId = createId();
  const pendingRequestId = isStandaloneDisplay() && !hasUserCycleData(readCycleStore()) ? createId() : null;
  let isApplyingRemoteStore = false;

  function applyRemoteStore(value: string | null) {
    isApplyingRemoteStore = true;

    try {
      return applyPersistedCycleStore(value);
    } finally {
      window.setTimeout(() => {
        isApplyingRemoteStore = false;
      }, 0);
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== cycleStoreKey) {
      return;
    }

    applyRemoteStore(event.newValue);
  });

  const unsubscribeStore = channel
    ? useCycleStore.subscribe(() => {
        if (isApplyingRemoteStore) {
          return;
        }

        window.setTimeout(() => {
          if (isApplyingRemoteStore) {
            return;
          }

          const storeValue = readCycleStore();

          if (!storeValue) {
            return;
          }

          channel.postMessage({
            type: "moonly-store-sync",
            senderId,
            storeValue
          } satisfies HandoffMessage);
        }, 0);
      })
    : null;

  channel?.addEventListener("message", (event: MessageEvent<HandoffMessage>) => {
    const message = event.data;

    if (!message || message.senderId === senderId) {
      return;
    }

    if (message.type === "moonly-store-sync") {
      if (getPersistedUpdatedAt(message.storeValue) > useCycleStore.getState().lastUpdatedAt) {
        writeCycleStore(message.storeValue);
        applyRemoteStore(message.storeValue);
      }

      return;
    }

    if (message.type === "moonly-store-request") {
      const storeValue = readCycleStore();

      if (!hasUserCycleData(storeValue) || !storeValue) {
        return;
      }

      channel.postMessage({
        type: "moonly-store-response",
        requestId: message.requestId,
        senderId,
        storeValue
      } satisfies HandoffMessage);
      return;
    }

    if (
      message.type === "moonly-store-response" &&
      pendingRequestId &&
      message.requestId === pendingRequestId &&
      !hasUserCycleData(readCycleStore()) &&
      hasUserCycleData(message.storeValue) &&
      writeCycleStore(message.storeValue)
    ) {
      unsubscribeStore?.();
      window.location.reload();
    }
  });

  if (pendingRequestId && channel) {
    window.setTimeout(() => {
      channel.postMessage({
        type: "moonly-store-request",
        requestId: pendingRequestId,
        senderId
      } satisfies HandoffMessage);
    }, 200);
  }
}
