import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { RouterProvider } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { router } from "./app/router";
import { configureAppUpdate, markAppUpdateAvailable } from "./features/install/app-update";
import { setupInstallPromptCapture } from "./features/install/install-prompt";
import { setupInstallStorageHandoff } from "./features/install/storage-handoff";
import "./app/styles.css";

setupInstallPromptCapture();

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    markAppUpdateAvailable();
  },
  onRegisteredSW(_swScriptUrl, registration) {
    configureAppUpdate({
      registration
    });

    if (!registration) {
      return;
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void registration.update();
      }
    });
  }
});

configureAppUpdate({
  update: updateServiceWorker
});

setupInstallStorageHandoff();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Analytics />
  </React.StrictMode>
);
