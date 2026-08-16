// src/routes/experience/backend/route.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/experience/backend")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
