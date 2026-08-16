import { CONTACT_DATA } from "@/data/home/contact/data-contact";

export type TechnologyKind =
  | "react"
  | "typescript"
  | "tanstack"
  | "next"
  | "gsap"
  | "dotnet"
  | "aws"
  | "postgres";

export const SKILLS_DATA = {
  title: "Skills",
  currentRole: {
    eyebrow: "Current role",
    title: "Software Engineer",
    description:
      "React / TypeScript product interfaces with C# / .NET API and backend systems.",
  },
  location: {
    eyebrow: "Location",
    value: "Ghana",
  },
  experience: {
    eyebrow: "Experience",
    yearsLabel: "Years",
    years: "—",
    focusLabel: "Focus",
    focusLines: ["Front-end", "+ Backend"],
  },
  technologiesEyebrow: "Primary technologies",
  primaryTechnologies: [
    { kind: "react", name: "React" },
    { kind: "typescript", name: "TypeScript" },
    { kind: "tanstack", name: "TanStack" },
    { kind: "next", name: "Next.js" },
    { kind: "gsap", name: "GSAP" },
    { kind: "dotnet", name: "C# / .NET" },
    { kind: "aws", name: "AWS" },
    { kind: "postgres", name: "PostgreSQL" },
  ] satisfies readonly { kind: TechnologyKind; name: string }[],
  contactEyebrow: "Contact",
  contacts: [
    {
      label: CONTACT_DATA.email.label,
      value: CONTACT_DATA.email.value,
      href: CONTACT_DATA.email.simpleHref,
      external: false,
    },
    CONTACT_DATA.whatsapp,
    CONTACT_DATA.call,
    CONTACT_DATA.socials[0],
    CONTACT_DATA.socials[1],
  ],
} as const;
