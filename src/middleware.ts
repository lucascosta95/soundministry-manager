import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, SessionData } from "@/lib/session"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "pt-BR"
  response.headers.set("x-locale", locale)

  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isAuthenticated = session.isLoggedIn

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url))
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
}
