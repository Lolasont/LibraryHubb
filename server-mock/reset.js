// Restaura db.json a su estado inicial copiando db.seed.json.
// Util para volver a un estado conocido despues de probar el flujo completo.
//
// Uso: npm run reset

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const DB_PATH   = path.join(__dirname, 'db.json')
const SEED_PATH = path.join(__dirname, 'db.seed.json')

if (!fs.existsSync(SEED_PATH)) {
  console.error('No se encontro db.seed.json — nada que restaurar.')
  process.exit(1)
}

fs.copyFileSync(SEED_PATH, DB_PATH)
console.log('db.json restaurado desde db.seed.json.')
console.log('Reinicia el servidor para que tome el estado limpio.')
