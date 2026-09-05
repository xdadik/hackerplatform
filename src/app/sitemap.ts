import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://aegis.example.com";

  const now = new Date();

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/learn", priority: 0.9, changeFrequency: "weekly" },
    { path: "/labs", priority: 0.9, changeFrequency: "weekly" },
    { path: "/challenges", priority: 0.9, changeFrequency: "weekly" },
    { path: "/research", priority: 0.8, changeFrequency: "weekly" },
    { path: "/teams", priority: 0.8, changeFrequency: "weekly" },
    { path: "/leaderboard", priority: 0.7, changeFrequency: "weekly" },
    { path: "/events", priority: 0.7, changeFrequency: "weekly" },
    { path: "/dashboard", priority: 0.6, changeFrequency: "weekly" },
    { path: "/profile", priority: 0.6, changeFrequency: "weekly" },
    // additional static routes
    { path: "/community", priority: 0.7, changeFrequency: "weekly" },
    { path: "/tools", priority: 0.7, changeFrequency: "weekly" },
    { path: "/explore", priority: 0.6, changeFrequency: "weekly" },
    { path: "/organizations", priority: 0.6, changeFrequency: "weekly" },
    { path: "/cve", priority: 0.6, changeFrequency: "weekly" },
    { path: "/skills", priority: 0.5, changeFrequency: "weekly" },
    { path: "/achievements", priority: 0.5, changeFrequency: "weekly" },
    { path: "/references", priority: 0.5, changeFrequency: "weekly" },
    { path: "/settings", priority: 0.5, changeFrequency: "weekly" },
    { path: "/notifications", priority: 0.4, changeFrequency: "weekly" },
    { path: "/login", priority: 0.3, changeFrequency: "weekly" },
    { path: "/signup", priority: 0.3, changeFrequency: "weekly" },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
