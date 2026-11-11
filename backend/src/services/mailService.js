import nodemailer from 'nodemailer'
import process from 'node:process'

let transporter

function getTransporter() {
  if (!process.env.SMTP_HOST) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    })
  }
  return transporter
}

export async function sendPasswordResetEmail({ to, nombre, resetUrl, minutosVigencia }) {
  const mailer = getTransporter()

  if (!mailer) {
    // Sin SMTP configurado (desarrollo local) el enlace se muestra en consola para poder probar el flujo.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP_HOST no está configurado: no es posible enviar el correo de recuperación.')
    }
    console.info(`[HU-04] Enlace de recuperación para ${to}: ${resetUrl}`)
    return
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'TechService <no-reply@techservice.local>',
    to,
    subject: 'Restablece tu contraseña de TechService',
    text: [
      `Hola ${nombre},`,
      '',
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta de TechService.',
      `Abre este enlace para crear una nueva contraseña (vence en ${minutosVigencia} minutos y solo puede usarse una vez):`,
      resetUrl,
      '',
      'Si no solicitaste este cambio, ignora este correo: tu contraseña actual seguirá funcionando.',
    ].join('\n'),
  })
}
