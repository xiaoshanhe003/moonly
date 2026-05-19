import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

const AppShell = lazy(() => import("./shell").then((module) => ({ default: module.AppShell })));
const PhaseSciencePage = lazy(() =>
  import("../pages/phase-science-page").then((module) => ({ default: module.PhaseSciencePage }))
);
const SettingsPage = lazy(() =>
  import("../pages/settings-page").then((module) => ({ default: module.SettingsPage }))
);
const OnboardingPage = lazy(() =>
  import("../pages/onboarding-page").then((module) => ({ default: module.OnboardingPage }))
);

function withSuspense(element: ReactNode) {
  return <Suspense fallback={null}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/today" replace />
  },
  {
    path: "/today",
    element: withSuspense(<AppShell initialView="today" />)
  },
  {
    path: "/calendar",
    element: withSuspense(<AppShell initialView="calendar" />)
  },
  {
    path: "/phase-science",
    element: withSuspense(<PhaseSciencePage />)
  },
  {
    path: "/settings",
    element: withSuspense(<SettingsPage />)
  },
  {
    path: "/onboarding",
    element: withSuspense(<OnboardingPage />)
  }
]);
