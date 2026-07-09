<div align="center">

# 📚 LibraryHub

**Sistema de gestión para una biblioteca digital municipal**

![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Electron](https://img.shields.io/badge/Electron-43-47848F?logo=electron&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/uso-académico-lightgrey)

</div>

---

## Descripción

LibraryHub es una aplicación para la gestión de préstamos, reservas y
multas de una biblioteca municipal, construida con React y MongoDB.
Puede ejecutarse de **dos formas**, sin perder ninguna funcionalidad:

- Como **aplicación de escritorio**, dentro de Electron.
- Como **aplicación web**, en cualquier navegador, servida por una API
  Express.

El proyecto está pensado para que **dos tipos de usuario** lo usen de
forma distinta:

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
- [Credenciales de prueba](#credenciales-de-prueba)
- [Funcionalidades](#funcionalidades)
- [Autenticación y autorización](#autenticación-y-autorización)
- [Endpoints HTTP (modo web)](#endpoints-http-modo-web)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Solución de problemas](#solución-de-problemas)
- [Documentación adicional](#documentación-adicional)

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

Toda la lógica de negocio (validaciones, cálculo de fechas, reglas de
préstamos y reservas) vive en `server/services/`, independiente de
cómo se accede a ella. Dos capas distintas exponen esos mismos
services, y el frontend elige automáticamente cuál usar:

```
                         ┌───────────────────────┐
                         │  Renderer (React)      │
                         │  pages → apiService.js │
                         └───────────┬───────────┘
                                     │
                     ¿existe window.libraryHub?
                                     │
              ┌──────────────────────┴──────────────────────┐
              │ sí (Electron)                     no (navegador) │
              ▼                                              ▼
   ┌──────────────────────┐                     ┌──────────────────────┐
   │  preload.cjs           │                     │  fetch()               │
   │  contextBridge          │                     │  header x-session-token│
   └──────────┬───────────┘                     └──────────┬───────────┘
              │ ipcRenderer.invoke('canal')                 │ HTTP :3000/api/...
              ▼                                              ▼
   ┌──────────────────────┐                     ┌──────────────────────┐
   │  electron/main.cjs      │                     │  server/index.js        │
   │  ipcMain.handle(canal)  │                     │  Express + sesion-http  │
   └──────────┬───────────┘                     └──────────┬───────────┘
              │                                              │
              └──────────────────┬───────────────────────────┘
                                 ▼
                     server/services/*.js
                  (login, libros, préstamos,
                   reservas, multas, miembros)
                                 │ Mongoose
                                 ▼
                              MongoDB
                    mongodb://localhost:27017/libraryhub
```

`apiService.js` detecta el entorno con una sola función
(`isElectron()`, que comprueba si `window.libraryHub` existe) y expone
las mismas funciones sin importar el modo. Las páginas de React
(`Login`, `Libros`, `LibroDetalle`, `MiPerfil`, `MisReservas`,
`Bibliotecario`) llaman siempre a `apiService.js` y no necesitan saber
en qué modo están corriendo.

### Ciclo de vida de una acción

Ejemplo: un miembro solicita un préstamo desde la vista de detalle de
libro.

**En modo escritorio (Electron):**
```
1.  El usuario hace clic en "Solicitar préstamo".
2.  El componente llama a solicitarPrestamo(libroId)  → src/data/apiService.js
3.  apiService.js ejecuta window.libraryHub.solicitarPrestamo(libroId)
4.  preload.cjs lo traduce a ipcRenderer.invoke('prestamos:solicitar', libroId)
5.  main.cjs recibe la llamada en el handler 'prestamos:solicitar',
    resuelve getUsuarioActual() y llama a prestamosService.solicitarPrestamo(...)
6.  El service valida la sesión, busca el libro, descuenta una copia,
    crea el préstamo en MongoDB y devuelve { ok: true, mensaje, prestamo }
7.  main.cjs devuelve ese objeto al renderer.
8.  apiService.js se lo entrega al componente, que muestra el toast.
```

**En modo web (navegador):**
```
1.  El usuario hace clic en "Solicitar préstamo".
2.  El componente llama a solicitarPrestamo(libroId)  → src/data/apiService.js
3.  apiService.js hace POST http://localhost:3000/api/prestamos/solicitar
    con el header x-session-token
4.  server/index.js carga al usuario asociado a ese token
    (sesion-http.js) y llama a prestamosService.solicitarPrestamo(...)
5.  El service ejecuta exactamente la misma lógica que en modo Electron
6.  El servidor responde { ok: true, mensaje, prestamo } como JSON
7.  apiService.js se lo entrega al componente, que muestra el toast.
```

El paso 5 de ambos flujos es **el mismo código**: ni las validaciones
ni las reglas de negocio se duplican entre modos.

---

## Stack tecnológico

| Capa                    | Tecnologías                                                |
| ------------------------ | ----------------------------------------------------------- |
| **Frontend**              | React 19 · Vite · React Router · Tailwind CSS · Heroicons   |
| **Modo escritorio**       | Electron 43 (proceso principal + preload)                   |
| **Modo web**              | Express 5 · cors                                             |
| **Backend (compartido)** | Node.js · Mongoose · bcrypt · dotenv                         |
| **Base de datos**         | MongoDB (instancia local en `localhost:27017/libraryhub`)   |
| **Calidad**               | oxlint                                                       |

---

## Estructura del repositorio

```
LibraryHub/
├── src/                            # Frontend (React + Vite)
│   ├── main.jsx                    # Punto de entrada de la aplicación
│   ├── App.jsx                     # Definición de rutas
│   ├── components/
│   │   ├── layout/                 # Barra lateral, navegación, cabecera
│   │   ├── ui/                     # Componentes reutilizables
│   │   └── bibliotecario/          # Tabs del panel del bibliotecario
│   ├── context/
│   │   └── AuthContext.jsx         # Estado de sesión del usuario
│   ├── data/
│   │   ├── apiService.js           # Detecta Electron vs web (IPC o fetch)
│   │   └── utils.js                # Formateo de fechas, montos y estados
│   ├── hooks/                      # Hooks personalizados
│   └── pages/                      # Pantallas de la aplicación
│
├── server/
│   ├── index.js                    # Servidor Express (modo web)
│   ├── config/db.js                # conectarDB() (Mongoose)
│   ├── middleware/
│   │   └── sesion-http.js          # Tokens de sesión en memoria (modo web)
│   ├── models/                     # Esquemas de Mongoose
│   ├── services/                   # Lógica de negocio, compartida por ambos modos
│   │   ├── auth.service.js         # login(), restaurarSesion()
│   │   ├── sesion.service.js       # get/setUsuarioActual, requerirSesion/Rol
│   │   ├── categorias.service.js
│   │   ├── libros.service.js
│   │   ├── prestamos.service.js
│   │   ├── reservas.service.js
│   │   ├── multas.service.js
│   │   ├── exchange.service.js     # Conversión a CLP vía API Frankfurter
│   │   └── miembros.service.js
│   ├── utils/format.js             # toDate() y helpers de formato
│   ├── seed.js                     # Carga datos de ejemplo
│   └── .env                        # MONGODB_URI y PORT (ignorado por git)
│
├── electron/                       # Proceso principal de Electron (modo escritorio)
│   ├── main.cjs                    # Crea la ventana y registra los canales IPC
│   └── preload.cjs                 # Expone window.libraryHub al renderer
│
└── package.json                    # Dependencias y scripts
```

---

## Puesta en marcha

### Requisitos previos

- Node.js 18 o superior
- MongoDB en ejecución local (`mongodb://localhost:27017`)
- ~150 MB de espacio libre si vas a usar el modo escritorio (binario de Electron)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la URI de MongoDB

```bash
# Crear server/.env con la URI de tu instancia local
cp server/.env.example server/.env    # solo si el archivo no existe
```

Editar `server/.env` y dejar como mínimo:

```env
MONGODB_URI=mongodb://localhost:27017/libraryhub
```

> El archivo `server/.env` no se commitea (está en `.gitignore`).

### 3. Cargar datos de ejemplo (una sola vez)

```bash
npm run seed
```

Esto borra y recrea todas las colecciones con libros, miembros y
préstamos de demostración. Las credenciales quedan impresas al
finalizar.

### 4. Ejecutar la aplicación

Elegí una de las dos opciones — ambas usan los mismos datos y las
mismas credenciales.

<details>
<summary><strong>Opción A — Modo escritorio (Electron)</strong></summary>

```bash
npm run electron:dev
```

Levanta Vite en `http://localhost:5173` y, en cuanto detecta que está
respondiendo, abre la ventana de Electron cargando esa URL.

Para probar el build de producción (sin Vite en el medio):

```bash
npm run electron:build
```

Compila el frontend a `dist/` y abre Electron apuntando a esos
archivos estáticos.

> **Nota sobre Windows Defender:** durante el desarrollo es posible
> que el antivirus demore o bloquee la primera ejecución de Electron.
> Agregar la carpeta del proyecto a las exclusiones de Windows
> Defender suele resolverlo.

</details>

<details>
<summary><strong>Opción B — Modo web (navegador)</strong></summary>

```bash
npm run dev:web
```

Levanta en paralelo el servidor Express en `http://localhost:3000`
(la API) y Vite en `http://localhost:5173` (el frontend). Abrí el
navegador en `http://localhost:5173`.

Para verificar que la API está viva sin abrir el navegador:

```bash
curl http://localhost:3000/api/health
```

</details>

---

## Credenciales de prueba

| Rol           | Cédula     | Contraseña |
| ------------- | ---------- | ---------- |
| Miembro       | `12345678` | `12345678` |
| Bibliotecario | `00000001` | `admin`    |

En el modo escritorio, la pantalla de inicio de sesión incluye un
panel con estas credenciales: un clic sobre cualquiera de ellas
completa el formulario automáticamente.

---

## Funcionalidades

**Para miembros**

- Búsqueda de libros por título, autor o ISBN
- Filtrado del catálogo por categoría
- Disponibilidad de ejemplares en tiempo real
- Solicitud de préstamos
- Reserva de libros sin ejemplares disponibles, con posición en la cola
- Renovación de préstamos (hasta **dos renovaciones** por préstamo)
- Consulta de multas pendientes (convertidas a CLP mediante la API
  pública Frankfurter)
- Indicadores visuales de vencimiento (verde, amarillo, rojo)

**Para el bibliotecario**

- Panel con métricas generales (préstamos activos, vencidos, reservas, multas)
- Registro de devoluciones, con generación automática de multas por atraso
- Vista consolidada de todas las reservas activas
- Vista consolidada de todas las multas pendientes
- Directorio de miembros con su estado (activo / inactivo)

---

## Autenticación y autorización

Los `services/` de `server/` acceden a la sesión a través de
`server/services/sesion.service.js`, que expone `getUsuarioActual()`,
`setUsuarioActual()`, `requerirSesion()` (lanza error si no hay nadie
logueado) y `requerirRol('bibliotecario')` (lanza error si el rol no
coincide). Ambos modos usan estas mismas funciones — lo único que
cambia es **quién** llama a `setUsuarioActual()` y **cuándo**:

- **Modo escritorio:** `usuarioActual` es una variable en memoria del
  proceso principal de Electron, seteada por `auth.service.js` al
  hacer login y mantenida mientras la app está abierta.
- **Modo web:** `server/middleware/sesion-http.js` mantiene un `Map`
  de tokens en memoria del servidor. Cada request pasa por
  `sesionMiddleware`, que carga al usuario asociado al token del
  header `x-session-token` en `usuarioActual` antes de ejecutar el
  endpoint, y lo limpia después.

En ambos casos, `src/context/AuthContext.jsx` guarda al usuario en
`localStorage` (clave `libraryhub_user`) para que la sesión persista
entre reinicios.

### Restauración de sesión al abrir la app

Al montar `AuthProvider`, si hay un usuario guardado en `localStorage`,
se dispara `restaurarSesion(userId)`: vuelve a buscar al miembro por su
id, confirma que siga activo, y sincroniza la sesión del backend
(`usuarioActual` en Electron, o un nuevo token en modo web) con lo que
el renderer ya tenía guardado.

Mientras esa sincronización está en curso, `AuthContext` expone
`sesionLista: false`, y `RequireAuth` (en `App.jsx`) muestra un
spinner en lugar de montar la página protegida — así ninguna página
dispara pedidos antes de que el backend sepa quién está logueado.

Si la restauración falla (la cuenta ya no existe o fue suspendida), la
sesión se cierra localmente.

---

## Endpoints HTTP (modo web)

Solo aplican cuando la app corre con `npm run dev:web`. En modo
Electron, la comunicación es por IPC y no expone ningún puerto.

| Método | Ruta                                    | Descripción                             |
| ------ | ---------------------------------------- | ---------------------------------------- |
| `GET`  | `/api/health`                            | Health check                             |
| `POST` | `/api/auth/login`                        | Login (body: `{ cedula, password }`)     |
| `POST` | `/api/auth/restaurar-sesion`             | Restaurar sesión (body: `{ userId }`)    |
| `POST` | `/api/auth/logout`                       | Cerrar sesión                            |
| `GET`  | `/api/categorias`                        | Listar categorías                        |
| `GET`  | `/api/libros?busqueda=&categoria_id=`    | Buscar libros                            |
| `GET`  | `/api/libros/:id`                        | Detalle de un libro                      |
| `GET`  | `/api/prestamos/mis-activos`             | Préstamos activos del usuario            |
| `GET`  | `/api/prestamos/todos`                   | Todos los préstamos (bibliotecario)      |
| `POST` | `/api/prestamos/solicitar`               | Solicitar préstamo (body: `{ libro_id }`)|
| `POST` | `/api/prestamos/:id/renovar`             | Renovar préstamo                         |
| `POST` | `/api/prestamos/:id/devolver`            | Registrar devolución                     |
| `GET`  | `/api/reservas/mis-reservas`             | Reservas del usuario                     |
| `GET`  | `/api/reservas/por-libro/:libroId`       | Cola de un libro                         |
| `GET`  | `/api/reservas/todas`                    | Todas las reservas (bibliotecario)       |
| `POST` | `/api/reservas`                          | Crear reserva (body: `{ libro_id }`)     |
| `POST` | `/api/reservas/:id/cancelar`             | Cancelar reserva                         |
| `GET`  | `/api/multas/mis-multas`                 | Multas del usuario                       |
| `GET`  | `/api/multas/todas`                      | Todas las multas (bibliotecario)         |
| `GET`  | `/api/miembros`                          | Listado de miembros (bibliotecario)      |

Todas las rutas, salvo `/api/health`, `/api/auth/login` y
`/api/auth/restaurar-sesion`, requieren el header `x-session-token`
con el token devuelto por el login. `apiService.js` lo agrega
automáticamente en modo web.

---

## Variables de entorno

**`server/.env`**

| Variable      | Descripción                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `MONGODB_URI` | Cadena de conexión a la instancia de MongoDB. Por defecto: `mongodb://localhost:27017/libraryhub`.    |
| `PORT`        | Puerto del servidor Express en modo web. Por defecto: `3000`. No aplica al modo escritorio.           |

---

## Scripts disponibles

| Comando                  | Descripción                                                          |
| ------------------------ | ---------------------------------------------------------------------- |
| `npm run dev`             | Solo Vite, sin backend                                                 |
| `npm run build`           | Genera el build de producción del frontend en `dist/`                 |
| `npm run preview`         | Sirve el build de producción con Vite                                  |
| `npm run lint`            | Analiza el código con oxlint                                           |
| `npm run seed`            | Carga los datos de ejemplo en MongoDB (borra lo anterior)              |
| `npm run electron:dev`    | Modo escritorio: Vite + Electron juntos                                |
| `npm run electron:build`  | Compila el frontend y abre Electron apuntando a `dist/`                |
| `npm run server:dev`      | Solo el servidor Express en `:3000` (útil para debug con curl/Postman) |
| `npm run dev:web`         | Modo web: servidor Express + Vite juntos                                |

---

## Solución de problemas

- **"Failed to fetch" en el navegador (modo web):** el servidor
  Express no está corriendo. Verificá con `npm run server:dev` o abrí
  `http://localhost:3000/api/health`.
- **"No hay una sesion activa" en cualquier endpoint:** el token
  guardado se perdió o venció. Hacé login de nuevo.
- **"ECONNREFUSED 127.0.0.1:27017":** MongoDB no está corriendo.
  Levantá tu instancia local y volvé a correr `npm run seed`.
- **Cambios en `server/index.js` no se reflejan (modo web):**
  `node --watch` reinicia el servidor automáticamente al guardar. Si
  no ocurre, cortá el proceso (`Ctrl+C`) y volvé a correr
  `npm run dev:web`.

---

## Documentación adicional

Para una explicación más detallada de cómo se conecta cada parte del
proyecto (frontend, backend, Electron, sesión, conversión de moneda,
etc.), ver [`COMO_FUNCIONA_LIBRARYHUB.md`](./COMO_FUNCIONA_LIBRARYHUB.md).
