import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, ChevronRight, Database, Info, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/button";
import { uiLayoutStyles, uiTextStyles } from "../components/ui/styles";
import { cn } from "../lib/utils";
import { createBackupText, parseBackupText } from "../features/backup/backup-text";
import { useCycleStore } from "../features/cycle/store";
import { appVersion, recentUpdates } from "../features/app-info/app-info";
import appIcon from "../../public/icon.svg";

type SettingsView = "home" | "calibration" | "backup" | "about";
type ConflictMode = "skip" | "overwrite";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function SettingsRow({
  icon,
  title,
  description,
  meta,
  onClick
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-white px-4 py-3 text-left transition-colors hover:bg-[color:var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
      onClick={onClick}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--muted)] text-[color:var(--foreground)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block font-semibold leading-snug", uiTextStyles.md)}>{title}</span>
        {description ? (
          <span className={cn("mt-1 block leading-snug", uiTextStyles.sm, uiTextStyles.muted)}>{description}</span>
        ) : null}
      </span>
      {meta ? <span className={cn("shrink-0", uiTextStyles.sm, uiTextStyles.muted)}>{meta}</span> : null}
      <ChevronRight className="size-4 shrink-0 text-[color:var(--muted-foreground)]" aria-hidden="true" />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const updateProfile = useCycleStore((state) => state.updateProfile);
  const importEntries = useCycleStore((state) => state.importEntries);
  const todayKey = formatDateKey(new Date());
  const [view, setView] = useState<SettingsView>("home");
  const [calibrationDate, setCalibrationDate] = useState(profile?.lastPeriodStart ?? todayKey);
  const [isConfirmingCalibration, setIsConfirmingCalibration] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  const [backupInput, setBackupInput] = useState("");

  useEffect(() => {
    if (!profile) {
      navigate("/today", { replace: true });
    }
  }, [navigate, profile]);

  const parsedBackup = useMemo(() => {
    if (!backupInput.trim()) {
      return { data: null, error: "" };
    }

    try {
      const parsed = parseBackupText(backupInput);
      return { data: parsed, error: "" };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "备份文本无法识别" };
    }
  }, [backupInput]);

  const parsedBackupData = parsedBackup.data;
  const duplicateCount = parsedBackupData
    ? Object.keys(parsedBackupData.data.entries).filter((date) => entries[date]).length
    : 0;
  const recordCount = parsedBackupData ? Object.keys(parsedBackupData.data.entries).length : 0;

  const headerTitle = {
    home: "设置",
    calibration: "校准",
    backup: "数据备份/导入",
    about: "关于月信"
  }[view];

  const goBack = () => {
    if (view !== "home") {
      setView("home");
      return;
    }

    if (location.key === "default") {
      navigate("/today");
      return;
    }

    navigate(-1);
  };

  const handleCopyBackup = async () => {
    if (!profile) {
      return;
    }

    await copyText(createBackupText({ profile, entries }));
    setBackupCopied(true);
  };

  const handleSaveCalibration = () => {
    updateProfile({
      lastPeriodStart: calibrationDate,
      calibratedAt: new Date().toISOString()
    });
    setIsConfirmingCalibration(false);
    setView("home");
  };

  const handleImport = (mode: ConflictMode) => {
    if (!parsedBackupData) {
      return;
    }

    const importedCount =
      mode === "skip"
        ? Object.keys(parsedBackupData.data.entries).filter((date) => !entries[date]).length
        : recordCount;

    importEntries(parsedBackupData.data.profile, parsedBackupData.data.entries, mode);
    navigate("/calendar", {
      state: {
        importNotice: `已导入 ${importedCount} 天记录`
      }
    });
  };

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className="sticky top-0 z-40 w-full bg-[color:var(--color-canvas)]/85 backdrop-blur">
        <header className="mx-auto flex max-w-md items-center gap-3 px-4 py-4 sm:px-6">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="返回">
            <ArrowLeft className="size-5 text-[var(--color-ink)]" />
          </Button>
          <p className={cn("font-semibold leading-snug", uiTextStyles.xl)}>{headerTitle}</p>
        </header>
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-3 sm:px-6">
        {view === "home" ? (
          <div className="space-y-3">
            <SettingsRow
              icon={<RotateCcw className="size-5" aria-hidden="true" />}
              title="校准"
              description="修改最近一次月经开始日"
              onClick={() => setView("calibration")}
            />
            <SettingsRow
              icon={<Database className="size-5" aria-hidden="true" />}
              title="数据备份/导入"
              onClick={() => setView("backup")}
            />
            <SettingsRow
              icon={<BookOpen className="size-5" aria-hidden="true" />}
              title="了解周期"
              onClick={() => navigate("/phase-science")}
            />
            <SettingsRow
              icon={<Info className="size-5" aria-hidden="true" />}
              title="关于月信"
              meta={`v${appVersion}`}
              onClick={() => setView("about")}
            />
          </div>
        ) : null}

        {view === "calibration" ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className={cn("block font-medium", uiTextStyles.md)} htmlFor="calibration-date">
                最近一次月经开始日
              </label>
              <input
                id="calibration-date"
                className={uiLayoutStyles.input}
                type="date"
                value={calibrationDate}
                max={todayKey}
                onChange={(event) => {
                  setCalibrationDate(event.target.value);
                  setIsConfirmingCalibration(false);
                }}
              />
              <p className={cn("leading-relaxed", uiTextStyles.sm, uiTextStyles.muted)}>
                只用于重新判断相位和未来预测，不会修改已有每日记录。
              </p>
            </div>

            {isConfirmingCalibration ? (
              <div className="space-y-4 rounded-[var(--radius-md)] bg-[color:var(--muted)] p-4">
                <p className={cn("leading-relaxed", uiTextStyles.md)}>
                  保存后，月信会从这一天开始重新判断相位和未来预测。已有每日记录不会被修改。
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="h-11 rounded-[10px]" onClick={() => setIsConfirmingCalibration(false)}>
                    取消
                  </Button>
                  <Button className="h-11 rounded-[10px]" onClick={handleSaveCalibration}>
                    保存校准
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="h-11 w-full rounded-[10px]" onClick={() => setIsConfirmingCalibration(true)}>
                保存
              </Button>
            )}
          </div>
        ) : null}

        {view === "backup" ? (
          <div className="space-y-5">
            <p className={cn("rounded-[var(--radius-md)] bg-[color:var(--muted)] p-4 leading-relaxed", uiTextStyles.sm)}>
              数据只保存在当前设备的浏览器中。换设备、重装浏览器或清除浏览器数据前，请先复制备份文本。
            </p>

            <div className="space-y-3">
              <Button className="h-11 w-full rounded-[10px]" onClick={handleCopyBackup}>
                {backupCopied ? (
                  <>
                    <Check className="mr-2 size-4" aria-hidden="true" />
                    已复制
                  </>
                ) : (
                  "复制备份文本"
                )}
              </Button>
              {backupCopied ? (
                <p className={cn("leading-relaxed", uiTextStyles.sm, uiTextStyles.muted)}>
                  已复制备份文本。请粘贴到备忘录、聊天收藏或密码管理器中保存。
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <label className={cn("block font-medium", uiTextStyles.md)} htmlFor="backup-text">
                导入备份文本
              </label>
              <textarea
                id="backup-text"
                className={cn(uiLayoutStyles.input, "min-h-32 resize-none leading-relaxed")}
                value={backupInput}
                placeholder="粘贴整段月信备份文本"
                onChange={(event) => setBackupInput(event.target.value)}
              />
              {parsedBackup.error ? <p className="text-sm text-red-600">{parsedBackup.error}</p> : null}

              {parsedBackupData ? (
                <div className="space-y-4 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-white p-4">
                  <div className="space-y-1">
                    <p className={cn("font-semibold", uiTextStyles.md)}>识别到月信备份文本</p>
                    <p className={cn(uiTextStyles.sm, uiTextStyles.muted)}>创建时间：{formatDisplayDate(parsedBackupData.createdAt)}</p>
                    <p className={cn(uiTextStyles.sm, uiTextStyles.muted)}>包含记录：{recordCount} 天</p>
                  </div>

                  {duplicateCount > 0 ? (
                    <div className="space-y-3">
                      <p className={cn("leading-relaxed", uiTextStyles.md)}>
                        发现{duplicateCount}个日期的记录已存在，你想如何处理这些记录？
                      </p>
                      <div className="grid gap-3">
                        <Button variant="secondary" className="h-11 rounded-[10px]" onClick={() => handleImport("skip")}>
                          跳过重复日期
                        </Button>
                        <Button className="h-11 rounded-[10px]" onClick={() => handleImport("overwrite")}>
                          覆盖全部并导入
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button className="h-11 w-full rounded-[10px]" onClick={() => handleImport("skip")}>
                      确认导入
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {view === "about" ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-[var(--radius-md)] bg-[color:var(--muted)] p-4">
              <img src={appIcon} alt="" className="size-12 rounded-[12px]" aria-hidden="true" />
              <div className="min-w-0">
                <p className={cn("font-semibold", uiTextStyles.lg)}>月信</p>
                <p className={cn("mt-1", uiTextStyles.sm, uiTextStyles.muted)}>版本 {appVersion}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className={cn("font-semibold", uiTextStyles.md)}>最近更新</p>
              <div className="space-y-3">
                {recentUpdates.map((update) => (
                  <div key={`${update.date}-${update.title}`} className="rounded-[var(--radius-md)] border border-[color:var(--border)] bg-white p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={cn("font-semibold", uiTextStyles.md)}>{update.title}</p>
                      <p className={cn("shrink-0", uiTextStyles.xs, uiTextStyles.muted)}>{update.date}</p>
                    </div>
                    <p className={cn("mt-2 leading-relaxed", uiTextStyles.sm, uiTextStyles.muted)}>
                      {update.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
