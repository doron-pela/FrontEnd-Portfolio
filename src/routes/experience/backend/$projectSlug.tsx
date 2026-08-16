import { createFileRoute } from "@tanstack/react-router";

import ProjectDetailPage from "@/components/projects/ProjectDetailPage";
import {
  BACKEND_DATA,
  getBackendProjectBySlug,
} from "@/data/home/backend/data-backend";

export const Route = createFileRoute("/experience/backend/$projectSlug")({
  component: BackendProjectDetailPage,
});

function BackendProjectDetailPage() {
  const { projectSlug } = Route.useParams();
  const project = getBackendProjectBySlug(projectSlug);

  return (
    <ProjectDetailPage
      domain="backend"
      eyebrow={BACKEND_DATA.detailEyebrow}
      project={project}
      requestedSlug={projectSlug}
    />
  );
}
