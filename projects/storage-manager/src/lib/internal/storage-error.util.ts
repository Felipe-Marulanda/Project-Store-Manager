import { StorageError } from '../models/storage-error.model';

/**
 * Convierte cualquier error capturado en un {@link StorageError}.
 * Uso interno: no forma parte de la API pública.
 *
 * @param operation Nombre de la operación que falló.
 * @param error Error original capturado.
 * @returns El mismo error si ya es un `StorageError`; si no, uno nuevo con código
 * `quota-exceeded` (cuota superada) u `operation-failed`, con el original en `cause`.
 */
export function toStorageError(operation: string, error: unknown): StorageError {
  if (error instanceof StorageError) {
    return error;
  }

  const name = error instanceof Error ? error.name : '';
  const code = name === 'QuotaExceededError' ? 'quota-exceeded' : 'operation-failed';
  const detail = error instanceof Error ? error.message : String(error);

  return new StorageError(`Storage ${operation} failed: ${detail}`, code, operation, {
    cause: error,
  });
}
