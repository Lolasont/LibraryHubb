# LibraryHub — Biblioteca Digital Municipal

Sistema de gestion para bibliotecas municipales. Permite a los socios buscar
libros, pedir prestamos, hacer reservas y consultar multas. Los bibliotecarios
gestionan todo desde un panel de control con pestanas.

Esta es la version fusionada de las dos ramas del proyecto. Reune la base
web completa con backend (Express + MongoDB + JWT) con el empaquetado
de escritorio (Electron) que se desarrollo en paralelo.

---

## Tecnologias

### Frontend
- React 19 con Vite 8
- React Router DOM 7
- Tailwind CSS 3 con clases globales propias
- Heroicons para la iconografia
- prop-types para validacion de props

### Backend
- Node.js con Express 4 (modulos ESM)
- MongoDB con Mongoose 8
- JSON Web Tokens (jsonwebtoken) para la autenticacion
- bcryptjs para hashear contrasenas
- cors para permitir el acceso desde el frontend

### Escritorio (opcional)
- Electron 43 + electron-is-dev
- concurrently + wait-on para levantar Vite y Electron en paralelo

---

## Estructura del proyecto

```
libraryhub/
├── public/
│   ├── electron.cjs          ← punto de entrada de Electron
│   ├── favicon.svg
│   └── icons.svg
├── server/                   ← backend Express
│   ├── index.js
│   ├── seed.js               ← script para cargar datos de prueba
│   ├── .env                  ← variables de entorno del backend
│   ├── .env.example
│   ├── config/db.js          ← conexion a MongoDB
│   ├── middleware/auth.js    ← verifyToken + requireRole
│   ├── models/               ← schemas de Mongoose
│   │   ├── Categoria.js
│   │   ├── Miembro.js
│   │   ├── Libro.js
│   │   ├── Prestamo.js
│   │   ├── Reserva.js
│   │   └── Multa.js
│   ├── routes/               ← endpoints de la API
│   │   ├── auth.routes.js
│   │   ├── categorias.routes.js
│   │   ├── libros.routes.js
│   │   ├── prestamos.routes.js
│   │   ├── reservas.routes.js
│   │   ├── multas.routes.js
│   │   └── miembros.routes.js
│   └── utils/format.js
├── server-mock/              ← backend alternativo (json-server, sin MongoDB)
│   ├── index.js
│   ├── db.json               ← estado actual (se muta con el uso)
│   ├── db.seed.json          ← estado inicial
│   ├── reset.js              ← restaura db.json desde db.seed.json
│   ├── .env.example
│   ├── middleware/auth.js
│   └── utils/format.js
└── src/                      ← frontend React
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── preload.js            ← puente seguro entre Electron y React
    ├── context/AuthContext.jsx
    ├── hooks/useToast.js
    ├── data/
    │   ├── apiService.js     ← capa que habla con el backend
    │   ├── mockService.js    ← misma API, con datos en memoria
    │   ├── mockData.js
    │   └── utils.js
    ├── components/
    │   ├── layout/Layout.jsx
    │   └── ui/               ← Badge, Spinner, EmptyState, Toast
    └── pages/
        ├── Login/
        ├── Libros/
        ├── LibroDetalle/
        ├── MiPerfil/
        ├── MisReservas/
        └── Bibliotecario/
```

---

## Como correr el proyecto

Necesitas dos terminales en paralelo: una para el backend y otra para el frontend.

### 1. Levantar el backend

```bash
cd server
npm install
# (opcional) copiar .env.example a .env y completar los valores
npm run seed     # solo la primera vez: pobla MongoDB con datos de prueba
npm run dev      # servidor escuchando en http://localhost:5000
```

### 2. Levantar el frontend

```bash
# desde la raiz del proyecto
npm install
npm run dev      # aplicacion disponible en http://localhost:5173
```

### 3. (Opcional) Levantar la app de escritorio con Electron

```bash
# desde la raiz del proyecto
npm run electron
```

Este comando arranca Vite y Electron en paralelo, y abre una ventana nativa
apuntando a la aplicacion.

---

## Variables de entorno

### `server/.env`
```
MONGODB_URI=mongodb://localhost:27017/libraryhub
JWT_SECRET=libraryhub_dev_secret_key
PORT=5000
```

### `.env` (raiz del proyecto, para el frontend)
```
VITE_API_URL=http://localhost:5000/api
```

Si este archivo no existe, apiService.js usa el mismo valor por defecto.

---

## Credenciales de prueba

Una vez corrido `npm run seed`, podes entrar con cualquiera de estas cuentas:

