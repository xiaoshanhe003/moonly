const cycleStoreKey = "moonly-store";
const handoffChannelName = "moonly-storage-handoff";

type PersistedCycleState = {
  state?: {
    profile?: unknown;
    entries?: Record<string, unknown>;
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

export function setupInstallStorageHandoff() {
  if (!("BroadcastChannel" in window)) {
    return;
  }

  const channel = new BroadcastChannel(handoffChannelName);
  const senderId = createId();
  const pendingRequestId = isStandaloneDisplay() && !hasUserCycleData(readCycleStore()) ? createId() : null;

  channel.addEventListener("message", (event: MessageEvent<HandoffMessage>) => {
    const message = event.data;

    if (!message || message.senderId === senderId) {
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
      window.location.reload();
    }
  });

  if (pendingRequestId) {
    window.setTimeout(() => {
      channel.postMessage({
        type: "moonly-store-request",
        requestId: pendingRequestId,
        senderId
      } satisfies HandoffMessage);
    }, 200);
  }
}
