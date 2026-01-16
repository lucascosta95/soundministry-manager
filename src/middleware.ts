import {NextRequest, NextResponse} from "next/server"
import {getIronSession} from "iron-session"
import {SessionData, sessionOptions} from "@/lib/session"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const locale = request.cookies.get("NEXT_LOCALE")?.value || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || ""
  response.headers.set("x-locale", locale)

  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  
  const path = request.nextUrl.pathname
  const isAuthenticated = session.isLoggedIn

  // Define public routes that don't require authentication
  const isPublicRoute = 
    path === "/login"

  if (!isAuthenticated && !isPublicRoute) {
    // For API routes, return 401 Unauthorized instead of redirecting
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    // For pages, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthenticated && path === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isAuthenticated) {
    await session.save()
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
