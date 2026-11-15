 ## Storage Manager Project

Librería Angular para guardar información en el navegador sin usar directamente las API nativas de LocalStorage y Cache Storage. Incluye una aplicación Showcase que muestra su funcionamiento.

Proyecto de la asignatura Arquitectura de Software, Ingeniería de Sistemas, Facultad de Ingeniería, Unidad Central del Valle del Cauca (UCEVA), Tuluá, Valle del Cauca.

## Integrantes

- Santiago Santacruz Cuellar
- Juan Felipe Castro Marulanda

Docente: Jesús David Mejía Vergara

## Enlaces

- Repositorio: https://github.com/Felipe-Marulanda/Project-Store-Manager
- Showcase en ejecución: https://felipe-marulanda.github.io/Project-Store-Manager/

## Estructura del repositorio

- `projects/storage-manager`: código fuente de la librería (paquete `ngx-browser-storage-manager`).
- `projects/showcase`: aplicación Angular independiente que usa la librería a través de su API pública.

## La librería

La API pública está formada por dos servicios, un tipo de error y un token de configuración.

`LocalStorageService` guarda, consulta, actualiza, elimina, lista y limpia valores en LocalStorage. Los valores se serializan a JSON, por lo que se pueden guardar primitivos, objetos y arreglos. El prefijo de las claves se puede configurar con el token `STORAGE_KEY_PREFIX`.

`CacheStorageService` crea, lista y elimina cachés, y guarda, consulta y elimina recursos o respuestas HTTP dentro de ellas.

Todos los fallos se reportan con un único tipo de error, `StorageError`, que incluye un código y la operación que falló. Los códigos posibles son `invalid-data`, `not-found`, `quota-exceeded`, `unavailable` y `operation-failed`.

## Ejemplo de uso

```ts
import { Component, inject } from '@angular/core';
import {
  CacheStorageService,
  LocalStorageService,
  StorageError,
} from 'storage-manager';

@Component({
  selector: 'app-ejemplo',
  template: '',
})
export class EjemploComponent {
  private readonly local = inject(LocalStorageService);
  private readonly cache = inject(CacheStorageService);

  async probar(): Promise<void> {
    this.local.set('usuario', { nombre: 'Ana' });
    console.log(this.local.get('usuario'));

    try {
      this.local.update('no-existe', 1);
    } catch (error) {
      if (error instanceof StorageError) {
        console.log(error.code); // not-found
      }
    }

    await this.cache.put('c1', 'https://x.test/a', { id: 1 });
    const respuesta = await this.cache.get('c1', 'https://x.test/a');
    console.log(await respuesta?.json());
  }
}
```

Dentro del repositorio la librería se importa con el alias `storage-manager`, definido en `tsconfig.json`. El nombre del paquete es `ngx-browser-storage-manager`.

## Requisitos

- Node.js y npm
- Angular CLI

## Instalación de dependencias

```
npm install
```

## Comandos

Construir la librería (la salida queda en `dist/storage-manager`):

```
npm run build -- --project storage-manager
```

Revisar el contenido del paquete antes de publicarlo:

```
cd dist/storage-manager
npm pack --dry-run
```

Ejecutar el Showcase en local (http://localhost:4200):

```
npm start -- --project showcase
```

Construir el Showcase y ejecutar sus pruebas:

```
npm run build -- --project showcase
npm run test:showcase
```

Ejecutar las pruebas de la librería con cobertura:

```
npm run test:coverage
```

Generar la documentación técnica:

```
npm run docs
```

## Pruebas y documentación

La librería tiene 27 pruebas unitarias que cubren escenarios exitosos, errores y casos excepcionales de ambos servicios, con 100 % de cobertura.

La documentación técnica se genera con Compodoc a partir de comentarios TSDoc, con 100 % de cobertura de documentación. La carpeta `documentation/` no se versiona porque es salida de build; se reproduce con `npm run docs`.

## Control de versiones

Los commits siguen la convención Conventional Commits (`feat`, `docs`, `build`, `test`, `ci`, entre otros). El Showcase se despliega en GitHub Pages mediante un workflow de GitHub Actions.
