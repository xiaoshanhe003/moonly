import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./shell";

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
  }
]);
