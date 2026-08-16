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

  /*
    Navbar is intentionally NOT owned here. The homepage index route owns it so
    SplineScene's existing loaderComplete -> <Outlet /> gate automatically keeps
    the navbar out of the DOM until loading has completely finished. Project
    detail routes bypass SplineScene and render their own routed Outlet directly.
  */
  return isPortfolioProjectDetailRoute ? <Outlet /> : <SplineScene />;
}
