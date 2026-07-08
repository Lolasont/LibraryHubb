// Archivo preload de Electron.
// Expone un objeto window.libraryHub al renderer (React) con un metodo
// por cada canal IPC definido en electron/main.cjs. Los nombres de los
// metodos coinciden a proposito con los nombres de funciones que ya usa
// src/data/apiService.js, para que el Paso 5 sea mecanico.

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('libraryHub', {
  isElectron: true,

  // ── auth ───────────────────────────────────────────────
  login: (cedula, password) => ipcRenderer.invoke('auth:login', cedula, password),
  restaurarSesion: (userId) => ipcRenderer.invoke('auth:restaurarSesion', userId),

  // ── categorias ─────────────────────────────────────────
  getCategorias: () => ipcRenderer.invoke('categorias:listar'),

  // ── libros ─────────────────────────────────────────────
  getLibros:    (filtros) => ipcRenderer.invoke('libros:buscar', filtros),
  getLibroById: (id)       => ipcRenderer.invoke('libros:detalle', id),

  // ── prestamos ──────────────────────────────────────────
  getPrestamosActivos: ()                  => ipcRenderer.invoke('prestamos:misActivos'),
  getTodosPrestamos:   ()                  => ipcRenderer.invoke('prestamos:listarTodos'),
  solicitarPrestamo:   (libroId)           => ipcRenderer.invoke('prestamos:solicitar', libroId),
  renovarPrestamo:     (prestamoId)        => ipcRenderer.invoke('prestamos:renovar', prestamoId),
  registrarDevolucion: (prestamoId)        => ipcRenderer.invoke('prestamos:devolver', prestamoId),

  // ── reservas ───────────────────────────────────────────
  getReservasByMiembro: ()              => ipcRenderer.invoke('reservas:misReservas'),
  getReservasByLibro:   (libroId)       => ipcRenderer.invoke('reservas:porLibro', libroId),
  getTodasReservas:     ()              => ipcRenderer.invoke('reservas:listarTodas'),
  hacerReserva:         (libroId)       => ipcRenderer.invoke('reservas:crear', libroId),
  cancelarReserva:      (reservaId)     => ipcRenderer.invoke('reservas:cancelar', reservaId),

  // ── multas ─────────────────────────────────────────────
  getMultasByMiembro: () => ipcRenderer.invoke('multas:misMultas'),
  getTodasMultas:     () => ipcRenderer.invoke('multas:listarTodas'),

  // ── miembros ───────────────────────────────────────────
  getMiembros: () => ipcRenderer.invoke('miembros:listar'),
})
