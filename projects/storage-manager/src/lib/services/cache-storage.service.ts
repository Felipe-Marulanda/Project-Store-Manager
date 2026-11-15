import { Injectable } from '@angular/core';
import { toStorageError } from '../internal/storage-error.util';
import { CachePutValue } from '../models/cache-put-value.model';
import { StorageError } from '../models/storage-error.model';

/**
 * Servicio para administrar cachés y recursos en Cache Storage del navegador.
 *
 * Todas las operaciones son asíncronas y cualquier fallo se reporta como
 * {@link StorageError}. Los recursos se identifican por la URL (`request`) con la
 * que se guardan.
 *
 * @example
 * ```ts
 * private readonly cache = inject(CacheStorageService);
 *
 * await this.cache.put('mi-cache', '/api/datos', { id: 1 });
 * const respuesta = await this.cache.get('mi-cache', '/api/datos');
 * const datos = await respuesta?.json();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CacheStorageService {
  /**
   * Abre un caché; si no existe, lo crea.
   *
   * @param cacheName Nombre del caché.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async open(cacheName: string): Promise<void> {
    try {
      await this.cacheStorage('open').open(cacheName);
    } catch (error) {
      throw toStorageError('open', error);
    }
  }

  /**
   * Crea un caché vacío. Si ya existe, no hace nada.
   *
   * @param cacheName Nombre del caché.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async createCache(cacheName: string): Promise<void> {
    await this.open(cacheName);
  }

  /**
   * Lista los nombres de todos los cachés existentes.
   *
   * @returns Los nombres de los cachés.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async listCaches(): Promise<string[]> {
    try {
      return await this.cacheStorage('list caches').keys();
    } catch (error) {
      throw toStorageError('list caches', error);
    }
  }

  /**
   * Indica si existe un caché.
   *
   * @param cacheName Nombre del caché.
   * @returns `true` si el caché existe, `false` en caso contrario.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async hasCache(cacheName: string): Promise<boolean> {
    try {
      return (await this.cacheStorage('check cache').keys()).includes(cacheName);
    } catch (error) {
      throw toStorageError('check cache', error);
    }
  }

  /**
   * Guarda un recurso en un caché, creándolo si hace falta. Si el recurso ya
   * existe, lo reemplaza.
   *
   * @param cacheName Nombre del caché.
   * @param request URL con la que se identifica el recurso.
   * @param value Contenido a guardar (ver {@link CachePutValue}).
   * @throws {@link StorageError} si Cache Storage no está disponible o falla
   * (por ejemplo `quota-exceeded` si no hay espacio).
   */
  async put(cacheName: string, request: string, value: CachePutValue): Promise<void> {
    try {
      const cache = await this.cacheStorage('put').open(cacheName);
      await cache.put(request, this.toResponse(value));
    } catch (error) {
      throw toStorageError('put', error);
    }
  }

  /**
   * Busca un recurso en un caché.
   *
   * @param cacheName Nombre del caché.
   * @param request URL del recurso.
   * @returns La respuesta guardada, o `null` si el caché o el recurso no existen.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async get(cacheName: string, request: string): Promise<Response | null> {
    try {
      const storage = this.cacheStorage('get');
      if (!(await storage.keys()).includes(cacheName)) {
        return null;
      }

      const cache = await storage.open(cacheName);
      return (await cache.match(request)) ?? null;
    } catch (error) {
      throw toStorageError('get', error);
    }
  }

  /**
   * Indica si un recurso existe en un caché.
   *
   * @param cacheName Nombre del caché.
   * @param request URL del recurso.
   * @returns `true` si el recurso existe, `false` en caso contrario.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async has(cacheName: string, request: string): Promise<boolean> {
    return (await this.get(cacheName, request)) !== null;
  }

  /**
   * Elimina un recurso de un caché.
   *
   * @param cacheName Nombre del caché.
   * @param request URL del recurso.
   * @returns `true` si se eliminó, `false` si el caché o el recurso no existían.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async delete(cacheName: string, request: string): Promise<boolean> {
    try {
      const storage = this.cacheStorage('delete resource');
      if (!(await storage.keys()).includes(cacheName)) {
        return false;
      }

      const cache = await storage.open(cacheName);
      return await cache.delete(request);
    } catch (error) {
      throw toStorageError('delete resource', error);
    }
  }

  /**
   * Lista las peticiones (recursos) guardadas en un caché.
   *
   * @param cacheName Nombre del caché.
   * @returns Las peticiones guardadas, o un arreglo vacío si el caché no existe.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async keys(cacheName: string): Promise<readonly Request[]> {
    try {
      const storage = this.cacheStorage('list resources');
      if (!(await storage.keys()).includes(cacheName)) {
        return [];
      }

      const cache = await storage.open(cacheName);
      return await cache.keys();
    } catch (error) {
      throw toStorageError('list resources', error);
    }
  }

  /**
   * Elimina un caché completo con todos sus recursos.
   *
   * @param cacheName Nombre del caché.
   * @returns `true` si se eliminó, `false` si no existía.
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async deleteCache(cacheName: string): Promise<boolean> {
    try {
      return await this.cacheStorage('delete cache').delete(cacheName);
    } catch (error) {
      throw toStorageError('delete cache', error);
    }
  }

  /**
   * Elimina todos los cachés del origen actual.
   *
   * @throws {@link StorageError} si Cache Storage no está disponible o falla.
   */
  async clear(): Promise<void> {
    try {
      const storage = this.cacheStorage('clear');
      const cacheNames = await storage.keys();
      await Promise.all(cacheNames.map((cacheName) => storage.delete(cacheName)));
    } catch (error) {
      throw toStorageError('clear', error);
    }
  }

  /**
   * Obtiene `caches` o lanza un error si no existe en este entorno.
   *
   * @param operation Operación en curso, usada en el mensaje de error.
   */
  private cacheStorage(operation: string): CacheStorage {
    try {
      const storage = globalThis.caches;
      if (!storage) {
        throw new StorageError(
          'Cache Storage is not available in this environment.',
          'unavailable',
          operation,
        );
      }
      return storage;
    } catch (error) {
      throw toStorageError(operation, error);
    }
  }

  /**
   * Convierte un {@link CachePutValue} en un `Response` listo para guardar.
   *
   * @param value Valor a convertir.
   */
  private toResponse(value: CachePutValue): Response {
    if (value instanceof Response) {
      return value;
    }
    if (typeof value === 'string') {
      return new Response(value);
    }

    return new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
