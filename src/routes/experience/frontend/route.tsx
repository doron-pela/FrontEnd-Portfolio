import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/experience/frontend')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />;
}
