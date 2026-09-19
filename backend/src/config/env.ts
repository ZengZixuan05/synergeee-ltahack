// Central place to read server-side configuration from process.env.
//
// SECURITY: nothing in this file ever logs, returns, or otherwise exposes the
// value of a secret. Functions here return booleans (`isLtaConfigured`) or
// throw a typed error when a required secret is missing — callers must never
// print the caught error's cause chain if it could contain a raw value.

export class MissingLtaAccountKeyError extends Error {
  constructor() {
    super(
      'LTA_ACCOUNT_KEY is not set. Provide it via a local .env file (see .env.example) ' +
        'or, in production, Google Cloud Secret Manager.'
    );
    this.name = 'MissingLtaAccountKeyError';
  }
}

/** Returns the LTA DataMall AccountKey. Throws if unset — never logs the value. */
export function getLtaAccountKey(): string {
  const key = process.env.LTA_ACCOUNT_KEY;
  if (!key) {
    throw new MissingLtaAccountKeyError();
  }
  return key;
}

/** Whether an LTA_ACCOUNT_KEY is present, without revealing it. Safe to log. */
export function isLtaConfigured(): boolean {
  return Boolean(process.env.LTA_ACCOUNT_KEY);
}

export function getPort(): number {
  const raw = process.env.BACKEND_PORT || process.env.PORT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8081;
}

export function getLtaBaseUrl(): string {
  return process.env.LTA_DATAMALL_BASE_URL || 'https://datamall2.mytransport.sg/ltaodataservice';
}
