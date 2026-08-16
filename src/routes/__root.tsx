// src/routes/__root.tsx
import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";

import SplineScene from "@/components/Spline/SplineScene";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const isPortfolioProjectDetailRoute =
    location.pathname.startsWith("/experience/frontend/") ||
    location.pathname.startsWith("/experience/backend/");

  return <>{isPortfolioProjectDetailRoute ? <Outlet /> : <SplineScene />}</>;
}
