/**
 * Valores que `CacheStorageService.put` sabe guardar en Cache Storage.
 *
 * - `Response`: se guarda tal cual.
 * - `string`: se guarda como cuerpo de texto de una respuesta.
 * - Cualquier otro valor (número, booleano, `null`, objeto o arreglo): se serializa
 *   a JSON y se guarda con la cabecera `Content-Type: application/json`.
 */
export type CachePutValue =
  Response | string | number | boolean | null | Record<string, unknown> | unknown[];
