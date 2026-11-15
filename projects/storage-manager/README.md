# ngx-browser-storage-manager

Librería Angular para guardar datos en **LocalStorage** y **Cache Storage** sin
usar directamente las API nativas del navegador. Ofrece servicios tipados,
errores consistentes y no necesita backend.

- Compatible con Angular 22 (`@angular/core` y `@angular/common` `^22.2.0`).
- Servicios inyectables (`providedIn: 'root'`), sin módulos que importar.
- Un solo tipo de error (`StorageError`) con un código que explica el motivo.
- Pruebas unitarias con 100 % de cobertura.

## Instalación

```bash
npm install ngx-browser-storage-manager
```

## Configuración

No necesitas configurar nada: inyecta el servicio y úsalo.

```ts
import { Component, inject } from '@angular/core';
import { LocalStorageService } from 'ngx-browser-storage-manager';

@Component({ selector: 'app-demo', template: '' })
export class DemoComponent {
  private readonly storage = inject(LocalStorageService);
}
```

### Prefijo de claves (opcional)

Con el token `STORAGE_KEY_PREFIX` todas las claves de `LocalStorageService`
llevan un prefijo. Es útil para separar tus datos de los de otras aplicaciones
del mismo origen. Por defecto no hay prefijo.

```ts
import { ApplicationConfig } from '@angular/core';
import { STORAGE_KEY_PREFIX } from 'ngx-browser-storage-manager';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: STORAGE_KEY_PREFIX, useValue: 'mi-app:' }],
};
```

Con el prefijo anterior, `storage.set('tema', 'oscuro')` guarda la clave
`mi-app:tema`, pero tú sigues usando solo `tema`.

## LocalStorageService

Guarda valores como JSON, así que acepta textos, números, booleanos, objetos y
arreglos.

| Método                    | Qué hace                                                   |
| ------------------------- | ---------------------------------------------------------- |
| `set(key, value)`         | Guarda un valor (si la clave existe, la sobrescribe).      |
| `get(key, defaultValue?)` | Devuelve el valor, `defaultValue` si no existe, o `null`.  |
| `update(key, value)`      | Reemplaza el valor de una clave que ya existe.             |
| `remove(key)`             | Elimina una clave (no falla si no existe).                 |
| `clear()`                 | Elimina las claves del prefijo (o todo si no hay prefijo). |
| `has(key)`                | Devuelve `true` si la clave existe.                        |
| `keys()`                  | Lista las claves guardadas (sin el prefijo).               |

```ts
const storage = inject(LocalStorageService);

// Guardar
storage.set('usuario', { nombre: 'Ana', edad: 28 });
storage.set('contador', 1);

// Consultar (con tipo)
const usuario = storage.get<{ nombre: string; edad: number }>('usuario');
const tema = storage.get<string>('tema', 'claro'); // 'claro' si no existe
const ausente = storage.get('no-existe'); // null

// Actualizar (la clave debe existir)
storage.update('contador', 2);

// Consultar existencia y claves
storage.has('contador'); // true
storage.keys(); // ['usuario', 'contador']

// Eliminar
storage.remove('contador');
storage.clear();
```

## CacheStorageService

Administra cachés y recursos. Todas las operaciones devuelven `Promise`. Cada
recurso se identifica con una URL (`request`).

| Método                           | Qué hace                                                      |
| -------------------------------- | ------------------------------------------------------------- |
| `open(cacheName)`                | Abre un caché; si no existe, lo crea.                         |
| `createCache(cacheName)`         | Crea un caché vacío.                                          |
| `listCaches()`                   | Lista los nombres de los cachés.                              |
| `hasCache(cacheName)`            | Indica si el caché existe.                                    |
| `put(cacheName, request, value)` | Guarda un recurso (lo reemplaza si ya existe).                |
| `get(cacheName, request)`        | Devuelve la `Response` guardada, o `null`.                    |
| `has(cacheName, request)`        | Indica si el recurso existe.                                  |
| `delete(cacheName, request)`     | Elimina un recurso; devuelve `true` si existía.               |
| `keys(cacheName)`                | Lista las peticiones guardadas (vacío si el caché no existe). |
| `deleteCache(cacheName)`         | Elimina un caché completo; devuelve `true` si existía.        |
| `clear()`                        | Elimina todos los cachés.                                     |

`put` acepta una `Response`, un `string` (se guarda como texto) o cualquier
valor serializable (número, booleano, `null`, objeto o arreglo), que se guarda
como JSON.

```ts
const cache = inject(CacheStorageService);

// Crear y listar cachés
await cache.createCache('productos');
await cache.listCaches(); // ['productos']
await cache.hasCache('productos'); // true

// Guardar recursos
await cache.put('productos', '/api/productos/1', { id: 1, nombre: 'Café' });
await cache.put('productos', '/notas.txt', 'texto plano');

// Consultar
const respuesta = await cache.get('productos', '/api/productos/1');
const producto = await respuesta?.json(); // { id: 1, nombre: 'Café' }
await cache.has('productos', '/notas.txt'); // true
await cache.keys('productos'); // lista de Request

// Eliminar
await cache.delete('productos', '/notas.txt'); // true
await cache.deleteCache('productos'); // true
await cache.clear(); // elimina todos los cachés
```

## Manejo de errores

Cualquier fallo se lanza como `StorageError`. Revisa `error.code` para saber el
motivo y `error.operation` para saber qué operación falló.

| Código             | Cuándo ocurre                                                       |
| ------------------ | ------------------------------------------------------------------- |
| `invalid-data`     | El valor no se puede serializar o lo guardado no es JSON válido.    |
| `not-found`        | Se intentó `update` sobre una clave que no existe.                  |
| `quota-exceeded`   | El navegador no tiene más espacio disponible.                       |
| `unavailable`      | LocalStorage o Cache Storage no existe en este entorno.             |
| `operation-failed` | Falló la API nativa por otro motivo (el original queda en `cause`). |

```ts
import { StorageError } from 'ngx-browser-storage-manager';

try {
  storage.update('no-existe', 1);
} catch (error) {
  if (error instanceof StorageError && error.code === 'not-found') {
    storage.set('no-existe', 1);
  } else {
    throw error;
  }
}
```

## API pública

`LocalStorageService`, `CacheStorageService`, `StorageError`, `StorageErrorCode`,
`CachePutValue` y `STORAGE_KEY_PREFIX`. Nada más se exporta.

## Desarrollo

Estos comandos se ejecutan en el repositorio del proyecto:

| Comando                                      | Descripción                                           |
| -------------------------------------------- | ----------------------------------------------------- |
| `npm test`                                   | Ejecuta las pruebas de la librería.                   |
| `npm run test:coverage`                      | Ejecuta las pruebas con reporte de cobertura (100 %). |
| `npm run build -- --project storage-manager` | Construye la librería en `dist/storage-manager`.      |
| `npm run docs`                               | Genera la documentación técnica con Compodoc.         |
| `npm run docs:serve`                         | Genera y sirve la documentación en el navegador.      |

## Enlaces

- Showcase: <https://felipe-marulanda.github.io/Project-Store-Manager/>
- Repositorio: <https://github.com/Felipe-Marulanda/Project-Store-Manager>

## Licencia

[MIT](./LICENSE)
