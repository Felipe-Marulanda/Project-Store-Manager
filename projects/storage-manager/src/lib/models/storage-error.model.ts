/**
 * Códigos que identifican el motivo por el que falló una operación de almacenamiento.
 *
 * - `invalid-data`: el valor no se puede serializar o lo guardado no es JSON válido.
 * - `not-found`: la clave que se quiere actualizar no existe.
 * - `operation-failed`: falló la API nativa del navegador por otra causa.
 * - `quota-exceeded`: se superó el espacio disponible del navegador.
 * - `unavailable`: LocalStorage o Cache Storage no existe en este entorno.
 */
export type StorageErrorCode =
  'invalid-data' | 'not-found' | 'operation-failed' | 'quota-exceeded' | 'unavailable';

/**
 * Error único que lanzan `LocalStorageService` y `CacheStorageService`.
 *
 * Permite manejar cualquier fallo con un solo `catch` y distinguir el motivo
 * con la propiedad {@link StorageError.code}.
 *
 * @example
 * ```ts
 * try {
 *   storage.update('no-existe', 1);
 * } catch (error) {
 *   if (error instanceof StorageError && error.code === 'not-found') {
 *     // la clave no existía
 *   }
 * }
 * ```
 */
export class StorageError extends Error {
  /**
   * Crea un error de almacenamiento con su código y la operación que falló.
   *
   * @param message Descripción legible del error.
   * @param code Motivo del error.
   * @param operation Nombre de la operación que falló (por ejemplo `set` o `get`).
   * @param options Permite adjuntar el error original en `cause`.
   */
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
