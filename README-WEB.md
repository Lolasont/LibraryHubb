# LibraryHub — Modo Web

> Instrucciones para correr la app en un navegador (sin Electron), además del modo escritorio original.

## ¿Qué se agregó?

LibraryHub ahora puede correr en **dos modos** sin perder ninguna funcionalidad:

| Modo | Comando | Quién sirve el backend | Dónde se ve |
|---|---|---|---|
| **Electron (existente, intacto)** | `npm run electron:dev` | El proceso main de Electron (vía IPC) | Ventana de escritorio |
| **Web (nuevo)** | `npm run dev:web` | Servidor Express en `:3000` | Navegador en `http://localhost:5173` |

El frontend detecta automáticamente en qué modo está (con `window.libraryHub`) y usa la capa adecuada: IPC para Electron, `fetch` para web.

---

## Requisitos

- Node.js 18+
- MongoDB corriendo en `mongodb://localhost:27017`
- Si todavía no cargaste datos: `npm run seed`

## Pasos para arrancar en modo web

1. **Asegurate de tener MongoDB corriendo localmente** y los datos cargados:
   ```bash
   npm run seed
   ```

2. **Levantá ambos procesos con un solo comando:**
   ```bash
   npm run dev:web
   ```
   Eso inicia en paralelo:
   - El servidor Express en `http://localhost:3000` (API)
   - Vite en `http://localhost:5173` (frontend)

3. **Abrí el navegador en** `http://localhost:5173` y usá las credenciales de demo:
   - Miembro: `12345678 / 12345678`
   - Bibliotecario: `00000001 / admin`

---

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev:web` | Levanta el modo web completo (API + frontend) |
| `npm run server:dev` | Levanta solo el servidor Express en `:3000` (útil para debug con `curl` o Postman) |
| `npm run electron:dev` | Modo Electron (intacto, sigue funcionando como antes) |
| `npm run dev` | Solo Vite, sin backend (preview de UI sin login) |
| `npm run seed` | Borra y recarga los datos de ejemplo en MongoDB |

---

## Health check

Para verificar que el server está vivo sin abrir el navegador:

```bash
curl http://localhost:3000/api/health
```

Debería responder:
```json
{ "ok": true, "mensaje": "API LibraryHub funcionando." }
```

---

## Estructura nueva

```
server/
├── index.js                  ← NUEVO: servidor Express con los 17 endpoints REST
├── middleware/
│   └── sesion-http.js        ← NUEVO: manejo de tokens de sesión en memoria
├── config/db.js              (sin cambios)
├── models/                   (sin cambios)
├── services/                 (sin cambios — se reusan tal cual)
├── seed.js                   (sin cambios)
└── .env                      (sin cambios)
```

```
src/
└── data/
    └── apiService.js         ← MODIFICADO: detecta Electron vs web y elige IPC o fetch
```

```
package.json                  ← MODIFICADO: deps express/cors + scripts dev:web y server:dev
electron/                     (intacto, sin cambios)
```

---

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/health` | Health check |
| `POST` | `/api/auth/login` | Login (body: `{ cedula, password }`) |
| `POST` | `/api/auth/restaurar-sesion` | Restaurar sesión (body: `{ userId }`) |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `GET`  | `/api/categorias` | Listar categorías |
| `GET`  | `/api/libros?busqueda=...&categoria_id=...` | Buscar libros |
| `GET`  | `/api/libros/:id` | Detalle de un libro |
| `GET`  | `/api/prestamos/mis-activos` | Préstamos activos del usuario |
| `GET`  | `/api/prestamos/todos` | Todos los préstamos (solo bibliotecario) |
| `POST` | `/api/prestamos/solicitar` | Solicitar préstamo (body: `{ libro_id }`) |
| `POST` | `/api/prestamos/:id/renovar` | Renovar préstamo |
| `POST` | `/api/prestamos/:id/devolver` | Registrar devolución |
| `GET`  | `/api/reservas/mis-reservas` | Reservas del usuario |
| `GET`  | `/api/reservas/por-libro/:libroId` | Cola de un libro |
| `GET`  | `/api/reservas/todas` | Todas las reservas (bibliotecario) |
| `POST` | `/api/reservas` | Crear reserva (body: `{ libro_id }`) |
| `POST` | `/api/reservas/:id/cancelar` | Cancelar reserva |
| `GET`  | `/api/multas/mis-multas` | Multas del usuario |
| `GET`  | `/api/multas/todas` | Todas las multas (bibliotecario) |
| `GET`  | `/api/miembros` | Listado de socios (bibliotecario) |

**Autenticación:** todas las rutas (excepto `/api/auth/login`, `/api/auth/restaurar-sesion` y `/api/health`) requieren el header `x-session-token` con el token devuelto por el login. El frontend lo agrega automáticamente.

---

## ¿Y si quiero un solo comando como mis compañeros?

No es posible sin perder la arquitectura IPC actual. Para tener un solo comando necesitarían revertir a Express-only (como el proyecto de tus compañeros), lo cual implica sacar el preload, los `ipcMain.handle` de `main.cjs` y cambiar la fachada del frontend. Es un refactor mayor.

**El plan actual es el equilibrio:** dos comandos, ambos funcionan, Electron intacto, y todas las páginas React se reutilizan sin tocarse.

---

## Troubleshooting

- **"Failed to fetch" en el navegador:** el server Express no está corriendo. Verificá con `npm run server:dev` o abrí `http://localhost:3000/api/health` en otra pestaña.
- **"No hay una sesion activa" en un endpoint:** el token en `localStorage` se perdió o expiró. Hacé login de nuevo.
- **"ECONNREFUSED 127.0.0.1:27017":** MongoDB no está corriendo. Levantá tu instancia local de MongoDB y volvé a correr `npm run seed`.
- **Cambios en el server no se reflejan:** `node --watch` ya reinicia automáticamente al guardar `server/index.js`. Si no pasa, matá el proceso (`Ctrl+C` en la terminal) y volvé a correr `npm run dev:web`.
