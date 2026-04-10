import { NextRequest, NextResponse } from "next/server"
import { createEmbeddedSigningSession } from "@/lib/docusign-embedded"
import { createZohoEmbeddedSigningSession } from "@/lib/zoho-sign-embedded"
import { resolveAppOrigin } from "@/lib/resolve-app-origin"

export const runtime = "nodejs"

function useZohoSign(): boolean {
  const p = process.env.SIGNING_PROVIDER?.toLowerCase()
  if (p === "zoho") return true
  if (p === "docusign") return false
  return Boolean(
    process.env.ZOHO_SIGN_CLIENT_ID?.trim() &&
      process.env.ZOHO_SIGN_CLIENT_SECRET?.trim() &&
      process.env.ZOHO_SIGN_REFRESH_TOKEN?.trim()
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const applicantId = body.applicantId as string | undefined
    const email = (body.email as string | undefined)?.trim()
    const name = (body.name as string | undefined)?.trim()
    const origin = body.origin as string | undefined

    if (!applicantId || !email || !name) {
      return NextResponse.json(
        { error: "Missing applicantId, email, or name" },
        { status: 400 }
      )
    }

    const appUrl = resolveAppOrigin(req, origin)
    if (!appUrl) {
      return NextResponse.json(
        {
          error:
            "Could not determine app URL for signing return. Open the app in the browser (or set NEXT_PUBLIC_APP_URL).",
        },
        { status: 500 }
      )
    }

    const returnUrl = `${appUrl}/application/docusign-callback`

    if (useZohoSign()) {
      const { signingUrl, envelopeId, signingCompleteManual } = await createZohoEmbeddedSigningSession({
        email,
        name,
        returnUrl,
        publicOrigin: appUrl,
      })
      return NextResponse.json({ signingUrl, envelopeId, signingCompleteManual })
    }

    const { signingUrl, envelopeId } = await createEmbeddedSigningSession({
      email,
      name,
      clientUserId: applicantId,
      returnUrl,
      publicOrigin: appUrl,
    })

    return NextResponse.json({ signingUrl, envelopeId, signingCompleteManual: false })
  } catch (err: unknown) {
    console.error("[docusign/create-embedded-sign]", err)
    const msg = err instanceof Error ? err.message : "Signing session error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
