export const dynamic = "force-dynamic"

export async function GET() {
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.npm_package_version ??
    "0.1.0"

  const env =
    process.env.NODE_ENV === "production" ? "production" : "dev"

  return Response.json(
    {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version,
      env,
    },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  )
}
