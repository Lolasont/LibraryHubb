# Cómo funciona LibraryHub

Esta es una explicación completa del proyecto, pensada para que se
entienda sin tener que leer el código línea por línea. Cubre qué hace
cada parte, cómo se conectan entre sí, y qué pasa exactamente cuando
se usa cada función de la aplicación.

---

## Índice

1. [La idea general, en una imagen mental](#1-la-idea-general-en-una-imagen-mental)
2. [Las dos formas de ejecutar la aplicación](#2-las-dos-formas-de-ejecutar-la-aplicación)
3. [El frontend: qué hace cada carpeta de `src/`](#3-el-frontend-qué-hace-cada-carpeta-de-src)
4. [El backend: qué hace cada carpeta de `server/`](#4-el-backend-qué-hace-cada-carpeta-de-server)
5. [Electron: qué hace `electron/`](#5-electron-qué-hace-electron)
6. [Cómo se maneja la sesión (quién está autenticado)](#6-cómo-se-maneja-la-sesión-quién-está-autenticado)
7. [Recorrido completo de cada acción del usuario](#7-recorrido-completo-de-cada-acción-del-usuario)
8. [Los modelos de datos: qué guarda cada colección](#8-los-modelos-de-datos-qué-guarda-cada-colección)
9. [Mapa mental del proyecto completo](#9-mapa-mental-del-proyecto-completo)

---

## 1. La idea general, en una imagen mental

Conviene pensar en tres roles trabajando en cadena:

- **React** es quien atiende al público: dibuja botones, formularios,
  listas de libros. No sabe nada de bases de datos — solo sabe pedir
  información y mostrar lo que recibe.
- **Los "services"** (`server/services/`) son quienes conocen las
  reglas del negocio: cuántos días dura un préstamo, cuántas veces se
  puede renovar, cómo se calcula una multa. Nunca hablan directamente
  con el público — solo reciben pedidos ya traducidos.
- **MongoDB** es el archivo central: guarda todo de forma permanente.
  No entiende de reglas de negocio, solo almacena y devuelve datos
  cuando se le solicitan.

Lo particular de este proyecto es que existen **dos formas distintas**
de que React se comunique con los services — pero los services y
MongoDB son siempre los mismos, sin importar cuál de las dos formas se
esté usando.

---

## 2. Las dos formas de ejecutar la aplicación

### Modo escritorio (Electron)

La aplicación se abre como un programa instalado, en su propia
ventana. Todo corre en el mismo equipo, dentro de un único proceso:
React (la ventana), los services y la conexión a MongoDB conviven
juntos.

Aquí no hay ningún servidor escuchando en un puerto de red. React se
comunica con los services mediante un mecanismo interno de Electron
llamado **IPC** (paso de mensajes entre procesos) — es similar a
pasar una nota de una habitación a otra dentro de la misma casa.

### Modo web (navegador)

La aplicación se abre en un navegador (Chrome, Firefox, etc.), como
cualquier sitio web. En este caso sí existe un servidor real (Express)
escuchando en el puerto 3000, y React se comunica con él mediante el
mismo protocolo que usaría cualquier página web: HTTP.

### ¿Cómo sabe React cuál de los dos modos usar?

Existe una única función, `isElectron()`, dentro de
`src/data/apiService.js`, que revisa si existe un objeto llamado
`window.libraryHub`. Ese objeto solo existe si la página se abrió
dentro de Electron (lo inyecta `preload.cjs`, ver la sección 5). Si
existe, se usa IPC. Si no existe, se usa `fetch` (peticiones HTTP
normales) contra el servidor Express.

**Lo importante:** ninguna página de React (`Login`, `Libros`,
`MiPerfil`, etc.) necesita saber en qué modo está corriendo. Todas se
comunican siempre con `apiService.js`, y es este archivo el único que
decide cómo enviar cada pedido.

---

## 3. El frontend: qué hace cada carpeta de `src/`

### `main.jsx` — el punto de arranque

Es lo primero que se ejecuta. Le indica a React dónde dibujarse y
envuelve toda la aplicación con el sistema de rutas (`BrowserRouter`)
y con `AuthProvider` (quién está autenticado).

### `App.jsx` — el mapa de pantallas

Decide qué pantalla mostrar según la URL actual y según si hay alguien
autenticado. Incluye un componente de control (`RequireAuth`) que:

- Si no hay nadie autenticado, redirige al login.
- Si el usuario autenticado no tiene el rol necesario (por ejemplo, un
  miembro intentando ingresar al panel de bibliotecario), lo redirige
  de vuelta a `/libros`.
- Si la sesión todavía se está confirmando con el backend (ver sección
  6), muestra un indicador de carga en lugar de la pantalla, para
  evitar disparar pedidos antes de tiempo.

### `context/AuthContext.jsx` — la memoria de "quién es el usuario"

Guarda en un solo lugar quién está autenticado, para que cualquier
pantalla pueda consultarlo sin necesidad de pasarlo manualmente de
componente en componente. También se encarga de guardar esa
información en `localStorage`, para que la sesión persista al cerrar
y volver a abrir la aplicación.

### `data/apiService.js` — el traductor

Es el único archivo que se comunica con el backend, ya sea por IPC o
por HTTP. Contiene una función por cada acción posible (`getLibros`,
`solicitarPrestamo`, `renovarPrestamo`, etc.), y cada una decide
internamente si usar `window.libraryHub` o `fetch`, según lo explicado
en la sección 2.

### `data/utils.js` — cálculos que no requieren consultar al backend

Funciones como formatear una fecha, formatear un monto en pesos
chilenos, o calcular si un préstamo está "vencido", "por vencer" o "al
día". No hacen ningún pedido al backend — son cálculos puros sobre
datos que ya están disponibles en pantalla.

### `hooks/useToast.js` — las notificaciones

Maneja esas notificaciones breves que aparecen en una esquina cuando
una acción se completa con éxito o con error (por ejemplo, "Préstamo
registrado con éxito").

### `components/` — piezas reutilizables

- `layout/Layout.jsx`: el menú lateral y la cabecera que se muestran
  en todas las pantallas.
- `ui/`: piezas pequeñas y genéricas (`Badge` para etiquetas de color,
  `Spinner` para el indicador de carga, `Toast` para las
  notificaciones, `EmptyState` para el mensaje de "no hay nada que
  mostrar").
- `bibliotecario/BibliotecarioTabs.jsx`: las pestañas y las tarjetas
  de métricas del panel de administración, separadas en su propio
  archivo para no concentrar todo en la página principal.
- `libros/LibroDetalleComponents.jsx`: piezas pequeñas que arma la
  pantalla de detalle de un libro (por ejemplo, una fila de la ficha
  técnica).

### `pages/` — las pantallas completas

Cada carpeta corresponde a una pantalla: `Login`, `Libros` (buscar
libros), `LibroDetalle`, `MiPerfil` (préstamos y multas propias),
`MisReservas`, y `Bibliotecario` (panel de administración). Cada una
solicita sus propios datos al montarse y arma su propia interfaz.

---

## 4. El backend: qué hace cada carpeta de `server/`

### `server/services/` — el corazón de la lógica de negocio

Aquí vive **toda** la lógica real del sistema: qué ocurre cuando
alguien solicita un préstamo, cuándo se genera una multa, cuántas
veces se puede renovar, etc. Cada archivo se ocupa de un tema:

- `auth.service.js` — inicio de sesión y restauración de sesión.
- `sesion.service.js` — guarda quién está autenticado en cada momento
  (ver sección 6).
- `categorias.service.js`, `libros.service.js`, `prestamos.service.js`,
  `reservas.service.js`, `multas.service.js`, `miembros.service.js` —
  uno por cada tipo de dato del sistema.
- `exchange.service.js` — consulta la API pública **Frankfurter** para
  convertir montos a la moneda local (CLP) antes de que se persista
  una multa. No lo usa ninguna pantalla directamente: es un servicio
  de apoyo que solo llama `multas.service.js` (ver el recuadro más
  abajo).

Estos archivos **no saben** si los está llamando Electron o el
servidor web — son funciones normales de JavaScript que reciben
parámetros y devuelven un resultado. Por eso el mismo código sirve
para los dos modos, sin duplicar nada.

### `server/models/` — la forma de los datos

Cada archivo define cómo debe verse un documento en MongoDB: `Libro`,
`Miembro`, `Prestamo`, `Reserva`, `Multa`, `Categoria`. Especifican qué
campos tiene cada uno, cuáles son obligatorios, y de qué tipo es cada
uno (texto, número, fecha, etc.).

### Cómo se convierte una multa a moneda local

El caso pide que las multas se muestren en moneda local. Como todas
las multas del sistema ya nacen en pesos chilenos (el atraso se cobra
en CLP directamente), la conversión ocurre igual, pero de forma
"transparente": es una capa lista para el día en que una multa venga
en otra moneda, sin que el frontend tenga que cambiar nada.

El flujo es siempre el mismo, sin importar quién genere la multa:

1. Alguien pide crear una multa (`prestamos.service.js` cuando hay
   atraso, o `seed.js` al cargar datos de ejemplo). Ninguno de los dos
   inserta la multa directamente en MongoDB — ambos le delegan la
   tarea a `multas.service.js`.
2. `multas.service.js` expone `crearMulta()`, que primero le pregunta
   a `exchange.service.js` si hace falta convertir el monto.
3. `exchange.service.js` consulta la API pública **Frankfurter**
   (`https://api.frankfurter.dev/v2/rates?base=CLP`), que no requiere
   API key. Si la moneda de origen ya es CLP, ni siquiera hace la
   consulta. Las tasas se guardan en una cache en memoria por 6 horas,
   ya que Frankfurter solo actualiza sus valores una vez al día.
4. Si Frankfurter no responde (por ejemplo, sin conexión a internet),
   `exchange.service.js` nunca lanza un error: devuelve un aviso de
   fallo, y `crearMulta()` persiste la multa igual, asumiendo que el
   monto ya está en CLP.
5. Recién con el monto final decidido, `crearMulta()` guarda la multa
   en MongoDB.

El frontend no participa de nada de esto — `MiPerfil.jsx` solo agrega
la etiqueta "CLP" junto al monto para dejar explícito que lo que se
muestra ya es moneda local, pero sigue usando el mismo `formatCLP()`
de siempre.

### `server/config/db.js` — la conexión a MongoDB

Se encarga de conectar con la base de datos, usando la dirección
guardada en `server/.env` (`MONGODB_URI`).

### `server/index.js` — el servidor del modo web

Solo se utiliza cuando la aplicación corre en el navegador. Es un
servidor Express que recibe pedidos HTTP (como `GET /api/libros`), los
traduce a una llamada al service correspondiente, y devuelve el
resultado como JSON. No contiene ninguna lógica de negocio propia —
toda se delega a `server/services/`.

### `server/middleware/sesion-http.js` — quién está autenticado, en modo web

Como en modo web puede haber varias personas usando la aplicación al
mismo tiempo (cada una desde su propio navegador), es necesario
distinguir quién es quién. Este archivo mantiene una lista de
"tokens" (una especie de comprobante que se entrega a cada usuario al
autenticarse) y, antes de atender cada pedido, revisa qué token llegó
y carga a ese usuario como "el usuario actual" únicamente para ese
pedido puntual.

### `server/seed.js` — los datos de ejemplo

Un script que se ejecuta manualmente (`npm run seed`) y llena la base
de datos con libros, miembros y préstamos de prueba, para no tener que
cargar todo de forma manual.

---

## 5. Electron: qué hace `electron/`

### `electron/main.cjs` — el proceso principal

Es lo primero que arranca al abrir la aplicación de escritorio. Realiza,
en orden:

1. Se conecta a MongoDB.
2. Carga todos los `services/`.
3. Registra un "canal" por cada acción posible (por ejemplo,
   `prestamos:solicitar`), de modo que cuando React solicite algo por
   ese canal, se ejecute el service correspondiente.
4. Abre la ventana de la aplicación.

### `electron/preload.cjs` — el puente de confianza

Este archivo corre en un contexto especial, entre React y Electron,
con permisos limitados por seguridad. Su función es crear el objeto
`window.libraryHub` que React utiliza para solicitar información — cada
método de ese objeto (`getLibros`, `solicitarPrestamo`, etc.)
simplemente reenvía el pedido a `main.cjs` a través del canal
correspondiente.

---

## 6. Cómo se maneja la sesión (quién está autenticado)

Este es uno de los puntos más importantes para entender el proyecto,
porque funciona de manera distinta según el modo, aunque el resultado
que percibe el usuario es el mismo.

### La idea común a ambos modos

`server/services/sesion.service.js` guarda, en una variable llamada
`usuarioActual`, los datos de quién está autenticado en ese momento.
Los demás services, cuando necesitan saber "¿quién está haciendo este
pedido?" o "¿tiene permiso para esto?", consultan esa variable — nunca
le solicitan el usuario directamente a React.

### En modo escritorio

Como hay una sola persona usando la aplicación en su propio equipo,
basta con una única variable en memoria. Se establece al iniciar
sesión y se mantiene mientras la aplicación permanece abierta.

### En modo web

Como puede haber varias personas conectadas a la vez (cada una desde
su navegador), una sola variable no es suficiente — se sobrescribirían
entre sí. Por eso, en este modo, cada usuario recibe un "token" al
autenticarse (una cadena de texto única), que su navegador guarda y
reenvía en cada pedido. El servidor, antes de atender cada pedido,
identifica a qué usuario corresponde ese token y lo carga
momentáneamente en `usuarioActual` —solo para ese pedido puntual— y
lo limpia inmediatamente después.

### El problema que resuelve la "restauración de sesión"

Si se cierra la ventana de Electron (o se recarga la página en el
navegador) y luego se vuelve a abrir la aplicación, React todavía
recuerda quién es el usuario (porque lo guardó en `localStorage`),
pero el backend ya lo olvidó (la variable `usuarioActual` se
reinició, o el token ya no está en la lista del servidor). Para
resolver ese desfase, apenas arranca la aplicación, React le avisa al
backend "este es el usuario autenticado, ¿puedes reconocerlo de
nuevo?" — eso es lo que hace la función `restaurarSesion`. Mientras
esa confirmación está en curso, la aplicación muestra un indicador de
carga en lugar de habilitar las pantallas, para que ninguna de ellas
solicite datos al backend antes de que este sepa quién es el usuario.

---

## 7. Recorrido completo de cada acción del usuario

### Iniciar sesión

1. Se ingresan la cédula y la contraseña en `Login.jsx`.
2. `apiService.js` envía esos datos (por IPC o HTTP, según el modo).
3. `auth.service.js` busca al miembro por su cédula, compara la
   contraseña (guardada de forma cifrada, nunca en texto plano), y si
   coincide, marca a ese usuario como "el usuario actual".
4. Si todo es correcto, React guarda los datos del usuario y lo lleva
   a la pantalla que corresponda según su rol.

### Buscar libros

1. En `Libros.jsx`, se escribe algo en el buscador o se elige una
   categoría.
2. Tras una breve pausa (para no enviar un pedido por cada letra que
   se escribe), se le solicita a `libros.service.js` la lista
   filtrada.
3. Ese service busca en MongoDB los libros que coincidan, y devuelve
   una lista ya lista para mostrar (con la categoría convertida a
   texto, no como un código interno).
4. React dibuja la grilla de libros.

### Ver el detalle de un libro

1. Se hace clic en un libro.
2. Se solicitan tres cosas: los datos del libro, la cola de reservas
   de ese libro, y (si el usuario es miembro) si ya tenía una reserva
   sobre ese mismo libro.
3. Según haya copias disponibles o no, la pantalla muestra el botón de
   "Solicitar préstamo" o el de "Reservar".

### Solicitar un préstamo

1. Se hace clic en "Solicitar préstamo".
2. `prestamos.service.js` verifica que el libro tenga copias
   disponibles, calcula la fecha de devolución (14 días desde ese
   momento), descuenta una copia disponible del libro, y crea el
   préstamo.
3. Se muestra una notificación de éxito y la pantalla se actualiza
   automáticamente.

### Hacer una reserva

1. Si no hay copias disponibles, se hace clic en "Reservar".
2. `reservas.service.js` verifica que el usuario no tenga ya una
   reserva de ese mismo libro, calcula en qué posición de la cola
   queda (contando cuántas reservas activas hay antes de la suya), y
   la crea.
3. La pantalla muestra la posición asignada en la cola.

### Renovar un préstamo

1. Desde "Mi perfil", se hace clic en "Renovar" sobre uno de los
   préstamos activos.
2. `prestamos.service.js` verifica cuántas veces ya se renovó ese
   préstamo. Si todavía no se llegó al máximo (2 veces), suma 14 días
   más a la fecha de devolución. Si ya se alcanzó el máximo, informa
   que no se puede renovar más y que corresponde devolver el libro.

### Ver las multas

1. "Mi perfil" también muestra las multas pendientes — no requiere
   ninguna acción adicional, se solicitan automáticamente al ingresar
   a la pantalla.

### Registrar una devolución (solo bibliotecario)

1. Desde el panel de administración, el bibliotecario marca un
   préstamo como devuelto.
2. `prestamos.service.js` libera una copia del libro, guarda la fecha
   real de devolución, y si se devolvió con atraso, calcula los días
   de retraso y le pide a `multas.service.js` que cree la multa
   correspondiente (que a su vez pasa por `exchange.service.js`, ver
   sección 4).

---

## 8. Los modelos de datos: qué guarda cada colección

| Colección   | Qué guarda                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Libro`     | Título, autores, ISBN, categoría, cantidad total de copias y cuántas están disponibles.                                     |
| `Miembro`   | Cédula, nombre, contraseña (cifrada), rol (`miembro` o `bibliotecario`), y si está activo.                                  |
| `Prestamo`  | Qué libro, qué miembro, fecha de préstamo, fecha esperada de devolución, cuántas veces se renovó, y si ya fue devuelto.     |
| `Reserva`   | Qué libro, qué miembro, y en qué posición de la cola se encuentra.                                                          |
| `Multa`     | A qué préstamo corresponde, el monto, y si ya fue pagada.                                                                   |
| `Categoria` | El nombre de cada categoría de libros (por ejemplo, "Novela", "Ciencia").                                                    |

---

## 9. Mapa mental del proyecto completo

```
                                LibraryHub
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
        FRONTEND               BACKEND               ELECTRON
        (src/)                (server/)            (electron/)
             │                      │                      │
    ┌────────┼────────┐    ┌────────┼────────┐    ┌────────┴────────┐
    │        │        │    │        │        │    │                 │
 context/  data/   pages/ services/ models/ index.js  main.cjs   preload.cjs
    │        │        │    │        │  (solo   │        │             │
"quién   apiService  las  "reglas  "forma  modo   crea la   expone
está     (IPC o      seis  del      de los  web")  ventana   window.
autenti- fetch,      pan-  negocio"  datos"                 y los     libraryHub
cado"    según el    tallas  +                              canales   al frontend
         modo)             exchange.                        IPC
                            service.js
                            (conversión
                             de moneda)
```

**Cómo se relacionan, en una frase por pieza:**

- `context/AuthContext.jsx` le indica al resto del frontend quién está
  autenticado.
- `data/apiService.js` es el único que se comunica con el backend, y
  elige el modo automáticamente.
- `pages/` son las pantallas, cada una solicita sus propios datos.
- `server/services/` contiene toda la lógica de negocio real,
  compartida por ambos modos.
- `server/models/` define la forma de los datos en MongoDB.
- `server/index.js` solo existe para el modo web: traduce HTTP a
  llamadas a los services.
- `electron/main.cjs` solo existe para el modo escritorio: traduce IPC
  a llamadas a los services.
- `electron/preload.cjs` es el puente que le da a React acceso a
  `main.cjs`, de forma segura.

Con esto, cualquier funcionalidad del sistema se puede rastrear
siguiendo siempre el mismo camino: **página → `apiService.js` →
(IPC o HTTP) → service correspondiente → MongoDB → de vuelta hasta la
pantalla.**
