import {NextRequest, NextResponse} from "next/server"
import {getIronSession} from "iron-session"
import {SessionData, sessionOptions} from "@/lib/session"
import {checkRateLimit} from "@/lib/rate-limit"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Rate Limiting Logic
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1"
  const path = request.nextUrl.pathname
  const pathLowerCase = path.toLowerCase()
  const publicPath = pathLowerCase.replace(/^\/(pt-br|en-us)/, '')

  // 1. Strict limit for Login (5 requests per minute)
  if (path === "/login") {
    if (!checkRateLimit(`login_${ip}`, 5, 60 * 1000)) {
      return new NextResponse("Too many login attempts. Please try again later.", { status: 429 })
    }
  }

  // 2. Moderate limit for Public Schedules (30 requests per minute)
  if (publicPath.startsWith("/public")) {
    if (!checkRateLimit(`public_${ip}`, 30, 60 * 1000)) {
      return new NextResponse("Too many requests. Please slow down.", { status: 429 })
    }
  }

  // 3. General API limit (100 requests per minute)
  if (path.startsWith("/api")) {
    if (!checkRateLimit(`api_${ip}`, 100, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
  }

  const locale = request.cookies.get("NEXT_LOCALE")?.value || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || ""
  response.headers.set("x-locale", locale)

  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  
  const isAuthenticated = session.isLoggedIn

  // Define public routes that don't require authentication
  
  const isPublicRoute = 
    path === "/login" || publicPath.startsWith("/public")

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
