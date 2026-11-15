# Storage Manager

Librería Angular para trabajar con `LocalStorage` y `Cache Storage` mediante
servicios tipados, con un Showcase interactivo que demuestra sus operaciones
directamente en el navegador. No requiere backend.

Proyecto del curso de Arquitectura de Software (UCEVA).

## Enlaces

- Paquete en NPM: <https://www.npmjs.com/package/ngx-browser-storage-manager>
- Showcase en línea: <https://felipe-marulanda.github.io/Project-Store-Manager/>
- Repositorio: <https://github.com/Felipe-Marulanda/Project-Store-Manager>
- Guía de uso de la librería: [projects/storage-manager/README.md](./projects/storage-manager/README.md)

## Uso rápido

```bash
npm install ngx-browser-storage-manager
```

```ts
import { inject } from '@angular/core';
import { LocalStorageService } from 'ngx-browser-storage-manager';

const storage = inject(LocalStorageService);
storage.set('tema', 'oscuro');
storage.get<string>('tema'); // 'oscuro'
```

La guía completa (configuración del prefijo, todos los métodos de
`LocalStorageService` y `CacheStorageService`, ejemplos y manejo de errores)
está en el [README de la librería](./projects/storage-manager/README.md).

## Desarrollo

Requiere Node.js 24 o superior compatible con Angular 22 y npm.

```bash
npm ci
npm start -- --project showcase
```

| Comando                                      | Descripción                                         |
| -------------------------------------------- | --------------------------------------------------- |
| `npm start -- --project showcase`            | Ejecuta el Showcase                                 |
| `npm test`                                   | Prueba la librería                                  |
| `npm run test:coverage`                      | Prueba la librería con reporte de cobertura         |
| `npm run test:showcase`                      | Prueba el Showcase                                  |
| `npm run build -- --project storage-manager` | Construye la librería en `dist/storage-manager`     |
| `npm run build -- --project showcase`        | Construye el Showcase                               |
| `npm run docs`                               | Genera la documentación técnica en `documentation/` |
| `npm run docs:serve`                         | Genera y sirve la documentación                     |
| `npm run docs:coverage`                      | Falla si la documentación no está al 100 %          |

## Documentación técnica

La documentación se genera con [Compodoc](https://compodoc.app/) a partir de los
comentarios TSDoc. La carpeta `documentation/` no se versiona porque es salida
generada: ejecuta `npm run docs:serve` para verla.

## Estructura

```text
projects/
  storage-manager/  Librería de almacenamiento del navegador (se publica en NPM)
  showcase/         Aplicación Angular de demostración (consume el paquete de NPM)
.github/workflows/  Build, publicación y verificación de Pages
```

El workflow construye el proyecto `showcase` con base `/Project-Store-Manager/`,
copia `index.html` como `404.html` y verifica la respuesta HTTP 200 después del
despliegue.

## Convención de commits

Se usa Conventional Commits: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`,
`ci`, `build` y `style`. Mantén cada commit pequeño y enfocado.

## Licencia

[MIT](./LICENSE)
