<div align="center">

# 📚 LibraryHub

**Sistema de gestión para una biblioteca digital municipal**

![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/uso-académico-lightgrey)

</div>

---

## Descripción

LibraryHub es una aplicación web para la gestión de préstamos, reservas y
multas de una biblioteca municipal. Nació como proyecto académico —el
enunciado original pedía únicamente el frontend de consulta— pero evolucionó
hacia un sistema completo: incluye un backend propio con autenticación por
roles, un panel de administración para bibliotecarios y un backend
alternativo que permite ejecutar todo el sistema sin necesidad de instalar
una base de datos.

El proyecto está pensado para que **dos tipos de usuario** lo usen de forma
distinta:

| Rol               | Puede hacer                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Miembro**       | Buscar libros, solicitar préstamos, reservar ejemplares, renovar préstamos y revisar sus multas.                    |
| **Bibliotecario** | Todo lo anterior, además de registrar devoluciones, ver métricas generales y administrar el directorio de miembros. |

---

## Tabla de contenidos

- [Vistas principales](#vistas-principales)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha](#puesta-en-marcha)
  - [1. Frontend](#1-frontend)
  - [2. Backend](#2-backend-elegir-una-opción)
- [Credenciales de prueba](#credenciales-de-prueba)
- [Funcionalidades](#funcionalidades)
- [Autenticación y autorización](#autenticación-y-autorización)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Alcance y decisiones de diseño](#alcance-y-decisiones-de-diseño)

---

## Vistas principales

| #   | Vista                | Descripción                                                                 |
| --- | -------------------- | --------------------------------------------------------------------------- |
| 1   | **Login**            | Autenticación mediante cédula y contraseña.                                 |
| 2   | **Buscar libros**    | Catálogo completo, con búsqueda por texto y filtro por categoría.           |
| 3   | **Detalle de libro** | Disponibilidad de ejemplares, solicitud de préstamo o reserva.              |
| 4   | **Mi perfil**        | Préstamos activos, estado de vencimiento, renovaciones y multas pendientes. |
| 5   | **Mis reservas**     | Reservas activas y posición en la cola de espera.                           |

Adicionalmente, el rol de **bibliotecario** tiene acceso a un panel de
administración con métricas y gestión operativa (ver
[Funcionalidades](#funcionalidades)).

---

## Arquitectura

El frontend se comunica con el backend exclusivamente mediante una API REST
autenticada con JWT. La base de datos nunca es accedida directamente desde
el navegador.

```
┌──────────────────────┐        HTTPS · fetch + JWT        ┌───────────────────────┐
│                       │ ────────────────────────────────▶ │                       │
│      Frontend         │                                    │       Backend         │
│   React + Vite        │ ◀──────────────────────────────── │  server/  o           │
│  (localhost:5173)     │           JSON de respuesta         │  server-mock/         │
│                       │                                    │                       │
└───────────────────────┘                                    └───────────┬───────────┘
                                                                           │
                                                    ┌──────────────────────┴──────────────────────┐
                                                    │                                              │
                                        server/ (Express + Mongoose)              server-mock/ (Express + json-server)
                                                    │                                              │
                                                    ▼                                              ▼
                                             MongoDB local                              server-mock/db.json
                                          (localhost:27017)                             (archivo plano en disco)
```

El frontend **desconoce por completo** qué backend tiene enfrente: ambos
implementan el mismo contrato de API (mismas rutas, mismo formato de
respuesta, mismos tokens JWT), por lo que alternar entre uno y otro es
cuestión de cambiar una única variable de entorno, sin tocar código.

- **`server/`** — backend principal. Express + Mongoose sobre MongoDB.
  Es el que se usa para el desarrollo y la entrega formal del proyecto.
- **`server-mock/`** — backend alternativo ("Plan B"). Implementa el mismo
  contrato de API sobre [json-server](https://github.com/typicode/json-server),
  persistiendo en un archivo `db.json`. Permite levantar el sistema completo
  sin instalar ni configurar MongoDB, útil para pruebas rápidas o demos.

### Ciclo de vida de una petición

Ejemplo: un miembro solicita un préstamo desde la vista de detalle de libro.

```
1.  El usuario hace clic en "Solicitar préstamo".
2.  El componente llama a solicitarPrestamo(libroId)   → src/data/apiService.js
3.  apiService.js arma la petición:
      POST /api/prestamos
      Header: Authorization: Bearer <token JWT>
      Body:   { libro_id }
4.  El servidor Express recibe la petición.
5.  El middleware verifyToken valida el JWT y expone al usuario en req.user,
    de modo que el backend sabe qué miembro realiza la solicitud sin que el
    frontend deba enviarlo explícitamente.
6.  El router de préstamos valida disponibilidad y calcula la fecha de
    devolución (dos semanas por defecto).
7.  El préstamo se persiste en la base de datos correspondiente:
      • server/       → Prestamo.create({ ... })   → MongoDB
      • server-mock/  → se agrega al arreglo en memoria → se escribe db.json
8.  El backend responde con el préstamo creado en formato JSON.
9.  El frontend actualiza la interfaz y muestra una notificación de éxito.
```

---

## Stack tecnológico

| Capa                    | Tecnologías                                                 |
| ----------------------- | ----------------------------------------------------------- |
| **Frontend**            | React 19 · Vite · React Router · Tailwind CSS · Heroicons   |
| **Backend principal**   | Node.js · Express · Mongoose · JSON Web Tokens · bcrypt     |
| **Backend alternativo** | Node.js · Express · json-server                             |
| **Base de datos**       | MongoDB (o un archivo JSON local, según el backend elegido) |
| **Calidad de código**   | oxlint                                                      |

---

## Estructura del repositorio

```
LibraryHub/
├── src/                            # Frontend (React + Vite)
│   ├── main.jsx                    # Punto de entrada de la aplicación
│   ├── App.jsx                     # Definición de rutas
│   ├── components/
│   │   ├── layout/                 # Barra lateral, navegación, cabecera de usuario
│   │   └── ui/                     # Componentes de interfaz reutilizables
│   ├── context/
│   │   └── AuthContext.jsx         # Estado global de sesión (usuario + token)
│   ├── data/
│   │   ├── apiService.js           # Única capa que se comunica con el backend
│   │   └── utils.js                # Formateo de fechas, montos y estado de préstamos
│   ├── hooks/                      # Hooks personalizados (notificaciones, etc.)
│   └── pages/
│       ├── Login/
│       ├── Libros/                 # Vista "Buscar libros"
│       ├── LibroDetalle/
│       ├── MiPerfil/
│       ├── MisReservas/
│       └── Bibliotecario/          # Panel de administración
│
├── server/                         # Backend principal (Express + MongoDB)
│   ├── index.js                    # Arranque del servidor y montaje de rutas
│   ├── config/db.js                # Conexión a MongoDB
│   ├── models/                     # Esquemas de Mongoose
│   ├── routes/                     # Un router por recurso de la API
│   ├── middleware/auth.js          # Verificación de JWT y de roles
│   └── seed.js                     # Carga de datos de ejemplo
│
├── server-mock/                    # Backend alternativo (sin MongoDB)
│   ├── index.js                    # Mismo contrato de API, sobre json-server
│   ├── db.json                     # Base de datos como archivo plano
│   ├── db.seed.json                # Copia de respaldo para restaurar db.json
│   └── reset.js                    # Restaura db.json a su estado inicial
│
├── example.env                     # Plantilla de variables de entorno
└── package.json
```

---

## Puesta en marcha

### Requisitos previos

- Node.js 18 o superior
- MongoDB en ejecución local — **solo** si se utilizará `server/`
  (no es necesario si se opta por `server-mock/`)

### 1. Frontend

```bash
npm install
cp example.env .env      # ajustar VITE_API_URL según el backend elegido
npm run electron:dev            # disponible en http://localhost:5173
###agregar carpeta del proyecto a exclusiones de windows defender para uso exitoso de electron
```

### 2. Backend: elegir una opción

<details>
<summary><strong>Opción A — Backend principal (Express + MongoDB)</strong></summary>

```bash
cd server
npm install
cp .env.example .env      # completar MONGODB_URI y JWT_SECRET
npm run seed               # carga datos de ejemplo (una sola vez)
npm run dev                 # disponible en http://localhost:5000
```

En el `.env` del frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

</details>

<details>
<summary><strong>Opción B — Backend alternativo (sin MongoDB)</strong></summary>

```bash
cd server-mock
npm install
npm run dev                 # disponible en http://localhost:5001
```

En el `.env` del frontend:

```env
VITE_API_URL=http://localhost:5001/api
```

</details>

> Ambos backends comparten la misma clave `JWT_SECRET` por defecto, por lo
> que un token emitido por uno es válido en el otro. Es posible alternar
> `VITE_API_URL` y reiniciar el frontend sin necesidad de volver a iniciar
> sesión.

---

## Credenciales de prueba

| Rol           | Cédula     | Contraseña |
| ------------- | ---------- | ---------- |
| Miembro       | `12345678` | `12345678` |
| Miembro       | `23456789` | `23456789` |
| Bibliotecario | `00000001` | `admin`    |

La pantalla de inicio de sesión incluye un panel con estas credenciales:
un clic sobre cualquiera de ellas completa el formulario automáticamente.

---

## Funcionalidades

**Para miembros**

- Búsqueda de libros por título, autor o ISBN
- Filtrado del catálogo por categoría
- Disponibilidad de ejemplares en tiempo real
- Solicitud de préstamos
- Reserva de libros sin ejemplares disponibles, con posición en la cola
- Renovación de préstamos (hasta **dos renovaciones** por préstamo)
- Consulta de multas pendientes
- Indicadores visuales de vencimiento (verde, amarillo, rojo)

**Para el bibliotecario**

- Panel con métricas generales (préstamos activos, vencidos, reservas, multas)
- Registro de devoluciones, con generación automática de multas por atraso
- Vista consolidada de todas las reservas activas
- Vista consolidada de todas las multas pendientes
- Directorio de miembros con su estado (activo / inactivo)

---

## Autenticación y autorización

El inicio de sesión (`POST /api/auth/login`) valida la cédula y la
contraseña, y en caso exitoso retorna un **JSON Web Token** firmado con
`JWT_SECRET`, junto con los datos del usuario. Ese token:

1. Se almacena en `localStorage` para persistir entre recargas del navegador.
2. Se adjunta automáticamente en cada petición posterior mediante el
   encabezado `Authorization: Bearer <token>`.
3. Es validado en el backend por el middleware `verifyToken`, y las rutas
   exclusivas del bibliotecario están además protegidas por
   `requireRole('bibliotecario')`.

El sistema no contempla registro de nuevas cuentas desde el frontend: los
miembros y el bibliotecario ya existen en la base de datos, cargados a través
de `server/seed.js` o `server-mock/db.seed.json`.

---

## Variables de entorno

**Frontend** (`.env` en la raíz del proyecto)

| Variable       | Descripción                                                    |
| -------------- | -------------------------------------------------------------- |
| `VITE_API_URL` | URL base de la API. Determina qué backend consume el frontend. |

**`server/.env`**

| Variable      | Descripción                                                       |
| ------------- | ----------------------------------------------------------------- |
| `MONGODB_URI` | Cadena de conexión a la instancia de MongoDB.                     |
| `JWT_SECRET`  | Clave utilizada para firmar y verificar los tokens JWT.           |
| `PORT`        | Puerto en el que escucha el servidor Express (por defecto, 5000). |

**`server-mock/.env`** _(opcional; cuenta con valores por defecto)_

| Variable     | Descripción                                                                  |
| ------------ | ---------------------------------------------------------------------------- |
| `JWT_SECRET` | Debe coincidir con la de `server/` para que los tokens sean intercambiables. |
| `PORT`       | Puerto del servidor (por defecto, 5001).                                     |

---

## Scripts disponibles

**Frontend**

| Comando           | Descripción                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Servidor de desarrollo (Vite)           |
| `npm run build`   | Genera el build de producción           |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint`    | Analiza el código con oxlint            |

**`server/`**

| Comando         | Descripción                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Servidor con recarga automática (nodemon) |
| `npm run start` | Inicia el servidor                        |
| `npm run seed`  | Carga datos de ejemplo en MongoDB         |

**`server-mock/`**

| Comando         | Descripción                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Inicia el servidor                     |
| `npm run reset` | Restaura `db.json` a su estado inicial |

---

## Alcance del proyecto

El sistema está compuesto por dos módulos con responsabilidades distintas:

- Un **módulo de miembros**, correspondiente a las cinco vistas centrales
  (login, catálogo, detalle de libro, perfil y reservas).
- Un **módulo administrativo**, exclusivo del rol de bibliotecario, con
  funciones de gestión operativa sobre préstamos, reservas, multas y el
  directorio de miembros.

Ambos módulos comparten la misma base de autenticación y el mismo backend,
descrito en la sección [Arquitectura](#arquitectura).

---

## Ejecutar con Electron

Este proyecto ahora incluye Electron para abrir la app React como aplicacion de escritorio.

### Instalar dependencias

```bash
npm install
```

### Ejecutar en modo desarrollo

```bash
npm run electron:dev
```

Este comando levanta Vite en `http://localhost:5173` y luego abre la ventana de Electron.

### Probar version compilada

```bash
npm run electron:build
```

Este comando crea la carpeta `dist` con Vite y Electron carga el archivo `dist/index.html`.

### Archivos agregados para Electron

- `electron/main.cjs`: proceso principal de Electron y configuracion de la ventana.
- `electron/preload.cjs`: archivo preload seguro para futuras funciones IPC.

### Cambios importantes

- Se agrego `main` en `package.json` apuntando a `electron/main.cjs`.
- Se agregaron los scripts `electron:dev` y `electron:build`.
- Se cambio `BrowserRouter` por `HashRouter` para que las rutas funcionen al compilar y abrir la app desde Electron.
- Se agrego `base: './'` en `vite.config.js` para que los assets carguen correctamente en escritorio.
