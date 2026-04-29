import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./shell";
import { PhaseSciencePage } from "../pages/phase-science-page";
import { SettingsPage } from "../pages/settings-page";
import { OnboardingPage } from "../pages/onboarding-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/today" replace />
  },
  {
    path: "/today",
    element: <AppShell initialView="today" />
  },
  {
    path: "/calendar",
    element: <AppShell initialView="calendar" />
  },
  {
    path: "/phase-science",
    element: <PhaseSciencePage />
  },
  {
    path: "/settings",
    element: <SettingsPage />
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />
  }
]);
