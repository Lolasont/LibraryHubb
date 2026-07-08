<div align="center">

# 📚 LibraryHub

**Sistema de gestión para una biblioteca digital municipal**

![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Electron](https://img.shields.io/badge/Electron-43-47848F?logo=electron&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/uso-académico-lightgrey)

</div>

---

## Descripción

LibraryHub es una aplicación de escritorio para la gestión de préstamos,
reservas y multas de una biblioteca municipal, construida con React y
Electron, con MongoDB como base de datos.

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
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)

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

LibraryHub corre como una **aplicación de escritorio** dentro de
Electron. El proceso principal se conecta a MongoDB directamente,
expone la lógica de negocio a través de canales IPC, y el frontend
React se comunica con él mediante `window.libraryHub` (expuesto por el
preload).

```
┌──────────────────────┐
│  Renderer (React)    │
│  pages → apiService   │
└──────────┬───────────┘
           │ window.libraryHub.algo()
           ▼
┌──────────────────────┐
│  preload.cjs          │  contextBridge + ipcRenderer
└──────────┬───────────┘
           │ ipcRenderer.invoke('canal')
           ▼
┌──────────────────────┐
│  main.cjs              │  ipcMain.handle('canal', handler)
│  └─ services/*.js      │  lógica de negocio (Mongoose)
│  └─ sesion.service     │  usuarioActual en memoria
└──────────┬───────────┘
           │ Mongoose
           ▼
        MongoDB
   mongodb://localhost:27017/libraryhub
```

El frontend **desconoce por completo** la existencia de MongoDB: las
páginas de React (`Login`, `Libros`, `LibroDetalle`, `MiPerfil`,
`MisReservas`, `Bibliotecario`) nunca tocan la base de datos
directamente. Toda la comunicación pasa por `apiService.js`, que
delega en `window.libraryHub`.

### Ciclo de vida de una acción

Ejemplo: un miembro solicita un préstamo desde la vista de detalle de
libro.

```
1.  El usuario hace clic en "Solicitar préstamo".
2.  El componente llama a solicitarPrestamo(libroId)  → src/data/apiService.js
3.  apiService.js ejecuta window.libraryHub.solicitarPrestamo(libroId)
4.  preload.cjs lo traduce a ipcRenderer.invoke('prestamos:solicitar', libroId)
5.  main.cjs recibe la llamada en el handler 'prestamos:solicitar',
    resuelve getUsuarioActual() y llama a prestamosService.solicitarPrestamo(...)
6.  El service valida la sesión, busca el libro, descuenta una copia,
    crea el préstamo en MongoDB y devuelve { ok: true, mensaje, prestamo }
7.  main.cjs devuelve ese objeto al renderer. Si hubo error, lo
    convierte en { ok: false, mensaje } (helper conManejorDeErrores).
8.  apiService.js se lo entrega al componente, que muestra el toast.
```

---

## Stack tecnológico

| Capa               | Tecnologías                                                |
| ------------------ | ----------------------------------------------------------- |
| **Frontend**        | React 19 · Vite · React Router · Tailwind CSS · Heroicons   |
| **Escritorio**      | Electron 43 (proceso principal + preload)                   |
| **Backend**         | Node.js · Mongoose · bcrypt · dotenv                         |
| **Base de datos**   | MongoDB (instancia local en `localhost:27017/libraryhub`)   |
| **Calidad**         | oxlint                                                       |

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
│   │   ├── apiService.js           # Delega en window.libraryHub (IPC)
│   │   └── utils.js                # Formateo de fechas, montos y estados
│   ├── hooks/                      # Hooks personalizados
│   └── pages/                      # Pantallas de la aplicación
│
├── server/                         # Lógica de negocio + conexión MongoDB
│   ├── config/db.js                # conectarDB() (Mongoose)
│   ├── models/                     # Esquemas de Mongoose
│   ├── services/                   # Lógica de negocio
│   │   ├── auth.service.js         # login(), restaurarSesion()
│   │   ├── sesion.service.js       # get/setUsuarioActual, requerirSesion/Rol
│   │   ├── categorias.service.js
│   │   ├── libros.service.js
│   │   ├── prestamos.service.js
│   │   ├── reservas.service.js
│   │   ├── multas.service.js
│   │   └── miembros.service.js
│   ├── utils/format.js             # toDate() y helpers de formato
│   ├── seed.js                     # Carga datos de ejemplo
│   └── .env                        # MONGODB_URI (ignorado por git)
│
├── electron/                       # Proceso principal de Electron
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
- ~150 MB de espacio para el binario de Electron

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la URI de MongoDB

