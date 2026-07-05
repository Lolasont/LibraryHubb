// Punto de entrada de la aplicacion React.
// 1. Crea el "root" donde React va a dibujar la UI.
// 2. Habilita el modo estricto de React (avisa sobre codigo inseguro).
// 3. Monta el router y el proveedor de autenticacion por encima de <App />.

import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
