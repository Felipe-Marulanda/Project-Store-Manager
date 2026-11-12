import { Injectable } from '@angular/core';
import { toStorageError } from '../internal/storage-error.util';
import { CachePutValue, StorageError } from '../models/storage-manager.model';

@Injectable({ providedIn: 'root' })
export class CacheStorageService {
  async open(cacheName: string): Promise<void> {
    try {
      await this.cacheStorage('open').open(cacheName);
    } catch (error) {
      throw toStorageError('open', error);
    }
  }

  async createCache(cacheName: string): Promise<void> {
    await this.open(cacheName);
  }

  async listCaches(): Promise<string[]> {
    try {
      return await this.cacheStorage('list caches').keys();
    } catch (error) {
      throw toStorageError('list caches', error);
    }
  }

  async hasCache(cacheName: string): Promise<boolean> {
    try {
      return (await this.cacheStorage('check cache').keys()).includes(cacheName);
    } catch (error) {
      throw toStorageError('check cache', error);
    }
  }

  async put(cacheName: string, request: string, value: CachePutValue): Promise<void> {
    try {
      const cache = await this.cacheStorage('put').open(cacheName);
      await cache.put(request, this.toResponse(value));
    } catch (error) {
      throw toStorageError('put', error);
    }
  }

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

  async has(cacheName: string, request: string): Promise<boolean> {
    return (await this.get(cacheName, request)) !== null;
  }

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

  async deleteCache(cacheName: string): Promise<boolean> {
    try {
      return await this.cacheStorage('delete cache').delete(cacheName);
    } catch (error) {
      throw toStorageError('delete cache', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const storage = this.cacheStorage('clear');
      const cacheNames = await storage.keys();
      await Promise.all(cacheNames.map((cacheName) => storage.delete(cacheName)));
    } catch (error) {
      throw toStorageError('clear', error);
    }
  }

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
