import type {
  ProjectDomain,
  ProjectScreenshot,
} from "@/data/projects/project.types";

//Vite expands this literal glob at dev/build time. Every matching image under
//src/assets/home becomes a normal Vite-managed URL, which gives the homepage a
//single asset registry instead of one hand-maintained import list per feature.
const homeAssetUrls = import.meta.glob(
  "/src/assets/home/**/*.{svg,SVG,png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,gif,GIF}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

const numericFilenameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function normalizeRelativeAssetPath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function getFilename(path: string) {
  return path.slice(path.lastIndexOf("/") + 1);
}

function removeFileExtension(filename: string) {
  const finalDotIndex = filename.lastIndexOf(".");

  return finalDotIndex <= 0 ? filename : filename.slice(0, finalDotIndex);
}

function createScreenshotAltText(
  projectTitle: string,
  filename: string,
  screenshotIndex: number,
) {
  const filenameWithoutExtension = removeFileExtension(filename);
  const descriptiveFilename = filenameWithoutExtension
    //01-dashboard, 02_dashboard and 03.dashboard all become their descriptive
    //portion while the numeric prefix can still control gallery ordering.
    .replace(/^\d+[\s._-]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!descriptiveFilename) {
    return `${projectTitle} screenshot ${screenshotIndex + 1}`;
  }

  return `${projectTitle} — ${descriptiveFilename}`;
}

/**
 * Resolve any image asset by a path relative to src/assets/home.
 *
 * Examples:
 * getHomeAssetUrl("skills/technologies/react.svg")
 * getHomeAssetUrl("about/profile.webp")
 */
export function getHomeAssetUrl(relativePath: string) {
  const normalizedPath = normalizeRelativeAssetPath(relativePath);
  const modulePath = `/src/assets/home/${normalizedPath}`;
  const assetUrl = homeAssetUrls[modulePath];

  if (!assetUrl) {
    throw new Error(
      `[home-asset-registry] Missing home asset: ${modulePath}. ` +
        "Add the file under src/assets/home or correct the referenced path.",
    );
  }

  return assetUrl;
}

/**
 * Skills-specific convenience wrapper. The data model can reference a relative
 * skill asset without importing each SVG into SkillsDrawer or data-skills.ts.
 */
export function getSkillAssetUrl(relativePath: string) {
  return getHomeAssetUrl(`skills/${normalizeRelativeAssetPath(relativePath)}`);
}

/**
 * Return every local screenshot inside:
 * src/assets/home/projects/<domain>/<projectFolder>/
 *
 * Files are naturally sorted, so naming them 01-..., 02-..., 03-... gives an
 * explicit gallery order without maintaining a screenshots array by hand.
 */
export function getProjectScreenshots(
  domain: ProjectDomain,
  projectFolder: string,
  projectTitle: string,
): readonly ProjectScreenshot[] {
  const normalizedFolder = normalizeRelativeAssetPath(projectFolder).replace(
    /\/+$/,
    "",
  );
  const folderPrefix = `/src/assets/home/projects/${domain}/${normalizedFolder}/`;

  return Object.entries(homeAssetUrls)
    .filter(([path]) => path.startsWith(folderPrefix))
    .sort(([firstPath], [secondPath]) =>
      numericFilenameCollator.compare(
        getFilename(firstPath),
        getFilename(secondPath),
      ),
    )
    .map(([path, src], index) => ({
      src,
      alt: createScreenshotAltText(projectTitle, getFilename(path), index),
    }));
}

/**
 * Prefer local folder screenshots, but keep an existing remote/manual array as
 * a migration fallback until local files are dropped into that project folder.
 */
export function getProjectScreenshotsWithFallback(
  domain: ProjectDomain,
  projectFolder: string,
  projectTitle: string,
  fallbackScreenshots: readonly ProjectScreenshot[] = [],
): readonly ProjectScreenshot[] {
  const localScreenshots = getProjectScreenshots(
    domain,
    projectFolder,
    projectTitle,
  );

  return localScreenshots.length > 0 ? localScreenshots : fallbackScreenshots;
}
