# Por qué LibraryHub no usa Electron

## Introducción

Durante el desarrollo de LibraryHub se nos planteó la pregunta de por qué
el proyecto no utiliza Electron, dado que algunos compañeros lo incorporaron
en sus implementaciones. Este documento responde esa pregunta en detalle:
explica qué es Electron, cuál es el problema que resuelve, cómo LibraryHub
resuelve ese mismo problema de una forma diferente, y por qué esa decisión
es la correcta para este caso de uso específico.

---

## El problema que Electron viene a resolver

Para entender por qué algunos proyectos usan Electron, primero hay que
entender una restricción fundamental del navegador web:

> **El navegador no puede conectarse directamente a MongoDB.**

Esto no es un error ni una limitación del lenguaje. Es una decisión de
seguridad deliberada: si cualquier página web pudiera abrir conexiones
directas a bases de datos, cualquier sitio que un usuario visitara podría
acceder a datos sensibles de su computador o de una red local. Por eso el
navegador bloquea ese tipo de conexiones.

El mismo manual entregado en clase lo confirma con esta frase:

> *"Por seguridad, React no puede hablar directamente con MongoDB.
> Necesitamos a Electron como intermediario."*

Electron resuelve esto de una forma particular: en lugar de ejecutar la
aplicación en el navegador, la envuelve en una ventana de escritorio que
tiene acceso a Node.js. Al tener acceso a Node.js, puede usar Mongoose y
conectarse a MongoDB directamente, sin pasar por el navegador.

El recorrido de un dato con Electron es este:

```
React (interfaz)
   → preload.js (puente seguro)
      → electron.js (Node.js con Mongoose)
         → MongoDB
```

Es una solución válida. Pero viene con una consecuencia importante que
muchos proyectos no consideran: **la aplicación deja de ser una página web
y se convierte en una aplicación de escritorio que hay que instalar en cada
máquina**.

---

## Cómo LibraryHub resuelve el mismo problema

LibraryHub resuelve exactamente la misma restricción del navegador, pero
con una arquitectura diferente: en lugar de darle acceso a Node.js al
navegador mediante Electron, introduce un servidor separado que hace ese
trabajo.

El recorrido de un dato en LibraryHub es este:

```
React (interfaz)
   → apiService.js (petición HTTP con fetch)
      → Express en server/ o server-mock/ (Node.js con Mongoose)
         → MongoDB o db.json
```

El servidor Express es exactamente el intermediario que el manual describe.
La diferencia es que en LibraryHub ese intermediario es un proceso
independiente que escucha en un puerto (5000 para el backend principal,
5001 para el alternativo), en lugar de estar empaquetado dentro de
Electron.

El resultado final para el usuario es idéntico: los datos viajan desde
MongoDB hasta la pantalla. La diferencia está en cómo están organizadas
las piezas por dentro.

---

## Comparación directa

| Aspecto | Con Electron | Con Express (LibraryHub) |
|---|---|---|
| Tipo de aplicación | App de escritorio (hay que instalar) | App web (funciona en cualquier navegador) |
| Acceso del usuario | Solo desde el equipo donde está instalada | Desde cualquier dispositivo con navegador |
| Intermediario con MongoDB | Electron + Node.js integrados | Servidor Express separado |
| Separación de responsabilidades | Frontend y backend en el mismo proceso | Frontend y backend claramente separados |
| Actualización del sistema | Hay que redistribuir e instalar de nuevo | El cambio en el servidor llega a todos de inmediato |
| Disponibilidad sin MongoDB | No tiene plan B | `server-mock/` con `db.json` como respaldo |
| Acceso desde otro dispositivo | No es posible sin configuración adicional | Sí, con Forward Port o despliegue en servidor |

---

## Por qué la arquitectura de LibraryHub es la correcta para este caso de uso

La elección de arquitectura no debería hacerse en función de lo que es más
fácil de implementar, sino de lo que mejor responde a las necesidades reales
del sistema que se está construyendo. En este caso, el requerimiento describe
una **biblioteca municipal** con 10.000 miembros activos. Ese contexto hace
que Electron sea una elección incorrecta por las siguientes razones:

### 1. El sistema necesita ser accesible para todo tipo de usuarios

Los miembros de una biblioteca municipal incluyen personas de edades y
niveles de experiencia tecnológica muy distintos: estudiantes, adultos,
adultos mayores. Una aplicación web funciona en cualquier navegador moderno,
en cualquier sistema operativo y en cualquier dispositivo, incluyendo
celulares y tablets. Una aplicación Electron requiere que el usuario
descargue un instalador, lo ejecute, y lo mantenga actualizado. Eso
representa una barrera de acceso que no tiene sentido imponer para un
servicio público como una biblioteca.

