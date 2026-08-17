// src/data/home/skills/data-skills.ts
import { CONTACT_DATA } from "@/data/home/contact/data-contact";
import { getSkillAssetUrl } from "@/utils/home-asset-registry";

export type TechnologyKind = string;

export const SKILLS_DATA = {
  title: "Skills",
  currentRoles: {
    eyebrow: "Current roles",
    roles: [
      {
        title: "Atlassian Frontend Engineer",
        description:
          "Build Forge / Custom UI apps in React + TypeScript across Atlassian products.",
      },
      {
        title: "C# / .NET Backend & AI Engineer",
        description:
          "Build ASP.NET Core APIs and Python RAG/agent workflows for retrieval, grounding and evaluation.",
      },
    ],
  },
  location: {
    eyebrow: "Location",
    value: "East Legon, Accra, Ghana",
  },
  experience: {
    eyebrow: "Experience",
    yearsLabel: "Years",
    years: "2+",
    focusLabel: "Focus",
    focusLines: ["Fullstack Web development"],
  },
  technologiesEyebrow: "Primary technologies",
  primaryTechnologies: [
    {
      kind: "react",
      name: "React",
      iconSrc: getSkillAssetUrl("technologies/react.svg"),
    },
    {
      kind: "typescript",
      name: "TypeScript",
      iconSrc: getSkillAssetUrl("technologies/typescript.svg"),
    },
    {
      kind: "tanstack",
      name: "TanStack Suite",
      iconSrc: getSkillAssetUrl("technologies/tanstack.svg"),
    },
    {
      kind: "next",
      name: "Next.js",
      iconSrc: getSkillAssetUrl("technologies/next.svg"),
    },
    {
      kind: "gsap",
      name: "GSAP",
      iconSrc: getSkillAssetUrl("technologies/gsap.svg"),
    },
    {
      kind: "dotnet",
      name: "C# / ASP.NET Core",
      iconSrc: getSkillAssetUrl("technologies/dotnet.svg"),
    },
    // {
    //   kind: "aws",
    //   name: "AWS / CI/CD",
    //   iconSrc: getSkillAssetUrl("technologies/aws.svg"),
    // },
    {
      kind: "postgres",
      name: "PostgreSQL",
      iconSrc: getSkillAssetUrl("technologies/postgres.svg"),
    },
  ] satisfies readonly {
    kind: TechnologyKind;
    name: string;
    iconSrc: string;
  }[],
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
