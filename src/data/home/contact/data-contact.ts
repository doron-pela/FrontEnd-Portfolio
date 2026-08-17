export type SocialKind = "linkedin" | "github" | "instagram";

export const CONTACT_DATA = {
  titleLines: ["Get in", "Touch"],
  email: {
    label: "Email",
    value: "alepnorod@gmail.com",
    href: "mailto:alepnorod@gmail.com?subject=Hello%20Doron&body=Hi%20Doron%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20wanted%20to%20get%20in%20touch.%0A%0A",
    simpleHref: "mailto:alepnorod@gmail.com",
  },
  whatsapp: {
    label: "WhatsApp",
    value: "+234 906 410 8594",
    href: "https://wa.me/2349064108594",
    external: true,
  },
  call: {
    label: "Call",
    value: "+233 257 880 061",
    href: "tel:+233257880061",
    external: false,
  },
  socials: [
    {
      kind: "linkedin",
      label: "LinkedIn",
      value: "doron-pela-48aa62170",
      href: "https://www.linkedin.com/in/doron-pela-48aa62170/",
      external: true,
    },
    {
      kind: "github",
      label: "GitHub",
      value: "doron-pela",
      href: "https://github.com/doron-pela/",
      external: true,
    },
    {
      kind: "instagram",
      label: "Instagram",
      value: "@doron_pela",
      href: "https://www.instagram.com/doron_pela/",
      external: true,
    },
  ],
} as const;
