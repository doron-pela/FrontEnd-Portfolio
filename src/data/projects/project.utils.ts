import type {
  ProjectScreenshot,
  RenderableProjectScreenshot,
} from "@/data/projects/project.types";

export function hasScreenshotSource(
  screenshot: ProjectScreenshot,
): screenshot is RenderableProjectScreenshot {
  return Boolean(screenshot.src);
}
