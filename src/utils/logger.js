/* src/utils/logger.js */
const SENSITIVE = /token|authorization|auth|password|secret/i

export const redactSecrets = (value) => {
  try {
    return JSON.parse(JSON.stringify(value, (key, val) => (SENSITIVE.test(key) ? '[REDACTED]' : val)))
  } catch {
    return value
  }
}

export const safeDebug = (...args) => {
  if (process.env.NODE_ENV === 'production') return
  // Redact secrets in objects
  // eslint-disable-next-line no-console
  console.debug(...args.map(a => (typeof a === 'object' ? redactSecrets(a) : a)))
}
