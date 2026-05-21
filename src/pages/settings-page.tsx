import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardPenLine,
  Database,
  ExternalLink,
  Info,
  RefreshCw,
  RotateCcw,
  Upload
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Sheet } from "../components/ui/sheet";
import { uiLayoutStyles, uiTextStyles } from "../components/ui/styles";
import { cn } from "../lib/utils";
import { createBackupText, parseBackupText } from "../features/backup/backup-text";
import { useCycleStore } from "../features/cycle/store";
import { appVersion, recentUpdates } from "../features/app-info/app-info";
import { installAppUpdate, useAppUpdateStatus } from "../features/install/app-update";

const appIcon = "/icon.svg";

type SettingsView = "home" | "backup" | "import" | "about";
type ConflictMode = "skip" | "overwrite";
type FeedbackStep = "type" | "content";
type FeedbackSubmitStatus = "idle" | "submitting" | "success" | "error" | "unconfigured";

const feedbackEndpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT?.trim() ?? "";
const feedbackFormUrl = import.meta.env.VITE_FEEDBACK_FORM_URL?.trim() ?? "";
const feedbackTypes = [
  { value: "bug", label: "遇到问题" },
  { value: "idea", label: "功能建议" },
  { value: "content", label: "内容反馈" },
  { value: "other", label: "其他反馈类型" }
];

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
  metaClassName,
  onClick
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  meta?: string;
  metaClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex h-16 w-full items-center gap-3 rounded-[10px] px-1 text-left transition-colors hover:bg-[color:var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
      onClick={onClick}
    >
      <span className="flex size-8 shrink-0 items-center justify-center text-[color:var(--foreground)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block font-normal leading-none", uiTextStyles.md)}>{title}</span>
        {description ? (
          <span className={cn("mt-1 block leading-snug", uiTextStyles.sm, uiTextStyles.muted)}>{description}</span>
        ) : null}
      </span>
      {meta ? <span className={cn("shrink-0", uiTextStyles.sm, uiTextStyles.muted, metaClassName)}>{meta}</span> : null}
      <ChevronRight className="size-5 shrink-0 text-[color:var(--muted-foreground)]" aria-hidden="true" />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCycleStore((state) => state.profile);
  const entries = useCycleStore((state) => state.entries);
  const importEntries = useCycleStore((state) => state.importEntries);
  const [view, setView] = useState<SettingsView>("home");
  const [isRestartSheetOpen, setIsRestartSheetOpen] = useState(false);
  const [isFeedbackSheetOpen, setIsFeedbackSheetOpen] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>("type");
  const [feedbackType, setFeedbackType] = useState(feedbackTypes[0].value);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackSubmitStatus>("idle");
  const [backupCopied, setBackupCopied] = useState(false);
  const [backupInput, setBackupInput] = useState("");
  const { isUpdateAvailable, isUpdating } = useAppUpdateStatus();
  const recordCountForRestart = Object.keys(entries).length;

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
  const selectedFeedbackType = feedbackTypes.find((type) => type.value === feedbackType) ?? feedbackTypes[0];

  const headerTitle = {
    home: "设置",
    backup: "数据备份",
    import: "导入数据",
    about: "关于月信"
  }[view];

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);

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

  const handleRestart = () => {
    if (!profile) {
      return;
    }

    navigate("/onboarding", {
      state: {
        mode: "restart",
        profile
      }
    });
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

  const handleUpdateApp = () => {
    void installAppUpdate().catch(() => undefined);
  };

  const openFeedbackSheet = () => {
    if (feedbackFormUrl) {
      openFeedbackForm();
      return;
    }

    setFeedbackStatus("idle");
    setFeedbackStep("type");
    setIsFeedbackSheetOpen(true);
  };

  const openFeedbackForm = () => {
    if (!feedbackFormUrl) {
      return;
    }

    const openedWindow = window.open(feedbackFormUrl, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      window.location.assign(feedbackFormUrl);
    }
  };

  const handleSubmitFeedback = async () => {
    const message = feedbackMessage.trim();

    if (!message) {
      return;
    }

    if (!feedbackEndpoint) {
      setFeedbackStatus(feedbackFormUrl ? "unconfigured" : "error");
      if (feedbackFormUrl) {
        openFeedbackForm();
      }
      return;
    }

    setFeedbackStatus("submitting");

    try {
      const response = await fetch(feedbackEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: feedbackType,
          message,
          contact: feedbackContact.trim(),
          appVersion,
          pagePath: window.location.pathname,
          userAgent: navigator.userAgent,
          submittedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("feedback submit failed");
      }

      setFeedbackStatus("success");
      setFeedbackMessage("");
      setFeedbackContact("");
    } catch {
      setFeedbackStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className={cn("sticky top-0 z-40 w-full bg-[color:var(--color-canvas)]/85 backdrop-blur", uiLayoutStyles.pageHeaderSafeArea)}>
        <header className="mx-auto flex h-[72px] w-full max-w-md items-center px-4 sm:px-6">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="返回">
            <ArrowLeft className="size-5 text-[var(--color-ink)]" />
          </Button>
        </header>
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-2 sm:px-6">
        <h1 className={cn("mb-8 px-1 font-semibold leading-none text-[color:var(--foreground)]", uiTextStyles.xxl)}>
          {headerTitle}
        </h1>

        {view === "home" ? (
          <div className="space-y-1">
            <SettingsRow
              icon={<Database className="size-5" aria-hidden="true" />}
              title="数据备份"
              onClick={() => setView("backup")}
            />
            <SettingsRow
              icon={<Upload className="size-5" aria-hidden="true" />}
              title="导入数据"
              onClick={() => setView("import")}
            />
            <SettingsRow
              icon={<RotateCcw className="size-5" aria-hidden="true" />}
              title="重新开始"
              onClick={() => setIsRestartSheetOpen(true)}
            />
            <div className="my-4 h-px bg-[color:var(--border)]" aria-hidden="true" />
            <SettingsRow
              icon={<BookOpen className="size-5" aria-hidden="true" />}
              title="了解周期"
              onClick={() => navigate("/phase-science")}
            />
            <div className="my-4 h-px bg-[color:var(--border)]" aria-hidden="true" />
            <SettingsRow
              icon={<ClipboardPenLine className="size-5" aria-hidden="true" />}
              title="我要反馈"
              onClick={openFeedbackSheet}
            />
            <SettingsRow
              icon={<Info className="size-5" aria-hidden="true" />}
              title="关于月信"
              meta={isUpdateAvailable ? "有新版本可用" : `v${appVersion}`}
              metaClassName={isUpdateAvailable ? "font-medium text-[color:var(--brand-blue)]" : undefined}
              onClick={() => setView("about")}
            />
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
          </div>
        ) : null}

        {view === "import" ? (
          <div className="space-y-5">
            <p className={cn("rounded-[var(--radius-md)] bg-[color:var(--muted)] p-4 leading-relaxed", uiTextStyles.sm)}>
              粘贴从月信复制出的完整备份文本。导入后会合并到当前设备的本地记录中。
            </p>
            <div className="space-y-3">
              <label className={cn("block font-medium", uiTextStyles.md)} htmlFor="backup-text">
                导入备份文本
              </label>
              <textarea
                id="backup-text"
                className={cn(uiLayoutStyles.input, "min-h-48 resize-none leading-relaxed")}
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
            <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[color:var(--muted)] p-4">
              <div className="flex min-w-0 items-center gap-4">
                <img src={appIcon} alt="" className="size-12 shrink-0 rounded-[12px]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className={cn("font-semibold", uiTextStyles.lg)}>月信</p>
                  <p className={cn("mt-1", uiTextStyles.sm, uiTextStyles.muted)}>版本 {appVersion}</p>
                </div>
              </div>
              {isUpdateAvailable ? (
                <Button
                  className="h-10 shrink-0 gap-1.5 rounded-full bg-[color:var(--foreground)] px-3 text-sm font-medium text-[color:var(--background)]"
                  onClick={handleUpdateApp}
                  disabled={isUpdating}
                >
                  <RefreshCw className={cn("size-4", isUpdating && "motion-safe:animate-spin")} aria-hidden="true" />
                  <span>{isUpdating ? "更新中" : "更新"}</span>
                </Button>
              ) : null}
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

      {isRestartSheetOpen ? (
        <Sheet
          header={<p className={cn("font-semibold leading-snug", uiTextStyles.xl)}>要重新开始吗？</p>}
          bodyClassName="sm:max-w-md"
          onClose={() => setIsRestartSheetOpen(false)}
          footer={
            <Button className={uiLayoutStyles.sheetPrimaryActionButton} onClick={handleRestart}>
              清空并重填
            </Button>
          }
        >
          <p className={cn("leading-relaxed", uiTextStyles.md)}>
            重新开始将清空当前的每日记录（共 {recordCountForRestart} 天）且无法找回。
          </p>
        </Sheet>
      ) : null}

      {isFeedbackSheetOpen ? (
        <Sheet
          header={
            <p className={cn("font-semibold leading-snug", uiTextStyles.xl)}>
              {feedbackStep === "type" && feedbackStatus !== "success" ? "想反馈哪一类内容？" : selectedFeedbackType.label}
            </p>
          }
          bodyClassName="sm:max-w-md"
          onClose={() => setIsFeedbackSheetOpen(false)}
          footer={
            <div className="grid gap-3">
              {feedbackStatus === "success" ? (
                <Button className={uiLayoutStyles.sheetPrimaryActionButton} onClick={() => setIsFeedbackSheetOpen(false)}>
                  完成
                </Button>
              ) : null}
              {feedbackStatus !== "success" && feedbackStep === "type" ? (
                <Button className={uiLayoutStyles.sheetPrimaryActionButton} onClick={() => setFeedbackStep("content")}>
                  下一步
                </Button>
              ) : null}
              {feedbackStatus !== "success" && feedbackStep === "content" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    className={uiLayoutStyles.sheetSecondaryActionButton}
                    onClick={() => {
                      setFeedbackStatus("idle");
                      setFeedbackStep("type");
                    }}
                  >
                    上一步
                  </Button>
                  <Button
                    className={uiLayoutStyles.sheetPrimaryActionButton}
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackMessage.trim() || feedbackStatus === "submitting"}
                  >
                    {feedbackStatus === "submitting" ? (
                      <>
                        <RefreshCw className="mr-2 size-4 motion-safe:animate-spin" aria-hidden="true" />
                        发送中
                      </>
                    ) : (
                      "发送"
                    )}
                  </Button>
                </div>
              ) : null}
              {feedbackStatus !== "success" && feedbackFormUrl ? (
                <Button
                  variant="secondary"
                  className={uiLayoutStyles.sheetSecondaryActionButton}
                  onClick={openFeedbackForm}
                >
                  <ExternalLink className="mr-2 size-4" aria-hidden="true" />
                  打开反馈表
                </Button>
              ) : null}
            </div>
          }
        >
          {feedbackStatus === "success" ? (
            <p className="rounded-[var(--radius-md)] bg-[color:var(--muted)] p-4 text-sm leading-relaxed text-[color:var(--foreground)]">
              已收到，谢谢你的反馈。
            </p>
          ) : null}

          {feedbackStatus !== "success" && feedbackStep === "type" ? (
            <div className="space-y-3">
              <div className="grid gap-3">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={cn(
                      "flex h-12 items-center justify-between rounded-[var(--radius-md)] border px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
                      feedbackType === type.value
                        ? "border-[color:var(--foreground)] bg-[color:var(--muted)] text-[color:var(--foreground)]"
                        : "border-[color:var(--input)] bg-[color:var(--muted)] text-[color:var(--foreground)]"
                    )}
                    onClick={() => {
                      setFeedbackType(type.value);
                      setFeedbackStatus("idle");
                    }}
                  >
                    <span>{type.label}</span>
                    {feedbackType === type.value ? <Check className="size-4" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {feedbackStatus !== "success" && feedbackStep === "content" ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className={cn("block font-medium", uiTextStyles.md)} htmlFor="feedback-message">
                反馈内容
              </label>
              <textarea
                id="feedback-message"
                className={cn(uiLayoutStyles.input, "min-h-36 resize-none leading-relaxed")}
                value={feedbackMessage}
                placeholder="写下你遇到的问题或想要的改进"
                maxLength={1200}
                onChange={(event) => {
                  setFeedbackMessage(event.target.value);
                  setFeedbackStatus("idle");
                }}
              />
            </div>

            <div className="space-y-3">
              <label className={cn("block font-medium", uiTextStyles.md)} htmlFor="feedback-contact">
                联系方式
              </label>
              <input
                id="feedback-contact"
                className={cn(uiLayoutStyles.input, "h-12")}
                value={feedbackContact}
                placeholder="愿意的话，欢迎留下联系方式"
                maxLength={120}
                onChange={(event) => {
                  setFeedbackContact(event.target.value);
                  setFeedbackStatus("idle");
                }}
              />
            </div>

            {feedbackStatus === "unconfigured" ? (
              <p className="rounded-[var(--radius-md)] bg-[color:var(--muted)] p-4 text-sm leading-relaxed text-[color:var(--foreground)]">
                当前使用外部反馈表收集，已为你打开反馈表。
              </p>
            ) : null}
            {feedbackStatus === "error" ? (
              <p className="rounded-[var(--radius-md)] bg-red-50 p-4 text-sm leading-relaxed text-red-700">
                {feedbackFormUrl ? "暂时无法发送。你可以稍后再试，或通过反馈表提交。" : "暂时无法发送。请稍后再试。"}
              </p>
            ) : null}
          </div>
          ) : null}
        </Sheet>
      ) : null}

    </main>
  );
}
