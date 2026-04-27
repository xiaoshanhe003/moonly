import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";
import { cn } from "../../lib/utils";
import { uiTextStyles } from "../ui/styles";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<BeforeInstallPromptChoice>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

type InstallPlatform = "ios" | "android" | "mac-safari" | "desktop-chromium" | "generic";

function isIosDevice() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isTouchMac = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone))
  );
}

function getInstallPlatform(): InstallPlatform {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/.test(userAgent);
  const isChromium = /chrome|crios|chromium|edg|edgios|opr|samsungbrowser/.test(userAgent);

  if (isIosDevice()) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  if (/macintosh/.test(userAgent) && isSafari) {
    return "mac-safari";
  }

  if (isChromium) {
    return "desktop-chromium";
  }

  return "generic";
}

function getInstallSteps(platform: InstallPlatform) {
  if (platform === "ios") {
    return ["点浏览器底部或顶部的分享按钮", "选择“添加到主屏幕”", "确认名称后点“添加”"];
  }

  if (platform === "android") {
    return ["打开浏览器菜单", "选择“安装应用”或“添加到主屏幕”", "按提示确认添加"];
  }

  if (platform === "mac-safari") {
    return ["在 Safari 菜单栏选择“文件”", "选择“添加到程序坞”", "确认名称后点“添加”"];
  }

  if (platform === "desktop-chromium") {
    return ["点地址栏右侧的安装图标", "或打开浏览器菜单并选择“安装 Moonly”", "按提示确认安装"];
  }

  return ["打开浏览器菜单", "查找“安装应用”或“添加到主屏幕”", "如果没有这个选项，可以换用 Chrome、Edge 或 Safari 再试"];
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const installSteps = getInstallSteps(getInstallPlatform());

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

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        className="fixed right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-50 gap-2 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] px-4 py-2.5 text-[color:var(--foreground)] shadow-[var(--shadow-elevated)] backdrop-blur-xl hover:bg-white"
        variant="ghost"
        onClick={handleInstallClick}
      >
        <Home className="size-4" aria-hidden="true" />
        添加到主屏幕
      </Button>

      {isHelpOpen ? (
        <Sheet
          header={
            <div>
              <p className={cn("font-semibold", uiTextStyles.lg)}>添加到主屏幕</p>
              <p className={cn("mt-1", uiTextStyles.sm, uiTextStyles.muted)}>当前浏览器需要手动完成添加</p>
            </div>
          }
          bodyClassName="sm:max-w-md"
          onClose={() => setIsHelpOpen(false)}
        >
          <ol className="space-y-3">
            {installSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)]">
                  {index + 1}
                </span>
                <span className={cn("pt-0.5 leading-relaxed", uiTextStyles.md)}>{step}</span>
              </li>
            ))}
          </ol>
        </Sheet>
      ) : null}
    </>
  );
}
