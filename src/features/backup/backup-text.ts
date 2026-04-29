import type { CycleProfile, DailyEntry } from "../cycle/types";

const backupMarker = "MOONLY-1";

export type BackupData = {
  profile: CycleProfile;
  entries: Record<string, DailyEntry>;
};

export type ParsedBackupText = {
  createdAt: string;
  data: BackupData;
};

type BackupPayload = {
  version: 1;
  app: "moonly";
  createdAt: string;
  data: BackupData;
};

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isCycleProfile(value: unknown): value is CycleProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Partial<CycleProfile>;
  return (
    typeof profile.lastPeriodStart === "string" &&
    isDateKey(profile.lastPeriodStart) &&
    typeof profile.periodLength === "number" &&
    typeof profile.cycleLength === "number" &&
    typeof profile.isPeriodLengthEstimated === "boolean" &&
    typeof profile.isCycleLengthEstimated === "boolean"
  );
}

function isDailyEntry(value: unknown, date: string): value is DailyEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<DailyEntry>;
  return entry.date === date && isDateKey(entry.date);
}

function normalizeEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("备份文本里的记录格式不正确");
  }

  const entries = value as Record<string, unknown>;
  const normalizedEntries: Record<string, DailyEntry> = {};

  for (const [date, entry] of Object.entries(entries)) {
    if (!isDateKey(date) || !isDailyEntry(entry, date)) {
      throw new Error("备份文本里的记录格式不正确");
    }

    normalizedEntries[date] = entry;
  }

  return normalizedEntries;
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(createdAt));
}

export function createBackupText(data: BackupData, createdAt = new Date().toISOString()) {
  const payload: BackupPayload = {
    version: 1,
    app: "moonly",
    createdAt,
    data
  };
  const recoveryCode = encodeBase64(JSON.stringify(payload));
  const recordCount = Object.keys(data.entries).length;

  return [
    "月信备份",
    `创建时间：${formatCreatedAt(createdAt)}`,
    `包含：周期预测信息、${recordCount} 天记录`,
    "保存方式：复制整段文字，下次在月信中粘贴即可恢复。",
    "",
    "恢复码：",
    backupMarker,
    recoveryCode
  ].join("\n");
}

export function parseBackupText(text: string): ParsedBackupText {
  const markerIndex = text.indexOf(backupMarker);

  if (markerIndex === -1) {
    throw new Error("没有识别到月信备份文本");
  }

  const recoveryCode = text
    .slice(markerIndex + backupMarker.length)
    .trim()
    .split(/\s+/)
    .join("");

  if (!recoveryCode) {
    throw new Error("备份文本不完整");
  }

  let payload: Partial<BackupPayload>;

  try {
    payload = JSON.parse(decodeBase64(recoveryCode)) as Partial<BackupPayload>;
  } catch {
    throw new Error("备份文本无法识别");
  }

  if (payload.app !== "moonly" || payload.version !== 1 || typeof payload.createdAt !== "string") {
    throw new Error("备份文本版本不支持");
  }

  if (!payload.data || !isCycleProfile(payload.data.profile)) {
    throw new Error("备份文本里的预测信息不正确");
  }

  return {
    createdAt: payload.createdAt,
    data: {
      profile: payload.data.profile,
      entries: normalizeEntries(payload.data.entries)
    }
  };
}
