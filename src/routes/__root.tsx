import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";

import SplineScene from "@/components/Spline/SplineScene";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const isFrontendProjectDetailRoute = location.pathname.startsWith(
    "/experience/frontend/",
  );

  return (
    <>
      {isFrontendProjectDetailRoute ? <Outlet /> : <SplineScene />}
    </>
  );
}
