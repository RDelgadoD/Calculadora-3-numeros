/**
 * Wrapper para el backend Express en Vercel Serverless Functions
 * Este archivo permite que el backend funcione como función serverless en Vercel
 */

// Cargar variables de entorno
import dotenv from 'dotenv'
dotenv.config()

// Importar la app de Express del backend
import app from '../backend/app.js'

// Exportar como función serverless de Vercel
// Vercel espera una función que reciba (req, res)
export default (req, res) => {
  return app(req, res)
}

