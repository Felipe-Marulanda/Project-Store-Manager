import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageManager } from './storage-manager';

describe('StorageManager', () => {
  let component: StorageManager;
  let fixture: ComponentFixture<StorageManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageManager],
    }).compileComponents();

    fixture = TestBed.createComponent(StorageManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
