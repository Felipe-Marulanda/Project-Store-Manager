import { Inject, Injectable } from '@angular/core';
import { StorageError } from '../models/storage-error.model';
import { STORAGE_KEY_PREFIX } from '../models/storage-key-prefix.model';
import { toStorageError } from '../internal/storage-error.util';

/**
 * Servicio para guardar, consultar, actualizar y eliminar datos en `localStorage`.
 *
 * Los valores se serializan a JSON, por lo que acepta primitivos, objetos y arreglos.
 * Todas las claves usan el prefijo configurado con {@link STORAGE_KEY_PREFIX} y
 * cualquier fallo se reporta como {@link StorageError}.
 *
 * @example
 * ```ts
 * private readonly storage = inject(LocalStorageService);
 *
 * this.storage.set('usuario', { nombre: 'Ana' });
 * const usuario = this.storage.get<{ nombre: string }>('usuario');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  /**
   * Crea el servicio con el prefijo de claves configurado.
   *
   * @param keyPrefix Prefijo que se antepone a todas las claves (ver {@link STORAGE_KEY_PREFIX}).
   */
  constructor(@Inject(STORAGE_KEY_PREFIX) private readonly keyPrefix: string) {}

  /**
   * Guarda un valor serializado como JSON. Si la clave ya existe, la sobrescribe.
   *
   * @typeParam T Tipo del valor que se guarda.
   * @param key Clave (sin prefijo).
   * @param value Valor a guardar.
   * @throws {@link StorageError} con código `invalid-data` si el valor no se puede
   * serializar (por ejemplo `undefined`), `quota-exceeded` si no hay espacio o
   * `unavailable` si `localStorage` no existe.
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) {
        throw new StorageError('The value cannot be serialized as JSON.', 'invalid-data', 'set');
      }

      this.storage('set').setItem(this.prefixedKey(key), serialized);
    } catch (error) {
      throw toStorageError('set', error);
    }
  }

  /**
   * Lee y deserializa el valor guardado en una clave.
   *
   * @typeParam T Tipo esperado del valor.
   * @param key Clave (sin prefijo).
   * @param defaultValue Valor a devolver si la clave no existe.
   * @returns El valor guardado, `defaultValue` si la clave no existe, o `null` si
   * tampoco se indicó un valor por defecto.
   * @throws {@link StorageError} con código `invalid-data` si lo guardado no es JSON
   * válido, o `unavailable` si `localStorage` no existe.
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const serialized = this.storage('get').getItem(this.prefixedKey(key));
      if (serialized === null) {
        return defaultValue ?? null;
      }

      return JSON.parse(serialized) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new StorageError(
          `Stored value for "${key}" is not valid JSON.`,
          'invalid-data',
          'get',
          { cause: error },
        );
      }
      throw toStorageError('get', error);
    }
  }

  /**
   * Reemplaza el valor de una clave que ya existe.
   *
   * @typeParam T Tipo del nuevo valor.
   * @param key Clave (sin prefijo).
   * @param value Nuevo valor.
   * @throws {@link StorageError} con código `not-found` si la clave no existe,
   * `invalid-data` si el valor no se puede serializar o `quota-exceeded` si no hay espacio.
   */
  update<T>(key: string, value: T): void {
    try {
      const storage = this.storage('update');
      const prefixedKey = this.prefixedKey(key);
      if (storage.getItem(prefixedKey) === null) {
        throw new StorageError(`Storage key "${key}" does not exist.`, 'not-found', 'update');
      }

      const serialized = JSON.stringify(value);
      if (serialized === undefined) {
        throw new StorageError('The value cannot be serialized as JSON.', 'invalid-data', 'update');
      }
      storage.setItem(prefixedKey, serialized);
    } catch (error) {
      throw toStorageError('update', error);
    }
  }

  /**
   * Elimina una clave. No falla si la clave no existe.
   *
   * @param key Clave (sin prefijo).
   * @throws {@link StorageError} si `localStorage` no está disponible.
   */
  remove(key: string): void {
    try {
      this.storage('remove').removeItem(this.prefixedKey(key));
    } catch (error) {
      throw toStorageError('remove', error);
    }
  }

  /**
   * Elimina los datos guardados. Con prefijo configurado borra solo las claves que
   * empiezan con él; sin prefijo vacía todo `localStorage`.
   *
   * @throws {@link StorageError} si `localStorage` no está disponible.
   */
  clear(): void {
    try {
      const storage = this.storage('clear');
      if (this.keyPrefix === '') {
        storage.clear();
        return;
      }

      const keysToRemove: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key !== null && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        storage.removeItem(key);
      }
    } catch (error) {
      throw toStorageError('clear', error);
    }
  }

  /**
   * Indica si una clave existe.
   *
   * @param key Clave (sin prefijo).
   * @returns `true` si la clave existe, `false` en caso contrario.
   * @throws {@link StorageError} si `localStorage` no está disponible.
   */
  has(key: string): boolean {
    try {
      return this.storage('has').getItem(this.prefixedKey(key)) !== null;
    } catch (error) {
      throw toStorageError('has', error);
    }
  }

  /**
   * Lista las claves guardadas que pertenecen al prefijo configurado.
   *
   * @returns Las claves sin el prefijo.
   * @throws {@link StorageError} si `localStorage` no está disponible.
   */
  keys(): string[] {
    try {
      const storage = this.storage('keys');
      const keys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key !== null && key.startsWith(this.keyPrefix)) {
          keys.push(key.slice(this.keyPrefix.length));
        }
      }
      return keys;
    } catch (error) {
      throw toStorageError('keys', error);
    }
  }

  /**
   * Obtiene `localStorage` o lanza un error si no existe en este entorno.
   *
   * @param operation Operación en curso, usada en el mensaje de error.
   */
  private storage(operation: string): Storage {
    try {
      const storage = globalThis.localStorage;
      if (!storage) {
        throw new StorageError(
          'LocalStorage is not available in this environment.',
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
   * Antepone el prefijo configurado a una clave.
   *
   * @param key Clave sin prefijo.
   */
  private prefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
