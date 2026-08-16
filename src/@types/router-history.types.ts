// src/@types/router-history.types.ts
import type { HomeSection } from "@/@types/home-section.types";

export type PortfolioReturnState = {
  section: Extract<HomeSection, "experience" | "systems">;
  projectIndex: number;
  locked: true;
};

//TanStack Router intentionally allows HistoryState module augmentation. This
//keeps the return metadata typed while leaving it out of the visible URL.
declare module "@tanstack/react-router" {
  interface HistoryState {
    portfolioReturn?: PortfolioReturnState;
  }
}
