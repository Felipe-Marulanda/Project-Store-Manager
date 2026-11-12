import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CacheStorageService } from 'storage-manager';
import { CacheStoragePage } from './cache-storage.page';

describe('CacheStoragePage', () => {
  let fixture: ComponentFixture<CacheStoragePage>;
  let storage: {
    listCaches: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
    createCache: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteCache: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    storage = {
      listCaches: vi.fn(async () => []),
      keys: vi.fn(async () => []),
      createCache: vi.fn(async () => undefined),
      put: vi.fn(async () => undefined),
      get: vi.fn(async () => null),
      delete: vi.fn(async () => false),
      deleteCache: vi.fn(async () => false),
    };

    await TestBed.configureTestingModule({
      imports: [CacheStoragePage],
      providers: [{ provide: CacheStorageService, useValue: storage }],
    }).compileComponents();

    fixture = TestBed.createComponent(CacheStoragePage);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('submits the cache name to the storage service', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const cacheInput = element.querySelector<HTMLInputElement>('#new-cache-name')!;

    cacheInput.value = 'demo-cache';
    cacheInput.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(storage.createCache).toHaveBeenCalledWith('demo-cache');
  });
});
