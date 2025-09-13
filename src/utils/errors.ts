export class EnvoiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvoiError';
  }
}

export class ValidationError extends EnvoiError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ProviderError extends EnvoiError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}