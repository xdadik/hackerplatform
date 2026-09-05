import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aegis Platform",
    short_name: "Aegis",
    description:
      "Professional cybersecurity training, hands-on labs, research, and team operations — in one platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    orientation: "portrait-primary",
    background_color: "#FAFAF9",
    theme_color: "#1A56DB",
    categories: ["education", "security", "productivity", "developer"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Labs",
        short_name: "Labs",
        description: "Hands-on labs — isolated environments for practice",
        url: "/labs",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Challenges",
        short_name: "Challenges",
        description: "CTF challenges across 11 categories",
        url: "/challenges",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Research",
        short_name: "Research",
        description: "Technical publications and research",
        url: "/research",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Your learning dashboard",
        url: "/dashboard",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "wide",
        label: "Aegis Platform — Cybersecurity Learning & Practice",
      },
    ],
  };
}
