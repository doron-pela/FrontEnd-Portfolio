import { createFileRoute } from "@tanstack/react-router";

import ProjectDetailPage from "@/components/projects/ProjectDetailPage";
import {
  FRONTEND_DATA,
  getFrontendProjectBySlug,
} from "@/data/home/frontend/data-frontend";

export const Route = createFileRoute("/experience/frontend/$projectSlug")({
  component: FrontendProjectDetailPage,
});

function FrontendProjectDetailPage() {
  const { projectSlug } = Route.useParams();
  const project = getFrontendProjectBySlug(projectSlug);

  return (
    <ProjectDetailPage
      domain="frontend"
      eyebrow={FRONTEND_DATA.detailEyebrow}
      project={project}
      requestedSlug={projectSlug}
    />
  );
}
