# LibraryHub — Biblioteca Digital

Sistema web de gestión para bibliotecas municipales. Permite a los miembros buscar libros, solicitar préstamos, hacer reservas y consultar multas desde cualquier dispositivo. Los bibliotecarios cuentan con un panel de control para gestionar todo el flujo de préstamos.

---

## Funcionalidades

### Para miembros
- **Buscar libros** por título, autor o ISBN con filtro por categoría
- **Disponibilidad en tiempo real** — indicador visual verde/rojo por libro
- **Solicitar préstamos** directamente desde el detalle del libro
- **Reservar libros** agotados y ver tu posición en la cola de espera
- **Perfil personal** con préstamos activos y semáforo de vencimiento
- **Alertas de vencimiento** — amarillo si quedan menos de 5 días, rojo si ya venció
- **Renovar préstamos** con un clic
- **Consultar multas** pendientes con convertidor a múltiples monedas (USD, EUR, ARS)

### Para bibliotecarios
- **Panel de control** con métricas en tiempo real
- **Gestión de préstamos** — ver todos los activos y registrar devoluciones
- **Gestión de reservas** — visualizar cola completa por libro
- **Gestión de multas** — listado de deudas pendientes
- **Gestión de miembros** — directorio con tipo de membresía y estado

---

## Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI |
| Vite | 8 | Bundler |
| React Router DOM | 7 | Enrutamiento |
| Tailwind CSS | 3 | Estilos |
| Heroicons | 2 | Iconos |
| prop-types | 15 | Validación de props |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4 | Servidor HTTP |
| MongoDB | 7+ | Base de datos |
| Mongoose | 8 | ODM |
| JSON Web Token | 9 | Autenticación |
| bcryptjs | 2 | Hash de contraseñas |
| nodemon | 3 | Hot reload en desarrollo |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MongoDB](https://www.mongodb.com/try/download/community) corriendo localmente en `localhost:27017`
- npm v9 o superior

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Lolasont/LibraryHubb.git
cd libraryhub
```

### 2. Configurar el backend

```bash
cd server
cp .env.example .env   # copiar variables de entorno
npm install
```

Editar `server/.env` si es necesario:

```env
MONGODB_URI=mongodb://localhost:27017/libraryhub
JWT_SECRET=reemplazar_este_valor_por_una_clave_larga_y_aleatoria
PORT=5000
```

### 3. Poblar la base de datos

```bash
# Dentro de /server — ejecutar solo la primera vez
npm run seed
```

Esto crea categorías, libros, miembros, préstamos, reservas y multas de ejemplo.

### 4. Configurar el frontend

```bash
cd ..          # volver a la raíz del proyecto
npm install
```

Verificar que exista el archivo `.env` en la raíz:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Ejecutar el proyecto

Se necesitan **dos terminales abiertas en paralelo**:

```bash
# Terminal 1 — Backend
cd server
npm run dev
# → Servidor corriendo en http://localhost:5000

# Terminal 2 — Frontend
cd libraryhub   # raíz del proyecto
npm run dev
# → Aplicación disponible en http://localhost:5173
```

---

## Usuarios de prueba

| Rol | Cédula | Contraseña | Acceso |
|---|---|---|---|
| Miembro básico | `12345678` | `12345678` | Catálogo, préstamos, reservas, perfil |
| Miembro premium | `23456789` | `23456789` | Catálogo, préstamos, reservas, perfil |
| Bibliotecario | `00000001` | `admin` | Panel de control completo |

> La pantalla de login tiene un panel de **credenciales de demostración** para acceder con un solo clic sin necesidad de escribir.

---

## Estructura del proyecto

```
libraryhub/
├── src/                            ← Código fuente del frontend
│   ├── context/AuthContext.jsx     ← Sesión de usuario y token JWT
│   ├── hooks/useToast.js           ← Notificaciones reutilizables
│   ├── data/
│   │   ├── apiService.js           ← Todas las llamadas a la API
│   │   ├── mockService.js          ← Versión mock para desarrollo sin backend
│   │   └── utils.js                ← Formateo de fechas, monedas y estados
│   ├── components/
│   │   ├── layout/Layout.jsx       ← Sidebar + navegación
│   │   └── ui/                     ← Badge, Toast, Spinner, EmptyState
│   └── pages/
│       ├── Login/
│       ├── Libros/                 ← Catálogo con búsqueda y filtros
│       ├── LibroDetalle/           ← Ficha del libro + acciones
│       ├── MiPerfil/               ← Préstamos activos y multas
│       ├── MisReservas/            ← Cola de reservas
│       └── Bibliotecario/          ← Panel de gestión
│
├── server/                         ← Código fuente del backend
│   ├── config/db.js                ← Conexión a MongoDB
│   ├── middleware/auth.js          ← Verificación JWT y control de roles
│   ├── models/                     ← Schemas de Mongoose
│   │   ├── Miembro.js
│   │   ├── Libro.js
│   │   ├── Categoria.js
│   │   ├── Prestamo.js
│   │   ├── Reserva.js
│   │   └── Multa.js
│   ├── routes/                     ← Endpoints de la API
│   ├── seed.js                     ← Datos iniciales para desarrollo
│   └── index.js                    ← Entry point del servidor
│
├── .env                            ← Variables de entorno del frontend
├── tailwind.config.js
└── vite.config.js
```

---

## API — Referencia de endpoints

Todos los endpoints excepto `/api/auth/login` requieren el header:
```
Authorization: Bearer <token>
```

### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión. Retorna `{ user, token }` |

### Libros
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/libros` | Listar libros. Acepta `?busqueda=` y `?categoria_id=` |
| GET | `/api/libros/:id` | Detalle de un libro |

### Categorías
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/categorias` | Listar todas las categorías |

### Préstamos
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/prestamos/me` | miembro | Mis préstamos activos |
| GET | `/api/prestamos` | bibliotecario | Todos los préstamos activos |
| POST | `/api/prestamos` | miembro | Solicitar préstamo `{ libro_id }` |
| PATCH | `/api/prestamos/:id/renovar` | miembro | Renovar +14 días |
| PATCH | `/api/prestamos/:id/devolver` | bibliotecario | Registrar devolución |

### Reservas
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/reservas/me` | miembro | Mis reservas activas |
| GET | `/api/reservas/libro/:id` | todos | Cola de un libro |
| GET | `/api/reservas` | bibliotecario | Todas las reservas activas |
| POST | `/api/reservas` | miembro | Crear reserva `{ libro_id }` |
| DELETE | `/api/reservas/:id` | miembro | Cancelar reserva |

### Multas
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/multas/me` | miembro | Mis multas pendientes |
| GET | `/api/multas` | bibliotecario | Todas las multas pendientes |

### Miembros
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/miembros` | bibliotecario | Lista de todos los miembros |

---

## Autenticación y roles

El sistema usa **JSON Web Tokens (JWT)** con expiración de 7 días.

| Rol | Rutas accesibles |
|---|---|
| `miembro` | `/libros`, `/libros/:id`, `/mi-perfil`, `/mis-reservas` |
| `bibliotecario` | `/libros`, `/libros/:id`, `/bibliotecario` |

Las rutas protegidas redirigen automáticamente al login si no hay sesión activa, y a `/libros` si el rol no tiene permiso.

---

## Scripts disponibles

### Frontend (raíz del proyecto)
```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción
npm run preview   # Preview del build
npm run lint      # Linting con oxlint
```

### Backend (`/server`)
```bash
npm run dev       # Servidor con hot reload (nodemon)
npm run start     # Servidor sin hot reload
npm run seed      # Poblar la base de datos con datos de ejemplo
```

---

## Modelo de datos

```
Miembro       → tiene muchos Prestamos
Miembro       → tiene muchas Reservas
Miembro       → tiene muchas Multas (a través de Prestamos)
Libro         → pertenece a una Categoria
Libro         → tiene muchos Prestamos
Libro         → tiene muchas Reservas
Prestamo      → puede generar una Multa (si la devolución es tardía)
```

Las multas se generan automáticamente al registrar una devolución tardía. El monto es de **$1.000 CLP por día de atraso**.

---

## Desarrollo sin backend

El proyecto incluye un modo mock para trabajar el frontend sin necesidad de tener el servidor corriendo. Los archivos `src/data/mockData.js` y `src/data/mockService.js` contienen datos y lógica simulada.

Para activar el modo mock, cambiar el import en cada página de:
```js
import { getLibros } from '../../data/apiService'
```
a:
```js
import { getLibros } from '../../data/mockService'
```

---
