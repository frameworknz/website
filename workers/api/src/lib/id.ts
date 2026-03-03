// Nano ID generation — avoids crypto dependency issues in Workers
export function generateId(prefix?: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(21))
  const id = Array.from(bytes)
    .map((b) => chars[b % chars.length]!)
    .join('')
  return prefix ? `${prefix}_${id}` : id
}
