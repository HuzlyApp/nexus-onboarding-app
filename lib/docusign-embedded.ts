/**
 * DocuSign embedded signing via REST + JWT (no docusign-esign SDK — Turbopack-friendly).
 */
import jwt from "jsonwebtoken"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

function oauthHost(): string {
  return (process.env.DOCUSIGN_OAUTH_HOST || "account-d.docusign.com").replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function restBase(): string {
  return (process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi").replace(/\/$/, "")
}

async function getAccessToken(): Promise<string> {
  const integrationKey = requireEnv("DOCUSIGN_INTEGRATION_KEY")
  const userId = requireEnv("DOCUSIGN_USER_ID")
  const rsa = requireEnv("DOCUSIGN_RSA_PRIVATE_KEY").replace(/\\n/g, "\n")
  const aud = oauthHost()
  const now = Math.floor(Date.now() / 1000)

  const assertion = jwt.sign(
    {
      iss: integrationKey,
      sub: userId,
      aud,
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation",
    },
    rsa,
    { algorithm: "RS256" }
  )

  const tokenUrl = `https://${aud}/oauth/token`
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  })

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`DocuSign OAuth failed: ${res.status} ${t}`)
  }

  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) throw new Error("DocuSign token response missing access_token")
  return data.access_token
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

export async function createEmbeddedSigningSession(params: {
  email: string
  name: string
  clientUserId: string
  returnUrl: string
  /** Resolved site origin (same as return URL) — used to load /docs/Authorization_agreement.pdf when env is unset */
  publicOrigin?: string
}): Promise<{ signingUrl: string; envelopeId: string }> {
  const accountId = requireEnv("DOCUSIGN_ACCOUNT_ID")
  const base = restBase()

  const appUrl =
    params.publicOrigin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    ""
  const localPdfUrl = appUrl ? `${appUrl}/docs/Authorization_agreement.pdf` : ""
  const pdfUrl = process.env.AUTHORIZATION_PDF_URL?.trim() || localPdfUrl

  if (!pdfUrl) {
    throw new Error(
      "Set AUTHORIZATION_PDF_URL, or host the PDF at /docs/Authorization_agreement.pdf (needs a resolvable app origin)."
    )
  }

  const pdfBuffer = await loadAuthorizationPdfBuffer({
    primaryUrl: pdfUrl,
    fallbackUrl: localPdfUrl || undefined,
  })
  const documentBase64 = pdfBuffer.toString("base64")

  const accessToken = await getAccessToken()

  const envelopeDefinition = {
    emailSubject: "Authorization agreement — please sign",
    documents: [
      {
        documentBase64,
        name: "Authorization_agreement.pdf",
        fileExtension: "pdf",
        documentId: "1",
      },
    ],
    recipients: {
      signers: [
        {
          email: params.email,
          name: params.name,
          recipientId: "1",
          routingOrder: "1",
          clientUserId: params.clientUserId,
          tabs: {
            signHereTabs: [
              {
                documentId: "1",
                pageNumber: "1",
                recipientId: "1",
                xPosition: "120",
                yPosition: "720",
              },
            ],
          },
        },
      ],
    },
    status: "sent",
  }

  const envRes = await fetch(`${base}/v2.1/accounts/${accountId}/envelopes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(envelopeDefinition),
  })

  if (!envRes.ok) {
    const t = await envRes.text()
    throw new Error(`DocuSign create envelope failed: ${envRes.status} ${t}`)
  }

  const envJson = (await envRes.json()) as { envelopeId?: string }
  const envelopeId = envJson.envelopeId
  if (!envelopeId) throw new Error("DocuSign did not return envelopeId")

  const recipientViewRequest = {
    returnUrl: params.returnUrl,
    authenticationMethod: "none",
    email: params.email,
    userName: params.name,
    clientUserId: params.clientUserId,
  }

  const viewRes = await fetch(
    `${base}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipientViewRequest),
    }
  )

  if (!viewRes.ok) {
    const t = await viewRes.text()
    throw new Error(`DocuSign recipient view failed: ${viewRes.status} ${t}`)
  }

  const viewJson = (await viewRes.json()) as { url?: string }
  const signingUrl = viewJson.url
  if (!signingUrl) throw new Error("DocuSign did not return signing URL")

  return { signingUrl, envelopeId }
}
