import { StorageError } from '../models/storage-manager.model';

export function toStorageError(
  operation: string,
  error: unknown,
): StorageError {
  if (error instanceof StorageError) {
    return error;
  }

  const name = error instanceof Error ? error.name : '';
  const code = name === 'QuotaExceededError' ? 'quota-exceeded' : 'operation-failed';
  const detail = error instanceof Error ? error.message : String(error);

  return new StorageError(
    `Storage ${operation} failed: ${detail}`,
    code,
    operation,
    { cause: error },
  );
}
