export type StorageErrorCode =
  'invalid-data' | 'not-found' | 'operation-failed' | 'quota-exceeded' | 'unavailable';

export class StorageError extends Error {
  constructor(
    message: string,
    readonly code: StorageErrorCode,
    readonly operation: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'StorageError';
  }
}
