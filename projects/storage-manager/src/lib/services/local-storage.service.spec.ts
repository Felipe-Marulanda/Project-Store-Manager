import { TestBed } from '@angular/core/testing';
import { STORAGE_KEY_PREFIX, StorageError } from '../models/storage-manager.model';
import { LocalStorageService } from './local-storage.service';

function createStorageMock() {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: vi.fn(() => entries.clear()),
    getItem: vi.fn((key: string) => entries.get(key) ?? null),
    key: vi.fn((index: number): string | null => Array.from(entries.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => entries.delete(key)),
    setItem: vi.fn((key: string, value: string) => entries.set(key, value)),
  };
}

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let storage: ReturnType<typeof createStorageMock>;

  beforeEach(() => {
    storage = createStorageMock();
    vi.stubGlobal('localStorage', storage);
    service = new LocalStorageService('test:');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stores and reads primitives and objects as JSON', () => {
    service.set('count', 4);
    service.set('profile', { name: 'Santiago' });

    expect(service.get<number>('count')).toBe(4);
    expect(service.get<{ name: string }>('profile')).toEqual({
      name: 'Santiago',
    });
    expect(storage.getItem('test:count')).toBe('4');
  });

  it('returns null or the provided default when a key is missing', () => {
    expect(service.get('missing')).toBeNull();
    expect(service.get('missing', 0)).toBe(0);
    expect(service.get('missing', null)).toBeNull();
  });

  it('reports invalid stored JSON', () => {
    storage.setItem('test:broken', '{');

    expect(() => service.get('broken')).toThrowError(StorageError);
    expect(() => service.get('broken')).toThrow('not valid JSON');
  });

  it('reports values that cannot be serialized', () => {
    expect(() => service.set('undefined', undefined)).toThrowError(
      expect.objectContaining({ code: 'invalid-data' }),
    );
    expect(() => service.update('existing', undefined)).toThrowError(
      expect.objectContaining({ code: 'not-found' }),
    );

    service.set('existing', true);
    expect(() => service.update('existing', undefined)).toThrowError(
      expect.objectContaining({ code: 'invalid-data' }),
    );
  });

  it('wraps circular JSON serialization failures', () => {
    const value: { self?: unknown } = {};
    value.self = value;

    expect(() => service.set('circular', value)).toThrowError(StorageError);
  });

  it('updates an existing key and rejects a missing key', () => {
    service.set('name', 'Juan');
    service.update('name', 'Felipe');

    expect(service.get('name')).toBe('Felipe');
    expect(() => service.update('missing', 'value')).toThrowError(
      expect.objectContaining({ code: 'not-found' }),
    );
  });

  it('removes a key and reports storage errors', () => {
    service.set('name', 'Juan');
    service.remove('name');

    expect(service.has('name')).toBe(false);

    storage.removeItem.mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => service.remove('name')).toThrowError(StorageError);
  });

  it('clears only its prefixed keys when a prefix is configured', () => {
    storage.setItem('test:first', '1');
    storage.setItem('other:second', '2');
    service.clear();

    expect(storage.getItem('test:first')).toBeNull();
    expect(storage.getItem('other:second')).toBe('2');
  });

  it('ignores null keys when clearing a prefixed store', () => {
    storage.setItem('test:first', '1');
    storage.key.mockReturnValue(null);

    service.clear();

    expect(storage.getItem('test:first')).toBe('1');
  });

  it('wraps failures while clearing prefixed keys', () => {
    storage.setItem('test:first', '1');
    storage.removeItem.mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => service.clear()).toThrowError(StorageError);
  });

  it('clears all keys when no prefix is configured', () => {
    const unprefixedService = new LocalStorageService('');
    storage.setItem('first', '1');

    unprefixedService.clear();

    expect(storage.length).toBe(0);
  });

  it('lists only matching keys and ignores null storage keys', () => {
    storage.setItem('test:first', '1');
    storage.setItem('other:second', '2');
    expect(service.keys()).toEqual(['first']);

    storage.key.mockReturnValue(null);
    expect(service.keys()).toEqual([]);
  });

  it('checks whether a key exists', () => {
    service.set('present', true);

    expect(service.has('present')).toBe(true);
    expect(service.has('missing')).toBe(false);
  });

  it('wraps quota, access, and non-Error failures', () => {
    storage.setItem.mockImplementation(() => {
      throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
    });
    expect(() => service.set('full', 'value')).toThrowError(
      expect.objectContaining({ code: 'quota-exceeded' }),
    );

    storage.getItem.mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => service.get('blocked')).toThrowError(
      expect.objectContaining({ code: 'operation-failed' }),
    );

    storage.getItem.mockImplementation(() => {
      throw 'blocked';
    });
    expect(() => service.has('blocked')).toThrowError(StorageError);
  });

  it('reports when LocalStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(() => service.keys()).toThrowError(expect.objectContaining({ code: 'unavailable' }));
  });

  it('provides an empty default key prefix through its injection token', () => {
    TestBed.configureTestingModule({});

    expect(TestBed.inject(STORAGE_KEY_PREFIX)).toBe('');
    expect(TestBed.inject(LocalStorageService)).toBeInstanceOf(LocalStorageService);
  });
});
