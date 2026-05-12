import { useEffect, useState } from "react";
import { Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";
import { cn } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";
import { installAppUpdate, useAppUpdateStatus } from "../../features/install/app-update";
import shareButtonImage from "../../assets/install/share-button.png";
import addToHomeScreenImage from "../../assets/install/add-to-home-screen.png";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<BeforeInstallPromptChoice>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

type CopyBubble = {
  id: number;
  isLeaving: boolean;
};

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone))
  );
}

type InstallAppButtonProps = {
  isCompact?: boolean;
  placement?: "floating" | "header";
};

const headerButtonClassName =
  "h-10 shrink-0 gap-1.5 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] px-3 text-sm font-medium text-[color:var(--foreground)] shadow-[var(--shadow-card)] backdrop-blur-xl hover:bg-white";

export function InstallAppButton({ isCompact = false, placement = "floating" }: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [copyBubble, setCopyBubble] = useState<CopyBubble | null>(null);
  const { isUpdateAvailable, isUpdating } = useAppUpdateStatus();
  const pageUrl = window.location.href;

  useEffect(() => {
    const handleDisplayModeChange = () => setIsInstalled(isStandaloneDisplay());
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");

    standaloneQuery.addEventListener("change", handleDisplayModeChange);
    fullscreenQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
      fullscreenQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      setIsHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!copyBubble) {
      return;
    }

    if (copyBubble.isLeaving) {
      const removeTimeoutId = window.setTimeout(() => {
        setCopyBubble((current) => (current?.id === copyBubble.id ? null : current));
      }, 200);

      return () => window.clearTimeout(removeTimeoutId);
    }

    const leaveTimeoutId = window.setTimeout(() => {
      setCopyBubble((current) => (current?.id === copyBubble.id ? { ...current, isLeaving: true } : current));
    }, 1500);

    return () => window.clearTimeout(leaveTimeoutId);
  }, [copyBubble]);

  const copyPageUrl = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = pageUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopyBubble({
      id: Date.now(),
      isLeaving: false
    });
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      setIsHelpOpen(true);
      return;
    }

    const result = await installPrompt.prompt();
    setInstallPrompt(null);

    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
  };

  const handleUpdateClick = () => {
    void installAppUpdate().catch(() => undefined);
  };

  if (isUpdateAvailable) {
    if (placement === "header") {
      return (
        <Button
          className={headerButtonClassName}
          variant="ghost"
          onClick={handleUpdateClick}
          disabled={isUpdating}
          aria-label="更新到最新版本"
        >
          <RefreshCw className={cn("size-4", isUpdating && "motion-safe:animate-spin")} aria-hidden="true" />
          <span className="max-[360px]:hidden">{isUpdating ? "更新中" : "更新到最新版本"}</span>
        </Button>
      );
    }

    return (
      <Button
        className={cn(
          "fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] z-50 h-11 gap-2 overflow-hidden border border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] text-[color:var(--foreground)] shadow-[var(--shadow-elevated)] backdrop-blur-xl transition-[right,width,padding,border-radius] duration-200 ease-out hover:bg-white",
          isCompact
            ? "right-0 w-11 rounded-l-full rounded-r-none border-r-0 px-3 sm:right-4 sm:w-auto sm:rounded-full sm:border-r sm:px-4"
            : "right-4 w-auto rounded-full px-4"
        )}
        variant="ghost"
        onClick={handleUpdateClick}
        disabled={isUpdating}
        aria-label="更新到最新版本"
      >
        <RefreshCw className={cn("size-4", isUpdating && "motion-safe:animate-spin")} aria-hidden="true" />
        <span className={isCompact ? "sr-only sm:not-sr-only" : ""}>
          {isUpdating ? "更新中" : "更新到最新版本"}
        </span>
      </Button>
    );
  }

  if (isInstalled) {
    return null;
  }

  if (placement === "header") {
    return (
      <>
        <Button
          className={headerButtonClassName}
          variant="ghost"
          onClick={handleInstallClick}
          aria-label="添加到主屏幕"
        >
          <Download className="size-4" aria-hidden="true" />
          <span className="max-[360px]:hidden">安装</span>
        </Button>

        {isHelpOpen ? (
          <InstallHelpSheet
            copyBubble={copyBubble}
            pageUrl={pageUrl}
            copyPageUrl={copyPageUrl}
            onClose={() => setIsHelpOpen(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <Button
        className={cn(
          "fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] z-50 h-11 gap-2 overflow-hidden border border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] text-[color:var(--foreground)] shadow-[var(--shadow-elevated)] backdrop-blur-xl transition-[right,width,padding,border-radius] duration-200 ease-out hover:bg-white",
          isCompact
            ? "right-0 w-11 rounded-l-full rounded-r-none border-r-0 px-3 sm:right-4 sm:w-auto sm:rounded-full sm:border-r sm:px-4"
            : "right-4 w-auto rounded-full px-4"
        )}
        variant="ghost"
        onClick={handleInstallClick}
        aria-label="添加到主屏幕"
      >
        <Download className="size-4" aria-hidden="true" />
        <span className={isCompact ? "sr-only sm:not-sr-only" : ""}>添加到主屏幕</span>
      </Button>

      {isHelpOpen ? (
        <InstallHelpSheet
          copyBubble={copyBubble}
          pageUrl={pageUrl}
          copyPageUrl={copyPageUrl}
          onClose={() => setIsHelpOpen(false)}
        />
      ) : null}
    </>
  );
}

function InstallHelpSheet({
  copyBubble,
  pageUrl,
  copyPageUrl,
  onClose
}: {
  copyBubble: CopyBubble | null;
  pageUrl: string;
  copyPageUrl: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      header={
        <p className={cn("min-w-0 whitespace-nowrap pr-3 font-semibold leading-snug", uiTextStyles.xl)}>
          如何将月信安装到手机主屏幕
        </p>
      }
      bodyClassName="sm:max-w-md"
      onClose={onClose}
    >
      <ol className="space-y-6">
        <li className="grid grid-cols-[2.25rem_1fr] gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--muted)] text-base font-semibold text-[color:var(--foreground)]">
            1
          </span>
          <div className="min-w-0 space-y-2">
            <p className={cn("pt-1 leading-relaxed", uiTextStyles.md)}>
              用浏览器打开本网页，推荐 Safari 和 Chrome
            </p>
            <div className="relative">
              {copyBubble ? (
                <div
                  key={copyBubble.id}
                  className={cn(
                    "absolute left-1/2 top-0 z-10 whitespace-nowrap rounded-[0.65rem] border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-2.5 py-1.5 text-sm font-medium leading-none text-[color:var(--foreground)] shadow-[var(--shadow-card)]",
                    copyBubble.isLeaving
                      ? "[animation:phase-bubble-fade_200ms_ease-in_forwards]"
                      : "[animation:phase-bubble-float_160ms_ease-out_forwards]"
                  )}
                  role="status"
                >
                  已复制
                  <span
                    className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[color:var(--border)] bg-[color:var(--card-elevated)]"
                    aria-hidden="true"
                  />
                </div>
              ) : null}
              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-[8px] border border-[color:var(--border)] bg-white px-3 text-left transition-colors hover:bg-[color:var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                onClick={copyPageUrl}
                aria-label="复制当前网页地址"
              >
                <span className={cn("min-w-0 flex-1 truncate", uiTextStyles.sm, uiTextStyles.muted)}>
                  {pageUrl}
                </span>
                <Copy className="size-4 shrink-0 text-[color:var(--muted-foreground)]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </li>
        <li className="grid grid-cols-[2.25rem_1fr] gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--muted)] text-base font-semibold text-[color:var(--foreground)]">
            2
          </span>
          <div className="min-w-0 space-y-3">
            <p className={cn("pt-1 leading-relaxed", uiTextStyles.md)}>
              点击浏览器上方/下方工具栏中的分享按钮
            </p>
            <img
              src={shareButtonImage}
              alt="浏览器分享按钮位置示意"
              className="h-32 w-full rounded-[8px] object-cover sm:h-32"
            />
          </div>
        </li>
        <li className="grid grid-cols-[2.25rem_1fr] gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--muted)] text-base font-semibold text-[color:var(--foreground)]">
            3
          </span>
          <div className="min-w-0 space-y-3">
            <p className={cn("pt-1 leading-relaxed", uiTextStyles.md)}>
              在打开的弹窗中选择“添加到主屏幕”
            </p>
            <img
              src={addToHomeScreenImage}
              alt="添加到主屏幕菜单项示意"
              className="h-32 w-full rounded-[8px] object-cover sm:h-32"
            />
          </div>
        </li>
      </ol>
    </Sheet>
  );
}
