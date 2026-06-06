import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // No revelar si el email existe o no — misma respuesta
      return NextResponse.json({
        message: "Si el email está registrado, recibirás un enlace para resetear tu contraseña.",
      })
    }

    // Invalidar tokens anteriores del mismo usuario
    await prisma.resetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date(0) }, // expirar tokens viejos
    })

    // Generar token seguro
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora de validez

    await prisma.resetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${token}`

    // En desarrollo, devolvemos el link directamente (útil para testing)
    // En producción, acá iría el envío de email
    console.log(`[RESET PASSWORD] Link para ${email}: ${resetUrl}`)

    // Intentar enviar email si hay servicio configurado
    const emailSent = await sendResetEmail(email, resetUrl)

    return NextResponse.json({
      message: "Si el email está registrado, recibirás un enlace para resetear tu contraseña.",
      ...(!emailSent ? { devLink: resetUrl } : {}),
    })
  } catch (error) {
    console.error("[forgot-password]", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

async function sendResetEmail(_email: string, _resetUrl: string): Promise<boolean> {
  // TODO: Integrar con un servicio de email en producción (Resend, SendGrid, Nodemailer, etc.)
  // Por ahora solo logueamos y retornamos false
  return false
}