### 2. Los cambios tienen que llegar a todos los usuarios a la vez

Si el bibliotecario agrega un libro nuevo al catálogo o se corrige un error
en el sistema, con una aplicación web todos los usuarios ven el cambio la
próxima vez que cargan la página. Con Electron habría que distribuir una
nueva versión de la aplicación y esperar que cada usuario la instale. En un
sistema con 10.000 miembros, eso no es viable.

### 3. La separación entre frontend y backend es una buena práctica de ingeniería

En LibraryHub, el frontend (React) y el backend (Express) son dos programas
completamente independientes que se comunican a través de una interfaz bien
definida: la API. Cada uno puede entenderse, modificarse y probarse por
separado. Con Electron, el código que dibuja la pantalla y el código que
habla con la base de datos viven mezclados en el mismo proceso, lo que
dificulta el mantenimiento y la comprensión del sistema.

La documentación técnica de LibraryHub describe esta separación en su
sección de resumen:

> *"Cada pieza hace una sola cosa y confía en que las demás piezas hacen
> bien la suya — eso es lo que permite que un proyecto con tantas partes
> se mantenga entendible."*

### 4. La seguridad se maneja de forma más robusta

En LibraryHub, MongoDB nunca queda expuesta al navegador. Todo acceso a la
base de datos pasa por el servidor Express, que verifica la identidad del
usuario mediante JWT antes de ejecutar cualquier operación. El middleware
`verifyToken` y `requireRole` garantizan que solo quien tiene una sesión
válida y el rol correcto puede realizar cada acción.

Con Electron, la conexión directa a MongoDB puede exponer las credenciales
de la base de datos si la aplicación es inspeccionada, ya que el código de
Node.js queda empaquetado dentro del instalador.

### 5. El sistema tiene un plan B que Electron no puede ofrecer

Una de las características más relevantes de LibraryHub es que incluye dos
backends intercambiables: `server/` que usa MongoDB, y `server-mock/` que
usa un archivo `db.json` en lugar de una base de datos real. El frontend no
sabe cuál está usando — solo cambia la variable `VITE_API_URL` en el archivo
`.env`.

```
# Backend principal con MongoDB
VITE_API_URL=http://localhost:5000/api

# Backend alternativo sin MongoDB
VITE_API_URL=http://localhost:5001/api
```

Esto significa que si MongoDB no está disponible — por ejemplo, durante una
demo o en un equipo donde no está instalado — el sistema completo sigue
funcionando con datos persistentes guardados en `db.json`. Esa flexibilidad
no existe en una arquitectura basada en Electron, donde la única fuente de
datos es MongoDB.

---

## Lo que Electron resuelve que LibraryHub ya tiene resuelto de otra forma

El manual de Electron del curso describe el problema central así:

> *"React no puede hablar directamente con MongoDB. Necesitamos a Electron
> como intermediario."*

LibraryHub tiene ese intermediario. Se llama Express, corre en el puerto
5000, y hace exactamente el mismo trabajo que haría Electron: recibe
peticiones de React, habla con MongoDB, y devuelve los datos. La diferencia
es que ese intermediario es un servidor independiente en lugar de una capa
dentro de una aplicación de escritorio.

Agregar Electron encima de esta arquitectura no resolvería ningún problema
nuevo. Solo agregaría complejidad innecesaria: habría dos intermediarios
(Electron y Express) haciendo el mismo trabajo, y la aplicación perdería su
capacidad de funcionar como una página web accesible desde cualquier
dispositivo.

---

## Conclusión

Electron no fue eliminado de LibraryHub porque nunca fue la herramienta
adecuada para este caso de uso. El problema que Electron resuelve — que el
navegador no puede conectarse directamente a MongoDB — se resolvió aquí
mediante una arquitectura cliente-servidor estándar con Express como
intermediario, que es la forma en que se construyen las aplicaciones web
profesionales.

La elección no fue una omisión ni una limitación del proyecto. Fue una
decisión de diseño consciente, tomada en función del tipo de sistema que el
requerimiento describe: una plataforma accesible para una biblioteca de uso
público, que cualquier miembro pueda usar desde cualquier dispositivo, sin
instalar nada, y que el equipo de la biblioteca pueda mantener y actualizar
desde un único lugar.
