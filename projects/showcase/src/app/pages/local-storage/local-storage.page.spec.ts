import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocalStorageService } from 'storage-manager';
import { LocalStoragePage } from './local-storage.page';

describe('LocalStoragePage', () => {
  let fixture: ComponentFixture<LocalStoragePage>;
  let storage: {
    keys: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    has: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    storage = {
      keys: vi.fn(() => []),
      set: vi.fn(),
      get: vi.fn(() => null),
      has: vi.fn(() => false),
      update: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LocalStoragePage],
      providers: [{ provide: LocalStorageService, useValue: storage }],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalStoragePage);
    fixture.detectChanges();
  });

  it('saves entered text and displays success feedback', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const keyInput = element.querySelector<HTMLInputElement>('#storage-key')!;
    const valueInput = element.querySelector<HTMLTextAreaElement>('#storage-value')!;

    keyInput.value = 'welcome';
    keyInput.dispatchEvent(new Event('input'));
    valueInput.value = 'hello';
    valueInput.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(storage.set).toHaveBeenCalledWith('welcome', 'hello');
    expect(element.textContent).toContain('se guardó correctamente');
  });
});
