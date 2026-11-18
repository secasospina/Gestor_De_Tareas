/**
 * Cliente de AWS SES compartido por las funciones.
 * Las credenciales vienen de variables de entorno que solo existen en el servidor.
 */
import { SESv2Client } from '@aws-sdk/client-sesv2'
import { requireEnv } from './http.js'

export function createSesClient(): SESv2Client {
  return new SESv2Client({
    region: requireEnv('SES_REGION'),
    credentials: {
      accessKeyId: requireEnv('SES_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('SES_SECRET_ACCESS_KEY'),
    },
  })
}
