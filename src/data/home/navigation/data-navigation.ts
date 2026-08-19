import type { HomeSection } from "@/@types/home-section.types";
import type { PortfolioSectionKey } from "@/utils/index-section-navigation";

export type NavbarSection = HomeSection | "skills";

export type NavbarItem =
  | {
      section: HomeSection;
      key: PortfolioSectionKey;
      label: string;
      shortLabel: string;
    }
  | {
      section: "skills";
      key: null;
      label: string;
      shortLabel: string;
    };

export const NAV_ITEMS: readonly NavbarItem[] = [
  { section: "init", key: "0", label: "Home", shortLabel: "Home" },
  { section: "about", key: "1", label: "About me", shortLabel: "About" },
  {
    section: "experience",
    key: "2",
    label: "Frontend work",
    shortLabel: "Frontend work",
  },
  {
    section: "systems",
    key: "3",
    label: "Backend work",
    shortLabel: "Backend work",
  },
  { section: "skills", key: null, label: "Skills", shortLabel: "Skills" },
  {
    section: "contact",
    key: "4",
    label: "Contact",
    shortLabel: "Contact me",
  },
] as const;
