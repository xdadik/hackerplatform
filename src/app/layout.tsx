import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aegis.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aegis — Cybersecurity Learning, Research & Practice",
    template: "%s | Aegis",
  },
  description:
    "Professional cybersecurity training, hands-on labs, research, and team operations — in one platform. Trusted by security teams worldwide. Learn, practice, and prove skills with verifiable labs, challenges, and research.",
  keywords: [
    "cybersecurity",
    "infosec",
    "ethical hacking",
    "penetration testing",
    "CTF",
    "hands-on labs",
    "security training",
    "Aegis Platform",
    "cloud security",
    "reverse engineering",
    "digital forensics",
    "SOC",
    "active directory",
    "web security",
  ],
  authors: [{ name: "Aegis Platform", url: siteUrl }],
  creator: "Aegis Platform",
  publisher: "Aegis Platform",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Aegis Platform",
    title: "Aegis — Cybersecurity Learning, Research & Practice",
    description:
      "Professional cybersecurity training, hands-on labs, research, and team operations — in one platform. Trusted by security teams worldwide.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Aegis Platform — Cybersecurity Learning, Research & Practice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis — Cybersecurity Learning, Research & Practice",
    description:
      "Professional cybersecurity training, hands-on labs, research, and team operations — in one platform.",
    images: ["/twitter-image"],
    creator: "@aegis_platform",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  applicationName: "Aegis Platform",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1012" },
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Aegis Platform",
  url: siteUrl,
  logo: `${siteUrl}/icon-512.png`,
  description:
    "Professional cybersecurity training, hands-on labs, research, and team operations — in one platform.",
  foundingDate: "2024",
  sameAs: [
    "https://github.com/aegis-platform",
    "https://twitter.com/aegis_platform",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Aegis Platform",
  url: siteUrl,
  description:
    "Professional cybersecurity training, hands-on labs, research, and team operations — in one platform.",
  publisher: {
    "@type": "Organization",
    name: "Aegis Platform",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/icon-512.png`,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "en-US",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen min-h-[100dvh] flex flex-col bg-[var(--background)] text-[var(--text)]">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        {/* theme script — static */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              if (t === 'dark') document.documentElement.classList.add('dark');
            } catch(e){}
          })();
        `,
          }}
        />
      </body>
    </html>
  );
}
