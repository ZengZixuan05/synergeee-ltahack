export class OneMapConfigError extends Error {
  constructor() {
    super(
      'OneMap is not configured: set ONEMAP_API_KEY, or both ONEMAP_API_EMAIL and ONEMAP_API_PASSWORD, in the root .env.'
    );
    this.name = 'OneMapConfigError';
  }
}

export class OneMapUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OneMapUpstreamError';
  }
}

export class OneMapTimeoutError extends Error {
  constructor(endpoint: string) {
    super(`OneMap request to ${endpoint} timed out`);
    this.name = 'OneMapTimeoutError';
  }
}

export class OneMapResponseShapeError extends Error {
  constructor(endpoint: string) {
    super(`OneMap response from ${endpoint} did not match the expected shape`);
    this.name = 'OneMapResponseShapeError';
  }
}
