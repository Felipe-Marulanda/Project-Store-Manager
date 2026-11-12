import { Inject, Injectable } from '@angular/core';
import {
  STORAGE_KEY_PREFIX,
  StorageError,
} from '../models/storage-manager.model';
import { toStorageError } from '../internal/storage-error.util';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  constructor(
    @Inject(STORAGE_KEY_PREFIX) private readonly keyPrefix: string,
  ) {}

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) {
        throw new StorageError(
          'The value cannot be serialized as JSON.',
          'invalid-data',
          'set',
        );
      }

      this.storage('set').setItem(this.prefixedKey(key), serialized);
    } catch (error) {
      throw toStorageError('set', error);
    }
  }

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

  update<T>(key: string, value: T): void {
    try {
      const storage = this.storage('update');
      const prefixedKey = this.prefixedKey(key);
      if (storage.getItem(prefixedKey) === null) {
        throw new StorageError(
          `Storage key "${key}" does not exist.`,
          'not-found',
          'update',
        );
      }

      const serialized = JSON.stringify(value);
      if (serialized === undefined) {
        throw new StorageError(
          'The value cannot be serialized as JSON.',
          'invalid-data',
          'update',
        );
      }
      storage.setItem(prefixedKey, serialized);
    } catch (error) {
      throw toStorageError('update', error);
    }
  }

  remove(key: string): void {
    try {
      this.storage('remove').removeItem(this.prefixedKey(key));
    } catch (error) {
      throw toStorageError('remove', error);
    }
  }

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

  has(key: string): boolean {
    try {
      return this.storage('has').getItem(this.prefixedKey(key)) !== null;
    } catch (error) {
      throw toStorageError('has', error);
    }
  }

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

  private prefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