| Rol              | Cedula    | Contrasena |
|------------------|-----------|------------|
| Miembro basico   | 12345678  | 12345678   |
| Miembro premium  | 23456789  | 23456789   |
| Miembro estudiante | 34567890 | 34567890 |
| Bibliotecario    | 00000001  | admin      |

La pantalla de login tiene un panel con estas credenciales: con un clic
se rellena el formulario automaticamente.

---

## Funcionalidades

### Para socios
- Buscar libros por titulo, autor o ISBN
- Filtrar el catalogo por categoria
- Ver disponibilidad en tiempo real
- Solicitar un prestamo
- Reservar libros sin copias disponibles y ver la posicion en la cola
- Renovar prestamos desde el perfil
- Consultar multas pendientes con convertidor a otras monedas
- Alertas visuales de vencimiento (verde, amarillo, rojo)

### Para el bibliotecario
- Panel de control con metricas (prestamos activos, vencidos, reservas, multas)
- Registro de devoluciones (genera multa automatica si hubo atraso)
- Vista de todas las reservas activas
- Vista de todas las multas pendientes
- Directorio de socios con tipo de membresia y estado

---

## Autenticacion y roles

- Login con JWT, expiracion de 7 dias.
- Token guardado en `localStorage` bajo la clave `libraryhub_token`.
- Datos del usuario en `localStorage` bajo `libraryhub_user`.
- Middleware `verifyToken` en todos los endpoints excepto `/api/auth/login`.
- Middleware `requireRole('bibliotecario')` en los endpoints restringidos.

| Rol            | Rutas accesibles                                     |
|----------------|------------------------------------------------------|
| miembro        | `/libros`, `/libros/:id`, `/mi-perfil`, `/mis-reservas` |
| bibliotecario  | `/libros`, `/libros/:id`, `/bibliotecario`           |

Las rutas protegidas redirigen al login si no hay sesion, y a `/libros`
si el rol no tiene permiso.

---

## Desarrollo sin backend

El proyecto incluye un modo mock para trabajar el frontend sin tener
MongoDB ni el backend levantados. Los archivos `src/data/mockData.js`
y `src/data/mockService.js` tienen la misma estructura de funciones que
`apiService.js`, pero devuelven datos en memoria.

Para activar el modo mock, en `apiService.js` cambiar la importacion
de las funciones que necesites para que apunten a `./mockService.js`.

---

## Reglas de negocio destacadas

- **Duracion del prestamo:** 14 dias. Renovacion suma 14 dias mas.
- **Multas automaticas:** $1.000 CLP por cada dia de atraso al devolver.
- **Reservas:** cada socio puede tener solo una reserva activa por libro.
- **Posicion en la cola:** se asigna al crear la reserva (ultimo + 1).
- **Copias disponibles:** se actualiza con `$inc` en Mongo al prestar/devolver.
- **Contrasenas:** se hashean con bcrypt antes de guardarse (10 rondas).
- **Busqueda:** escapa caracteres especiales de regex para evitar inyecciones.

---

## Plan B: API alternativa sin MongoDB

Ademas del backend oficial (Express + MongoDB en `server/`), el proyecto
incluye un backend alternativo en `server-mock/` que persiste en un
archivo `db.json` en disco. Esta pensado para correr el frontend sin
necesidad de tener MongoDB levantado (demos, debugging, evaluaciones sin
dependencias externas).

### Como levantarlo

```bash
# Terminal 1 — Plan B
cd server-mock
npm install
npm run dev          # http://localhost:5001

# Terminal 2 — frontend (siempre el mismo)
cd "libraryhub"
npm run dev          # http://localhost:5173
```

Y en `.env` (raiz del frontend), comentar la linea del backend Mongo y
descomentar la del Plan B:

```env
# Backend oficial (Mongo):
# VITE_API_URL=http://localhost:5000/api
# Plan B (json-server, sin Mongo):
VITE_API_URL=http://localhost:5001/api
```

Reiniciar Vite para que tome el nuevo valor.

### Caracteristicas

- **Mismas rutas** que el backend de Mongo: `/api/auth/login`,
  `/api/libros`, `/api/prestamos`, `/api/reservas`, `/api/multas`,
  `/api/miembros`, `/api/categorias`.
- **Mismas formas de respuesta**: el frontend no nota la diferencia.
- **Misma `JWT_SECRET`**: un token firmado por un backend es valido en el
  otro, asi se puede alternar sin reloguear.
- **Persistencia inmediata** en `db.json`. A diferencia de `mockService.js`
  (que era mock en memoria del navegador), este backend mantiene los
  cambios al recargar la pagina.
- **Reset a estado inicial** con `npm run reset` (en `server-mock/`).

### Volver al backend Mongo

Solo cambiar el `.env` y reiniciar Vite. No requiere reinstalar nada.

Mas detalles en `server-mock/README.md`.
