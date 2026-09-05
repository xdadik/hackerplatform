// Validated env — tolerant: warns but never throws at build time.
// Uses zod if available, otherwise manual checks.

function getEnv(name: string, fallback = ""): string {
  try {
    return (typeof process !== "undefined" ? (process.env as Record<string, string | undefined>)[name] : undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

function warn(message: string) {
  // Only log in non-production to avoid noise, but always collect warnings
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`[env] ${message}`);
  }
}

export const envWarnings: string[] = [];

// Collect soft-validation warnings instead of throwing — builds must pass without secrets
function addWarning(msg: string) {
  envWarnings.push(msg);
  warn(msg);
}

// Attempt Zod validation if zod is installed; fall back to manual.
// We use dynamic require inside try so build does not break when zod is absent.
let zodParsed: Record<string, string> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const z: any = require("zod");
  const schema = z.object({
    ADMIN_PASS: z.string().min(1).optional().or(z.literal("")),
    ADMIN_USER: z.string().optional().or(z.literal("")),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional().or(z.literal("")),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
    SUPABASE_SECRET_KEY: z.string().optional().or(z.literal("")),
    NEXTAUTH_SECRET: z.string().optional().or(z.literal("")),
    NEXTAUTH_URL: z.string().url().optional().or(z.literal("")),
  });
  const result = schema.safeParse({
    ADMIN_PASS: getEnv("ADMIN_PASS") || getEnv("AEGIS_ADMIN_PASS") || getEnv("ADMIN_PASSWORD") || "",
    ADMIN_USER: getEnv("ADMIN_USER") || "",
    NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL") || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") || "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") || "",
    SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_SECRET_KEY") || "",
    SUPABASE_SECRET_KEY: getEnv("SUPABASE_SECRET_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY") || "",
    NEXTAUTH_SECRET: getEnv("NEXTAUTH_SECRET") || "",
    NEXTAUTH_URL: getEnv("NEXTAUTH_URL") || "",
  });
  if (result.success) zodParsed = result.data as Record<string, string>;
  else {
    for (const issue of result.error.issues) addWarning(`Env validation: ${issue.path.join(".")}: ${issue.message}`);
  }
} catch {
  // zod not installed — ignore, use manual below
}

const SUPABASE_URL = zodParsed?.NEXT_PUBLIC_SUPABASE_URL ?? getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY =
  (zodParsed?.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")) ||
  getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
  getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") ||
  "";
const SUPABASE_SERVICE_ROLE_KEY =
  (zodParsed?.SUPABASE_SERVICE_ROLE_KEY ?? getEnv("SUPABASE_SERVICE_ROLE_KEY")) ||
  getEnv("SUPABASE_SECRET_KEY") ||
  "";
const ADMIN_PASS = (zodParsed?.ADMIN_PASS ?? getEnv("ADMIN_PASS")) || getEnv("AEGIS_ADMIN_PASS") || getEnv("ADMIN_PASSWORD") || "";
const ADMIN_USER = (zodParsed?.ADMIN_USER ?? getEnv("ADMIN_USER")) || "admin";
const NEXTAUTH_SECRET = (zodParsed?.NEXTAUTH_SECRET ?? getEnv("NEXTAUTH_SECRET")) || "";
const NEXTAUTH_URL = (zodParsed?.NEXTAUTH_URL ?? getEnv("NEXTAUTH_URL")) || "";
const NODE_ENV_VALUE = getEnv("NODE_ENV", "development") as "development" | "production" | "test";
const APP_URL = getEnv("NEXT_PUBLIC_APP_URL") || NEXTAUTH_URL || (NODE_ENV_VALUE === "production" ? "" : "http://localhost:3000");

// Soft validation — warn but never throw during build
if (!SUPABASE_URL) addWarning("NEXT_PUBLIC_SUPABASE_URL is not set — Supabase features will use mock fallback.");
if (!SUPABASE_ANON_KEY) addWarning("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — Supabase features will use mock fallback.");
if (!ADMIN_PASS) addWarning("ADMIN_PASS is not set — admin routes will deny all requests in production. Set ADMIN_PASS in .env.local");
if (NODE_ENV_VALUE === "production" && !NEXTAUTH_SECRET) {
  addWarning("NEXTAUTH_SECRET is not set — auth may be insecure in production.");
}
if (SUPABASE_URL && !SUPABASE_URL.startsWith("https://")) {
  addWarning("NEXT_PUBLIC_SUPABASE_URL should be https in production.");
}

export const env = {
  // Canonical keys
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_PASS,
  ADMIN_USER,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  APP_URL,
  NODE_ENV: NODE_ENV_VALUE,
  IS_PRODUCTION: NODE_ENV_VALUE === "production",
  IS_SUPABASE_CONFIGURED: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  VERSION: getEnv("NEXT_PUBLIC_APP_VERSION", "0.1.0"),
  // Aliases for convenience
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
} as const;

export type Env = typeof env;

/** Strict helper for server code that *requires* a var — throws only when called, never at import. */
export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (!value) throw new Error(`Missing required env var for key: ${String(key)} — set it in .env.local`);
  return value as NonNullable<(typeof env)[K]>;
}

/** Returns collected warnings (useful for build scripts / health checks) */
export function getEnvWarnings(): string[] {
  return [...envWarnings];
}

export default env;
