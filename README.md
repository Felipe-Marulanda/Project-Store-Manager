# Storage Manager

Librería Angular para trabajar con `LocalStorage` y `Cache Storage`, con un
showcase interactivo que demuestra sus operaciones directamente en el navegador.
No requiere backend.

## Aplicación

- URL de Pages configurada para el showcase: <https://felipe-marulanda.github.io/Project-Store-Manager/>
- Repositorio: <https://github.com/Felipe-Marulanda/Project-Store-Manager>

## Instalación y comandos

Requiere Node.js 24 o superior compatible con Angular 22 y npm.

```bash
npm ci
npm start -- --project showcase
```

| Comando                                      | Descripción                            |
| -------------------------------------------- | -------------------------------------- |
| `npm start -- --project showcase`            | Ejecuta el showcase                    |
| `npm test`                                   | Prueba la librería                     |
| `npm run test:showcase`                      | Prueba el showcase                     |
| `npm run build -- --project storage-manager` | Construye la librería                  |
| `npm run build -- --project showcase`        | Construye el showcase tras la librería |

## Estructura

```text
projects/
  storage-manager/  Librería de almacenamiento del navegador
  showcase/         Aplicación Angular de demostración
.github/workflows/  Build, publicación y verificación de Pages
```

El workflow construye el proyecto `showcase` con base `/Project-Store-Manager/`,
copia `index.html` como `404.html` y verifica la respuesta HTTP 200 después del
despliegue.

## Convención de commits

Se usa Conventional Commits: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`,
`ci`, `build` y `style`. Mantén cada commit pequeño y enfocado.
