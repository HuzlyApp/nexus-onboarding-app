/**
 * Zoho Sign embedded signing: OAuth refresh token + create → submit → embedtoken.
 * Server-only.
 */

import { normalizePublicOrigin, normalizeRedirectUrl } from "@/lib/resolve-app-origin"

type ZohoTokenResponse = {
  access_token: string
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing ${name}`)
  return v.trim()
}

function signApiBase(): string {
  return (process.env.ZOHO_SIGN_API_BASE || "https://sign.zoho.com").replace(/\/$/, "")
}

function accountsHost(): string {
  const raw = (process.env.ZOHO_ACCOUNTS_HOST || process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com").trim()
  return raw.replace(/\/$/, "")
}

async function getZohoSignAccessToken(): Promise<string> {
  const clientId = requireEnv("ZOHO_SIGN_CLIENT_ID")
  const clientSecret = requireEnv("ZOHO_SIGN_CLIENT_SECRET")
  const refreshToken = requireEnv("ZOHO_SIGN_REFRESH_TOKEN")

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const tokenUrl = `${accountsHost()}/oauth/v2/token`
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  const raw = await res.text()
  let parsed: unknown = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }

  if (!res.ok) {
    throw new Error(
      `Zoho Sign token error: ${res.status} ${tokenUrl} ${raw || "(empty response)"}`
    )
  }

  const data = (parsed || {}) as Partial<ZohoTokenResponse> & {
    error?: string
    error_description?: string
  }

  if (!data.access_token) {
    const details =
      typeof data.error === "string" || typeof data.error_description === "string"
        ? `${data.error || "missing_access_token"}${data.error_description ? ` — ${data.error_description}` : ""}`
        : raw || "(empty response)"
    throw new Error(
      `Zoho Sign token response missing access_token. Check ZOHO_SIGN_REFRESH_TOKEN / ZOHO_SIGN_CLIENT_ID / ZOHO_SIGN_CLIENT_SECRET and ZOHO_ACCOUNTS_HOST. Response: ${details}`
    )
  }
  return data.access_token
}

function zohoFailMessage(json: Record<string, unknown>): string {
  const m = json.message
  return typeof m === "string" ? m : JSON.stringify(json)
}

function requireZohoSuccess(json: Record<string, unknown>, ctx: string): void {
  if (json.status !== "success") {
    throw new Error(`${ctx}: ${zohoFailMessage(json)}`)
  }
}

async function loadAuthorizationPdfBuffer(opts: {
  primaryUrl: string
  fallbackUrl?: string
}): Promise<Buffer> {
  const tryFetch = async (u: string) => {
    const r = await fetch(u)
    return { r, u }
  }

  const primary = await tryFetch(opts.primaryUrl)
  if (primary.r.ok) return Buffer.from(await primary.r.arrayBuffer())

  if (opts.fallbackUrl && opts.fallbackUrl !== opts.primaryUrl) {
    const fb = await tryFetch(opts.fallbackUrl)
    if (fb.r.ok) return Buffer.from(await fb.r.arrayBuffer())
  }

  throw new Error(`Could not load authorization PDF (${primary.r.status})`)
}

export async function createZohoEmbeddedSigningSession(params: {
  email: string
  name: string
  returnUrl: string
  /** App origin (must match the page hosting the iframe for embedtoken host) */
  publicOrigin?: string
}): Promise<{ signingUrl: string; envelopeId: string; signingCompleteManual: boolean }> {
  const rawOrigin =
    params.publicOrigin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    ""

  let appUrl: string
  try {
    appUrl = rawOrigin ? normalizePublicOrigin(rawOrigin) : ""
  } catch {
    appUrl = ""
  }

  const localPdfUrl = appUrl ? `${appUrl}/docs/Authorization_agreement.pdf` : ""
  const pdfUrl = process.env.AUTHORIZATION_PDF_URL?.trim() || localPdfUrl

  if (!pdfUrl) {
    throw new Error(
      "Set AUTHORIZATION_PDF_URL, or host the PDF at /docs/Authorization_agreement.pdf (needs a resolvable app origin)."
    )
  }

  if (!appUrl) {
    throw new Error("publicOrigin or NEXT_PUBLIC_APP_URL is required for Zoho Sign embedded host.")
  }

  const callbackUrl = normalizeRedirectUrl(params.returnUrl)
  /** Zoho rejects non-HTTPS URLs for redirect_pages.sign_completed (e.g. http://localhost → "invalid scheme"). */
  const overrideCompleted = process.env.ZOHO_SIGN_SIGN_COMPLETED_URL?.trim()
  const signCompletedUrl = overrideCompleted ? normalizeRedirectUrl(overrideCompleted) : callbackUrl
  const useRedirectPages = signCompletedUrl.startsWith("https://")

  const pdfBuffer = await loadAuthorizationPdfBuffer({
    primaryUrl: pdfUrl,
    fallbackUrl: localPdfUrl || undefined,
  })

  const accessToken = await getZohoSignAccessToken()
  const base = signApiBase()
  const authHeader = { Authorization: `Zoho-oauthtoken ${accessToken}` }

  const requestName = "Authorization agreement — please sign"
  const templateId = process.env.ZOHO_SIGN_TEMPLATE_ID?.trim() || ""

  // Common request payload used by both "upload PDF" and "template" flows.
  const requestsPayload: Record<string, unknown> = {
    request_name: requestName,
    description: "Background check authorization",
    is_sequential: true,
    expiration_days: 30,
    email_reminders: false,
    actions: [
      {
        action_type: "SIGN",
        recipient_email: params.email,
        recipient_name: params.name,
        signing_order: 0,
        verify_recipient: false,
        is_embedded: true,
      },
    ],
  }

  const createData: Record<string, unknown> = { requests: requestsPayload }

  if (useRedirectPages) {
    ;(createData.requests as Record<string, unknown>).redirect_pages = {
      sign_completed: signCompletedUrl,
    }
  }

  // Create request either by template (preferred when configured) or by uploading the PDF.
  let reqWrap: {
    request_id: string
    request_name: string
    document_ids?: { document_id: string }[]
    actions?: { action_id: string; recipient_email: string; recipient_name: string; action_type: string }[]
  }

  if (templateId) {
    // Create document from template.
    // Docs: POST /api/v1/templates/{template_id}/createdocument
    const form = new FormData()
    form.append("data", JSON.stringify({ requests: { ...requestsPayload, is_quicksend: true } }))

    const res = await fetch(`${base}/api/v1/templates/${encodeURIComponent(templateId)}/createdocument`, {
      method: "POST",
      headers: authHeader,
      body: form,
    })
    const json = (await res.json()) as Record<string, unknown>
    if (!res.ok) {
      throw new Error(`Zoho Sign create from template failed: ${res.status} ${JSON.stringify(json)}`)
    }
    requireZohoSuccess(json, "Zoho Sign create (template)")
    reqWrap = json.requests as typeof reqWrap
  } else {
    const createForm = new FormData()
    createForm.append(
      "file",
      new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
      "Authorization_agreement.pdf"
    )
    createForm.append("data", JSON.stringify(createData))

    const createRes = await fetch(`${base}/api/v1/requests`, {
      method: "POST",
      headers: authHeader,
      body: createForm,
    })

    const createJson = (await createRes.json()) as Record<string, unknown>
    if (!createRes.ok) {
      throw new Error(`Zoho Sign create request failed: ${createRes.status} ${JSON.stringify(createJson)}`)
    }
    requireZohoSuccess(createJson, "Zoho Sign create")
    reqWrap = createJson.requests as typeof reqWrap
  }

  const requestId = reqWrap.request_id
  let actionId = reqWrap.actions?.[0]?.action_id
  const documentId = reqWrap.document_ids?.[0]?.document_id
  if (!requestId) {
    throw new Error("Zoho Sign create response missing request_id")
  }

  // If the template flow didn't return actions (or action_id), submit the request to generate them.
  if (!actionId) {
    const submitForm = new FormData()
    submitForm.append("data", JSON.stringify({ requests: { request_name: reqWrap.request_name || requestName } }))
    const submitRes = await fetch(`${base}/api/v1/requests/${requestId}/submit`, {
      method: "POST",
      headers: authHeader,
      body: submitForm,
    })
    const submitJson = (await submitRes.json()) as Record<string, unknown>
    if (!submitRes.ok) {
      throw new Error(`Zoho Sign submit failed: ${submitRes.status} ${JSON.stringify(submitJson)}`)
    }
    requireZohoSuccess(submitJson, "Zoho Sign submit")
    const wrap = submitJson.requests as { actions?: { action_id: string }[] }
    actionId = wrap.actions?.[0]?.action_id
  }

  if (!actionId) {
    throw new Error("Zoho Sign create response missing action_id")
  }

  // If we're not using a template, we must add at least one signature field before submitting.
  // If we are using a template, fields are already defined in the template.
  if (!templateId) {
    if (!documentId) throw new Error("Zoho Sign create response missing document_id")

    // Signature field — coordinates aligned with DocuSign tab (bottom area of first page).
    const pageNo = Number(process.env.ZOHO_SIGN_SIGNATURE_PAGE_NO || "0")
    const sigX = process.env.ZOHO_SIGN_SIGNATURE_X || "120"
    const sigY = process.env.ZOHO_SIGN_SIGNATURE_Y || "720"

    const submitData = {
      requests: {
        request_name: reqWrap.request_name || requestName,
        actions: [
          {
            action_id: actionId,
            recipient_email: params.email,
            recipient_name: params.name,
            action_type: "SIGN",
            fields: [
              {
                document_id: documentId,
                field_name: "Signature",
                field_label: "Signature",
                field_type_name: "Signature",
                field_category: "image",
                page_no: pageNo,
                x_coord: sigX,
                y_coord: sigY,
                abs_width: "150",
                abs_height: "40",
              },
            ],
          },
        ],
      },
    }

    const submitForm = new FormData()
    submitForm.append("data", JSON.stringify(submitData))

    const submitRes = await fetch(`${base}/api/v1/requests/${requestId}/submit`, {
      method: "POST",
      headers: authHeader,
      body: submitForm,
    })

    const submitJson = (await submitRes.json()) as Record<string, unknown>
    if (!submitRes.ok) {
      throw new Error(`Zoho Sign submit failed: ${submitRes.status} ${JSON.stringify(submitJson)}`)
    }
    requireZohoSuccess(submitJson, "Zoho Sign submit")
  }

  const embedForm = new FormData()
  embedForm.append("host", appUrl)

  const embedRes = await fetch(`${base}/api/v1/requests/${requestId}/actions/${actionId}/embedtoken`, {
    method: "POST",
    headers: authHeader,
    body: embedForm,
  })

  const embedJson = (await embedRes.json()) as Record<string, unknown>
  if (!embedRes.ok) {
    throw new Error(`Zoho Sign embedtoken failed: ${embedRes.status} ${JSON.stringify(embedJson)}`)
  }
  requireZohoSuccess(embedJson, "Zoho Sign embedtoken")
  const signingUrl = embedJson.sign_url
  if (typeof signingUrl !== "string" || !signingUrl) throw new Error("Zoho Sign did not return sign_url")

  return {
    signingUrl,
    envelopeId: requestId,
    /** True when sign_completed was omitted (HTTP origin); user must confirm in UI. */
    signingCompleteManual: !useRedirectPages,
  }
}
