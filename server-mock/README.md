# LibraryHub — Plan B: API sin MongoDB

Backend alternativo de LibraryHub que utiliza un archivo `db.json` como
almacenamiento persistente. Su objetivo es permitir la ejecución completa
del frontend sin depender de una instancia de MongoDB, facilitando
demostraciones, pruebas y entornos donde no sea posible utilizar una base
de datos.

## Cuándo utilizarlo

Esta implementación resulta útil en escenarios como:

- Ejecución de la aplicación sin instalar o configurar MongoDB.
- Desarrollo y pruebas del frontend sin levantar el backend principal.
- Demostraciones o evaluaciones donde se requiera una configuración más
  simple.

El backend principal ubicado en `server/` continúa siendo la implementación
oficial del proyecto. Ambos backends son compatibles entre sí y pueden
utilizarse de forma intercambiable.

## Cómo ejecutarlo

```bash
cd server-mock
npm install
npm run dev          # http://localhost:5001
```

En una segunda terminal, iniciar el frontend:

```bash
cd "LibraryHub para ia"
npm run dev          # http://localhost:5173
```

Configurar el archivo `.env` ubicado en la raíz del frontend para utilizar
la siguiente URL:

```env
VITE_API_URL=http://localhost:5001/api
```

Una vez modificada la variable de entorno, reiniciar Vite para aplicar el
cambio.

## Volver al backend MongoDB

Para utilizar nuevamente el backend principal, configurar la variable
`VITE_API_URL` con la dirección correspondiente:

```env
VITE_API_URL=http://localhost:5000/api
```

Al compartir la misma `JWT_SECRET`, los tokens generados por cualquiera de
los dos backends son compatibles entre sí, por lo que no es necesario
iniciar sesión nuevamente al cambiar de una implementación a otra.

## Estructura del proyecto

```
server-mock/
├── package.json
├── index.js          (servidor Express + json-server)
├── db.json           (estado actual, se actualiza con el uso)
├── db.seed.json      (estado inicial utilizado por reset.js)
├── reset.js          (restaura el estado inicial)
├── middleware/auth.js
├── utils/format.js
├── .env.example
└── README.md
```

## Endpoints

Esta implementación expone los mismos endpoints que el backend basado en
MongoDB (`/api/auth/login`, `/api/libros`, `/api/prestamos`, etc.), además
de mantener el mismo formato de respuestas y los mismos mecanismos de
autenticación y autorización mediante JWT y roles.

## Restablecer los datos

Para restaurar el estado inicial de la base de datos local:

```bash
npm run reset
```

Este comando reemplaza `db.json` por `db.seed.json`. Una vez finalizado,
es necesario reiniciar el servidor para que los cambios sean aplicados.

## Limitaciones conocidas

- No incluye gestión de libros (alta, baja o modificación). El catálogo se
  mantiene fijo a partir de los datos iniciales.
- No permite registrar nuevos miembros ni modificar contraseñas.
- No incorpora funcionalidad para el pago de multas.
- Toda la información se almacena en `db.json`. Si este archivo se elimina
  o se corrompe, el servidor no podrá iniciarse hasta restaurar los datos
  mediante `npm run reset`.
- `json-server` expone las rutas CRUD (`GET`, `POST`, `PUT`, `PATCH` y
  `DELETE`) de las colecciones. Aunque el frontend no utiliza estas rutas,
  tampoco implementan la misma lógica de negocio que el backend principal.