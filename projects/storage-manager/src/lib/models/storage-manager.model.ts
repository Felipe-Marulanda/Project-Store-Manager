import { InjectionToken } from '@angular/core';

export type StorageErrorCode =
  | 'invalid-data'
  | 'not-found'
  | 'operation-failed'
  | 'quota-exceeded'
  | 'unavailable';

export type CachePutValue =
  | Response
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

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

export const STORAGE_KEY_PREFIX = new InjectionToken<string>(
  'STORAGE_KEY_PREFIX',
  {
    providedIn: 'root',
    factory: () => '',
  },
);
