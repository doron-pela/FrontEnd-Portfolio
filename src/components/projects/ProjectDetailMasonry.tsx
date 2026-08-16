import type { ProjectScreenshot } from "@/data/projects/project.types";
import { hasScreenshotSource } from "@/data/projects/project.utils";

type ProjectDetailMasonryProps = {
  projectTitle: string;
  screenshots: readonly ProjectScreenshot[];
};

export default function ProjectDetailMasonry({
  projectTitle,
  screenshots,
}: ProjectDetailMasonryProps) {
  const renderableScreenshots = screenshots.filter(hasScreenshotSource);

  if (renderableScreenshots.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={`${projectTitle} project screenshots`}
      className="mt-[clamp(4rem,9vw,9rem)]"
    >
      <div className="mb-[clamp(1.5rem,3vw,2.8rem)] flex items-end justify-between gap-6 border-b border-[#171717]/12 pb-4">
        <div>
          <p className="font-mono text-[clamp(0.58rem,0.66vw,0.72rem)] font-semibold uppercase tracking-[0.16em] text-[#171717]/42">
            Project gallery
          </p>
          <h2 className="mt-2 font-sans text-[clamp(2rem,4vw,4.2rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
            Screenshots
          </h2>
        </div>

        <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#171717]/38">
          {String(renderableScreenshots.length).padStart(2, "0")} images
        </span>
      </div>

      {/*
        Detail pages intentionally use a large vertical masonry wall rather than
        the homepage's horizontal peel/drag gallery. CSS columns keep this page
        lightweight and allow each screenshot to retain its natural aspect ratio
        while filling substantially more of the viewport.
      */}
      <div className="columns-1 gap-[clamp(0.9rem,1.6vw,1.5rem)] min-[760px]:columns-2">
        {renderableScreenshots.map((screenshot, index) => (
          <figure
            className="group relative mb-[clamp(0.9rem,1.6vw,1.5rem)] break-inside-avoid overflow-hidden rounded-[clamp(1rem,1.6vw,1.65rem)] border border-white/55 bg-white/22 p-[clamp(0.28rem,0.45vw,0.45rem)] shadow-[0_18px_60px_rgba(23,23,23,0.055)] backdrop-blur-[10px]"
            key={`${screenshot.alt}-${index}`}
          >
            <div className="relative overflow-hidden rounded-[clamp(0.78rem,1.3vw,1.35rem)] bg-[#171717]/[0.035]">
              <img
                alt={screenshot.alt}
                className="block h-auto w-full select-none object-cover transition-transform duration-500 ease-out group-hover:scale-[1.008]"
                draggable={false}
                loading={index < 2 ? "eager" : "lazy"}
                src={screenshot.src}
                style={{
                  objectPosition: screenshot.objectPosition ?? "center",
                }}
              />

              <span className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/58 bg-white/62 px-2.5 py-1 font-mono text-[0.52rem] font-semibold tracking-[0.12em] text-[#171717]/58 backdrop-blur-[12px]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
