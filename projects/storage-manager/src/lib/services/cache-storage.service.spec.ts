import { TestBed } from '@angular/core/testing';
import { StorageError } from '../models/storage-error.model';
import { CacheStorageService } from './cache-storage.service';

function requestKey(request: RequestInfo | URL): string {
  if (typeof request === 'string') {
    return request;
  }
  return request instanceof Request ? request.url : request.href;
}

function createCacheMock() {
  const entries = new Map<string, Response>();
  return {
    entries,
    put: vi.fn(async (request: RequestInfo | URL, response: Response) => {
      entries.set(requestKey(request), response);
    }),
    match: vi.fn(async (request: RequestInfo | URL) => entries.get(requestKey(request))),
    delete: vi.fn(async (request: RequestInfo | URL) => entries.delete(requestKey(request))),
    keys: vi.fn(async () => Array.from(entries.keys(), (url) => new Request(url))),
  };
}

function createCacheStorageMock() {
  const cacheMocks = new Map<string, ReturnType<typeof createCacheMock>>();
  return {
    cacheMocks,
    open: vi.fn(async (cacheName: string) => {
      let cache = cacheMocks.get(cacheName);
      if (!cache) {
        cache = createCacheMock();
        cacheMocks.set(cacheName, cache);
      }
      return cache;
    }),
    keys: vi.fn(async () => Array.from(cacheMocks.keys())),
    delete: vi.fn(async (cacheName: string) => cacheMocks.delete(cacheName)),
  };
}

describe('CacheStorageService', () => {
  let service: CacheStorageService;
  let cacheStorage: ReturnType<typeof createCacheStorageMock>;

  beforeEach(() => {
    service = new CacheStorageService();
    cacheStorage = createCacheStorageMock();
    vi.stubGlobal('caches', cacheStorage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens and creates a cache', async () => {
    await service.open('assets');
    await service.createCache('images');

    expect(await service.listCaches()).toEqual(['assets', 'images']);
  });

  it('can be provided by Angular dependency injection', () => {
    TestBed.configureTestingModule({});

    expect(TestBed.inject(CacheStorageService)).toBeInstanceOf(CacheStorageService);
  });

  it('lists caches and checks whether a cache exists', async () => {
    expect(await service.listCaches()).toEqual([]);
    expect(await service.hasCache('assets')).toBe(false);

    await service.createCache('assets');

    expect(await service.listCaches()).toEqual(['assets']);
    expect(await service.hasCache('assets')).toBe(true);
  });

  it('stores text, JSON data, and an existing Response', async () => {
    const url = 'https://example.com/data';
    await service.put('assets', url, 'plain text');
    await service.put('assets', 'https://example.com/user', { id: 7 });
    const response = new Response('already a response');
    await service.put('assets', 'https://example.com/response', response);

    const text = await service.get('assets', url);
    const json = await service.get('assets', 'https://example.com/user');
    const savedResponse = await service.get('assets', 'https://example.com/response');

    expect(await text?.text()).toBe('plain text');
    expect(await json?.json()).toEqual({ id: 7 });
    expect(json?.headers.get('Content-Type')).toBe('application/json');
    expect(savedResponse).toBe(response);
  });

  it('returns null or false for missing caches and resources', async () => {
    expect(await service.get('missing', '/resource')).toBeNull();
    expect(await service.has('missing', '/resource')).toBe(false);

    await service.createCache('assets');
    expect(await service.get('assets', '/resource')).toBeNull();
    expect(await service.has('assets', '/resource')).toBe(false);
  });

  it('checks, lists, and deletes resources', async () => {
    const url = 'https://example.com/data';
    await service.put('assets', url, 'value');

    expect(await service.has('assets', url)).toBe(true);
    expect((await service.keys('assets')).map((request) => request.url)).toEqual([url]);
    expect(await service.delete('assets', url)).toBe(true);
    expect(await service.delete('assets', url)).toBe(false);
    expect(await service.keys('assets')).toEqual([]);
    expect(await service.delete('missing', url)).toBe(false);
    expect(await service.keys('missing')).toEqual([]);
  });

  it('deletes a complete cache and clears every cache', async () => {
    await service.createCache('assets');
    await service.createCache('images');

    expect(await service.deleteCache('assets')).toBe(true);
    expect(await service.deleteCache('assets')).toBe(false);
    await service.clear();
    expect(await service.listCaches()).toEqual([]);
  });

  it('reports when Cache Storage is unavailable', async () => {
    vi.stubGlobal('caches', undefined);

    await expect(service.open('assets')).rejects.toMatchObject({
      code: 'unavailable',
    });
  });

  it('wraps failures from cache operations', async () => {
    cacheStorage.open.mockRejectedValue(new Error('open failed'));
    await expect(service.open('assets')).rejects.toBeInstanceOf(StorageError);

    cacheStorage.keys.mockRejectedValue(new Error('keys failed'));
    await expect(service.listCaches()).rejects.toBeInstanceOf(StorageError);
    await expect(service.hasCache('assets')).rejects.toBeInstanceOf(StorageError);
    await expect(service.get('assets', '/resource')).rejects.toBeInstanceOf(StorageError);
    await expect(service.delete('assets', '/resource')).rejects.toBeInstanceOf(StorageError);
    await expect(service.keys('assets')).rejects.toBeInstanceOf(StorageError);

    cacheStorage.delete.mockRejectedValue(new Error('delete failed'));
    await expect(service.deleteCache('assets')).rejects.toBeInstanceOf(StorageError);
    await expect(service.clear()).rejects.toBeInstanceOf(StorageError);
  });

  it('wraps put, match, and resource deletion failures', async () => {
    const cache = createCacheMock();
    cacheStorage.cacheMocks.set('assets', cache);

    cache.put.mockRejectedValue(new Error('put failed'));
    await expect(service.put('assets', '/resource', 'value')).rejects.toBeInstanceOf(StorageError);

    cache.match.mockRejectedValue(new Error('match failed'));
    await expect(service.get('assets', '/resource')).rejects.toBeInstanceOf(StorageError);

    cache.delete.mockRejectedValue(new Error('resource delete failed'));
    await expect(service.delete('assets', '/resource')).rejects.toBeInstanceOf(StorageError);
    cache.keys.mockRejectedValue(new Error('resource keys failed'));
    await expect(service.keys('assets')).rejects.toBeInstanceOf(StorageError);
  });

  it('wraps data serialization failures', async () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    await expect(service.put('assets', '/circular', cyclic)).rejects.toMatchObject({
      code: 'operation-failed',
    });
  });
});
