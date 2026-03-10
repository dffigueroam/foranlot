import "server-only"

export interface BancolombiaQrRequest {
  businessKey: string
  amountCOP: number
  reference: string
}

export interface BancolombiaQrResult {
  ok: boolean
  qrImageUrl?: string
  error?: string
}

export async function requestBancolombiaQr(payload: BancolombiaQrRequest): Promise<BancolombiaQrResult> {
  const endpoint = process.env.BANCOLOMBIA_QR_API_URL
  const apiKey = process.env.BANCOLOMBIA_QR_API_KEY

  if (!endpoint || !apiKey) {
    return { ok: false, error: "BANCOLOMBIA_API_NOT_CONFIGURED" }
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    if (!response.ok) {
      return { ok: false, error: `BANCOLOMBIA_API_HTTP_${response.status}` }
    }

    const data = (await response.json()) as {
      qrImageUrl?: string
      qrUrl?: string
    }

    const qrImageUrl = data.qrImageUrl || data.qrUrl
    if (!qrImageUrl) {
      return { ok: false, error: "BANCOLOMBIA_API_INVALID_RESPONSE" }
    }

    return {
      ok: true,
      qrImageUrl,
    }
  } catch {
    return { ok: false, error: "BANCOLOMBIA_API_REQUEST_FAILED" }
  }
}
