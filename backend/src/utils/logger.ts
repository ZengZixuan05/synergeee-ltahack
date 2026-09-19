// Safe logging helpers. The one rule that matters here: nothing that touches
// process.env.LTA_ACCOUNT_KEY (or any other secret) may reach these
// functions unredacted. `redactHeaders` exists specifically so call sites
// that build a headers object for an outgoing request can log that same
// object for debugging without a second, easy-to-forget redaction step.

const SENSITIVE_HEADER_NAMES = new Set(['accountkey', 'authorization']);

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = SENSITIVE_HEADER_NAMES.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return redacted;
}

/** Structured, secret-safe log line. Keep payloads to primitives/plain objects only. */
export function logSafe(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, ...data, ts: new Date().toISOString() }));
}

export function logError(event: string, error: unknown, data: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : 'UnknownError';
  console.error(JSON.stringify({ event, error: name, message, ...data, ts: new Date().toISOString() }));
}
