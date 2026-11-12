import { Routes } from '@angular/router';
import { CacheStoragePage } from './pages/cache-storage/cache-storage.page';
import { HomePage } from './pages/home/home.page';
import { LocalStoragePage } from './pages/local-storage/local-storage.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Inicio | Storage Manager' },
  {
    path: 'local-storage',
    component: LocalStoragePage,
    title: 'LocalStorage | Storage Manager',
  },
  {
    path: 'cache-storage',
    component: CacheStoragePage,
    title: 'Cache Storage | Storage Manager',
  },
  { path: '**', redirectTo: '' },
];
