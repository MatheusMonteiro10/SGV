interface JwtPayload {
  exp?: number
  [key: string]: unknown
}

/**
 * Decodifica o payload de um JWT sem validar assinatura — isso é só para
 * checagem local e otimista de expiração no client. A validação real
 * (assinatura, integridade) é sempre feita pelo backend.
 */
function decodePayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token)
  if (!payload?.exp) return true

  const expiraEmMs = payload.exp * 1000
  return Date.now() >= expiraEmMs
}