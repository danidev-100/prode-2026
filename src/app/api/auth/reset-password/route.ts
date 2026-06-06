import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contraseña son requeridos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Buscar token válido
    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 })
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: "Este token ya fue usado" }, { status: 400 })
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ error: "El token expiró. Solicitá uno nuevo." }, { status: 400 })
    }

    // Actualizar contraseña
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashed },
    })

    // Marcar token como usado
    await prisma.resetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ message: "Contraseña actualizada correctamente" })
  } catch (error) {
    console.error("[reset-password]", error)
    return NextResponse.json({ error: "Error al resetear la contraseña" }, { status: 500 })
  }
}
