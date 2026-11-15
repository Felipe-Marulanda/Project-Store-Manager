import { InjectionToken } from '@angular/core';

/**
 * Token de inyección con el prefijo que `LocalStorageService` antepone a todas
 * sus claves. Sirve para separar los datos de una aplicación de los de otras que
 * comparten el mismo origen. Por defecto es una cadena vacía (sin prefijo).
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [{ provide: STORAGE_KEY_PREFIX, useValue: 'mi-app:' }],
 * });
 * ```
 */
export const STORAGE_KEY_PREFIX = new InjectionToken<string>('STORAGE_KEY_PREFIX', {
  providedIn: 'root',
  factory: () => '',
});
