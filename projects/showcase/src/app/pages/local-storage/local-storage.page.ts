import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalStorageService, StorageError } from 'storage-manager';

interface StoredKey {
  key: string;
  preview: string;
}

interface Feedback {
  kind: 'success' | 'error';
  message: string;
}

@Component({
  imports: [FormsModule],
  selector: 'app-local-storage-page',
  styleUrl: './local-storage.page.css',
  templateUrl: './local-storage.page.html',
})
export class LocalStoragePage implements OnInit {
  protected key = '';
  protected value = '';
  protected valueType: 'text' | 'json' = 'text';
  protected keys: StoredKey[] = [];
  protected displayValue: string | null = null;
  protected feedback: Feedback | null = null;

  constructor(private readonly storage: LocalStorageService) {}

  ngOnInit(): void {
    try {
      this.refreshKeys();
    } catch (error) {
      this.showError(error);
    }
  }

  protected save(): void {
    try {
      const key = this.requireKey();
      this.storage.set(key, this.parseValue());
      this.refreshKeys();
      this.showSuccess(`La clave "${key}" se guardó correctamente.`);
    } catch (error) {
      this.showError(error);
    }
  }

  protected query(): void {
    try {
      const key = this.requireKey();
      if (!this.storage.has(key)) {
        throw new Error(`No existe la clave "${key}".`);
      }

      this.displayValue = this.formatValue(this.storage.get<unknown>(key));
      this.showSuccess(`Se consultó "${key}".`);
    } catch (error) {
      this.showError(error);
    }
  }

  protected update(): void {
    try {
      const key = this.requireKey();
      this.storage.update(key, this.parseValue());
      this.refreshKeys();
      this.showSuccess(`La clave "${key}" se actualizó.`);
    } catch (error) {
      this.showError(error);
    }
  }

  protected remove(): void {
    try {
      const key = this.requireKey();
      if (!this.storage.has(key)) {
        throw new Error(`No existe la clave "${key}".`);
      }

      this.storage.remove(key);
      this.displayValue = null;
      this.refreshKeys();
      this.showSuccess(`La clave "${key}" se eliminó.`);
    } catch (error) {
      this.showError(error);
    }
  }

  protected clear(): void {
    try {
      this.storage.clear();
      this.keys = [];
      this.displayValue = null;
      this.showSuccess('Se eliminaron las claves del almacenamiento local.');
    } catch (error) {
      this.showError(error);
    }
  }

  protected selectKey(key: string): void {
    try {
      this.key = key;
      const value = this.storage.get<unknown>(key);
      this.displayValue = this.formatValue(value);
      this.valueType = typeof value === 'string' ? 'text' : 'json';
      this.value = typeof value === 'string' ? value : this.formatValue(value);
      this.showSuccess(`Se consultó "${key}".`);
    } catch (error) {
      this.showError(error);
    }
  }

  private refreshKeys(): void {
    this.keys = this.storage.keys().map((key) => ({
      key,
      preview: this.formatValue(this.storage.get<unknown>(key)),
    }));
  }

  private requireKey(): string {
    const key = this.key.trim();
    if (!key) {
      throw new Error('Ingresa una clave antes de continuar.');
    }
    return key;
  }

  private parseValue(): unknown {
    if (this.valueType === 'text') {
      return this.value;
    }
    return JSON.parse(this.value) as unknown;
  }

  private formatValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2) ?? String(value);
  }

  private showSuccess(message: string): void {
    this.feedback = { kind: 'success', message };
  }

  private showError(error: unknown): void {
    this.feedback = {
      kind: 'error',
      message:
        error instanceof StorageError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error),
    };
  }
}
