export class WeatherUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherUpstreamError';
  }
}

export class WeatherTimeoutError extends Error {
  constructor(endpoint: string) {
    super(`data.gov.sg weather request to ${endpoint} timed out`);
    this.name = 'WeatherTimeoutError';
  }
}

export class WeatherResponseShapeError extends Error {
  constructor(endpoint: string) {
    super(`data.gov.sg weather response from ${endpoint} did not match the expected shape`);
    this.name = 'WeatherResponseShapeError';
  }
}
