import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { matchId, homeGoals, awayGoals } = await req.json()

  if (
    typeof homeGoals !== "number" ||
    typeof awayGoals !== "number" ||
    homeGoals < 0 ||
    awayGoals < 0
  ) {
    return NextResponse.json({ error: "Goles inválidos" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 })
  }

  const lockTime = new Date(match.date.getTime() - 3 * 60 * 60 * 1000)
  if (new Date() > lockTime) {
    return NextResponse.json(
      { error: "El partido ya está cerrado (3hs antes del inicio)" },
      { status: 400 }
    )
  }

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: session.user.id,
        matchId,
      },
    },
    update: { homeGoals, awayGoals },
    create: {
      userId: session.user.id,
      matchId,
      homeGoals,
      awayGoals,
    },
  })

  return NextResponse.json(prediction)
}
