// nanoid.ts — Simple unique ID generator (no external dependency)
export function nanoid(size = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(size)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < size; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}
