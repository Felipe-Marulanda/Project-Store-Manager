import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CacheStorageService, StorageError } from 'storage-manager';

interface Feedback {
  kind: 'success' | 'error';
  message: string;
}

@Component({
  imports: [FormsModule],
  selector: 'app-cache-storage-page',
  styleUrl: './cache-storage.page.css',
  templateUrl: './cache-storage.page.html',
})
export class CacheStoragePage implements OnInit {
  protected cacheName = 'showcase-cache';
  protected newCacheName = '';
  protected resourceUrl = '';
  protected resourceContent = '';
  protected cacheNames: string[] = [];
  protected resources: string[] = [];
  protected responseText: string | null = null;
  protected responseStatus: number | null = null;
  protected responseStatusText = '';
  protected feedback: Feedback | null = null;

  constructor(
    private readonly storage: CacheStorageService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.refreshCaches().catch((error: unknown) => this.showError(error));
  }

  protected async createCache(): Promise<void> {
    try {
      const cacheName = this.newCacheName.trim();
      if (!cacheName) {
        throw new Error('Ingresa un nombre para la caché.');
      }

      await this.storage.createCache(cacheName);
      this.cacheName = cacheName;
      this.newCacheName = '';
      await this.refreshCaches();
      this.showSuccess(`La caché "${cacheName}" está lista.`);
    } catch (error) {
      this.showError(error);
    }
  }

  protected async saveResource(): Promise<void> {
    try {
      const url = this.requireUrl();
      await this.storage.put(this.requireCacheName(), url, this.resourceContent);
      await this.refreshCaches();
      this.showSuccess('El contenido se guardó en la caché.');
    } catch (error) {
      this.showError(error);
    }
  }

  protected async fetchResource(): Promise<void> {
    try {
      const url = this.requireUrl();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`La solicitud respondió con estado ${response.status}.`);
      }

      await this.storage.put(this.requireCacheName(), url, response);
      await this.refreshCaches();
      this.showSuccess('La respuesta se descargó y guardó en la caché.');
    } catch (error) {
      this.showError(error);
    }
  }

  protected async consultResource(url = this.resourceUrl): Promise<void> {
    try {
      const response = await this.storage.get(this.requireCacheName(), url.trim());
      if (!response) {
        throw new Error('No se encontró una respuesta para esa URL.');
      }

      this.resourceUrl = url.trim();
      this.responseText = await response.text();
      this.responseStatus = response.status;
      this.responseStatusText = response.statusText;
      this.showSuccess('La respuesta se consultó desde la caché.');
    } catch (error) {
      this.showError(error);
    }
  }

  protected async deleteResource(url = this.resourceUrl): Promise<void> {
    try {
      const removed = await this.storage.delete(this.requireCacheName(), url.trim());
      if (!removed) {
        throw new Error('No se encontró ese recurso en la caché.');
      }

      this.responseText = null;
      this.responseStatus = null;
      await this.refreshCaches();
      this.showSuccess('El recurso se eliminó de la caché.');
    } catch (error) {
      this.showError(error);
    }
  }

  protected async deleteCache(cacheName = this.cacheName): Promise<void> {
    try {
      const removed = await this.storage.deleteCache(cacheName);
      if (!removed) {
        throw new Error(`No existe la caché "${cacheName}".`);
      }

      this.cacheName = 'showcase-cache';
      this.resources = [];
      this.responseText = null;
      this.responseStatus = null;
      await this.refreshCaches();
      this.showSuccess(`La caché "${cacheName}" se eliminó.`);
    } catch (error) {
      this.showError(error);
    }
  }

  protected async selectCache(cacheName: string): Promise<void> {
    this.cacheName = cacheName;
    this.responseText = null;
    this.responseStatus = null;
    try {
      await this.refreshResources();
      this.showSuccess(`Caché "${cacheName}" seleccionada.`);
    } catch (error) {
      this.showError(error);
    }
  }

  private async refreshCaches(): Promise<void> {
    this.cacheNames = await this.storage.listCaches();
    if (this.cacheNames.includes(this.cacheName)) {
      await this.refreshResources();
    } else {
      this.resources = [];
    }
    this.changeDetector.markForCheck();
  }

  private async refreshResources(): Promise<void> {
    this.resources = (await this.storage.keys(this.cacheName)).map((request) => request.url);
    this.changeDetector.markForCheck();
  }

  private requireCacheName(): string {
    const cacheName = this.cacheName.trim();
    if (!cacheName) {
      throw new Error('Selecciona o crea una caché antes de continuar.');
    }
    return cacheName;
  }

  private requireUrl(): string {
    const url = this.resourceUrl.trim();
    if (!url) {
      throw new Error('Ingresa la URL del recurso.');
    }
    try {
      new URL(url);
    } catch {
      throw new Error('Ingresa una URL absoluta válida, incluyendo https://.');
    }
    return url;
  }

  private showSuccess(message: string): void {
    this.feedback = { kind: 'success', message };
    this.changeDetector.markForCheck();
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
    this.changeDetector.markForCheck();
  }
}
