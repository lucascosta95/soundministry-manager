import {NextRequest, NextResponse} from "next/server"
import {getIronSession} from "iron-session"
import {SessionData, sessionOptions} from "@/lib/session"

export async function GET(request: NextRequest) {
  const response = NextResponse.json({})
  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  
  return NextResponse.json(session)
}
