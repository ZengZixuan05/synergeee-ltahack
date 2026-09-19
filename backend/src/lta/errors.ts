// Typed errors for the LTA DataMall client. Messages are safe to log — they
// never include the AccountKey (see client.ts, which only logs redacted
// headers) — but callers surfacing these to an HTTP response should still
// prefer a generic message over `error.message` where the endpoint/path
// might itself be considered sensitive.

export class LtaHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string
  ) {
    super(`LTA DataMall request to ${endpoint} failed with HTTP ${status}`);
    this.name = 'LtaHttpError';
  }
}

export class LtaTimeoutError extends Error {
  constructor(public readonly endpoint: string) {
    super(`LTA DataMall request to ${endpoint} timed out`);
    this.name = 'LtaTimeoutError';
  }
}

export class LtaNetworkError extends Error {
  constructor(
    public readonly endpoint: string,
    cause: unknown
  ) {
    super(`LTA DataMall request to ${endpoint} failed: ${cause instanceof Error ? cause.message : 'network error'}`);
    this.name = 'LtaNetworkError';
  }
}

export class LtaResponseShapeError extends Error {
  constructor(public readonly endpoint: string) {
    super(`LTA DataMall response from ${endpoint} did not match the expected shape`);
    this.name = 'LtaResponseShapeError';
  }
}
