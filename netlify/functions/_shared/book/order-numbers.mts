export function buildOrderNumber(
  now = new Date(),
  random = crypto.getRandomValues(new Uint32Array(1))[0],
): string {
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const suffix = random.toString(36).toUpperCase().padStart(6, '0').slice(-6)
  return `HM-${yyyy}${mm}${dd}-${suffix}`
}

export function buildPublicOrderToken(
  bytes = crypto.getRandomValues(new Uint8Array(24)),
): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