```bash
# Crear server/.env con la URI de tu instancia local
cp server/.env.example server/.env    # solo si el archivo no existe
# Editar server/.env y dejar:
#   MONGODB_URI=mongodb://localhost:27017/libraryhub
```

> El archivo `server/.env` no se commitea (está en `.gitignore`). La
> URI por defecto `mongodb://localhost:27017/libraryhub` funciona para
> la mayoría de las instalaciones locales.

### 3. Cargar datos de ejemplo (una sola vez)

```bash
npm run seed
```

Esto borra y recrea todas las colecciones con libros, socios y
préstamos de demostración. Las credenciales quedan impresas al
finalizar.

### 4. Ejecutar la aplicación

```bash
npm run electron:dev
```

Este comando levanta Vite en `http://localhost:5173` y, en cuanto
detecta que está respondiendo, abre la ventana de Electron cargando
esa URL. Vite y Electron corren en el mismo proceso de desarrollo.

### 5. (Opcional) Probar el build de producción

```bash
npm run electron:build
```

Compila el frontend a `dist/` y abre Electron apuntando a esos
archivos estáticos (sin Vite en el medio).

> **Nota sobre Windows Defender:** durante el desarrollo es posible
> que el antivirus demore o bloquee la primera ejecución de Electron.
> Agregar la carpeta del proyecto a las exclusiones de Windows
> Defender suele resolverlo.

---

## Credenciales de prueba

| Rol           | Cédula     | Contraseña |
| ------------- | ---------- | ---------- |
| Miembro       | `12345678` | `12345678` |
| Bibliotecario | `00000001` | `admin`    |

La pantalla de inicio de sesión incluye un panel con estas
credenciales: un clic sobre cualquiera de ellas completa el formulario
automáticamente.

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

La identidad del usuario vive en dos lugares sincronizados:

- **Proceso principal de Electron (memoria):**
  `server/services/sesion.service.js` mantiene una variable
  `usuarioActual` que se setea en `auth.service.js` al validar el
  login. Los services que requieren sesión llaman a
  `requerirSesion()` (lanza error si no hay nadie logueado) o
  `requerirRol('bibliotecario')` (lanza error si el rol no coincide).
- **Renderer (localStorage):** `src/context/AuthContext.jsx` guarda el
  objeto `user` en la clave `libraryhub_user` al hacer login. Esto
  permite que la sesión **persista** entre reinicios de la app.

El inicio de sesión (`auth:login` IPC) valida cédula y contraseña
contra la base de datos. Si la cuenta está activa y la contraseña
coincide, devuelve `{ ok: true, user }`.

### Restauración de sesión al abrir la app

Al montar `AuthProvider`, si hay un usuario guardado en `localStorage`,
se dispara `auth:restaurarSesion`: vuelve a buscar al miembro por su
id, confirma que siga activo, y sincroniza `usuarioActual` en el
proceso principal de Electron con lo que el renderer ya tenía guardado.

Mientras esa sincronización está en curso, `AuthContext` expone
`sesionLista: false`, y `RequireAuth` (en `App.jsx`) muestra un
spinner en lugar de montar la página protegida — así ninguna página
dispara pedidos IPC antes de que el proceso principal sepa quién está
logueado.

Si la restauración falla (la cuenta ya no existe o fue suspendida), la
sesión se cierra localmente.

---

## Variables de entorno

**`server/.env`** _(única variable de entorno del proyecto)_

| Variable      | Descripción                                                       |
| ------------- | ------------------------------------------------------------------ |
| `MONGODB_URI` | Cadena de conexión a la instancia de MongoDB. Por defecto: `mongodb://localhost:27017/libraryhub`. |

---

## Scripts disponibles

| Comando                  | Descripción                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| `npm run dev`            | Servidor de desarrollo de Vite (sin Electron)                                 |
| `npm run build`          | Genera el build de producción del frontend en `dist/`                        |
| `npm run preview`        | Sirve el build de producción con Vite                                         |
| `npm run lint`           | Analiza el código con oxlint                                                  |
| `npm run seed`           | Carga los datos de ejemplo en MongoDB (borra lo anterior)                     |
| `npm run electron:dev`   | Levanta Vite + Electron juntos (modo desarrollo)                              |
| `npm run electron:build` | Compila el frontend y abre Electron apuntando a `dist/`                       |
