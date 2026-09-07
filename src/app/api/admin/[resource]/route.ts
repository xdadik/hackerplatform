import {
  handleAdminList,
  handleAdminCreate,
  handleAdminUpdate,
  handleAdminDelete,
  guardAdminRead,
  guardAdminMutation,
  ADMIN_RESOURCES,
} from "@/lib/admin-api"

export const runtime = "nodejs"

// Generic admin CRUD: /api/admin/users|videos|labs|challenges|events|news|cves
// Static sibling routes (/api/admin/login, /api/admin/logout) take precedence
// over this dynamic segment in the Next.js router.

type RouteContext = { params: Promise<{ resource: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { resource } = await params
  const guard = guardAdminRead(request)
  if (guard) return guard
  return handleAdminList(resource, request)
}

export async function POST(request: Request, { params }: RouteContext) {
  const { resource } = await params
  const guard = guardAdminMutation(request)
  if (guard) return guard
  return handleAdminCreate(resource, request)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { resource } = await params
  const guard = guardAdminMutation(request)
  if (guard) return guard
  return handleAdminUpdate(resource, request)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { resource } = await params
  const guard = guardAdminMutation(request)
  if (guard) return guard
  return handleAdminDelete(resource, request)
}

// Discovery endpoint: which resources exist
export async function OPTIONS() {
  return Response.json(
    { resources: Object.keys(ADMIN_RESOURCES), methods: ["GET", "POST", "PATCH", "DELETE"] },
    { headers: { "Cache-Control": "no-store" } }
  )
}
