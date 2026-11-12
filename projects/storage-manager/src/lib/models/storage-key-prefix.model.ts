import { InjectionToken } from '@angular/core';

export const STORAGE_KEY_PREFIX = new InjectionToken<string>('STORAGE_KEY_PREFIX', {
  providedIn: 'root',
  factory: () => '',
});
