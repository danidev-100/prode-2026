import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculatePoints } from "@/lib/scoring"

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { matchId, homeGoals, awayGoals, status, homeTeam, awayTeam } = await req.json()

  if (!matchId) {
    return NextResponse.json(
      { error: "matchId requerido" },
      { status: 400 }
    )
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) {
    return NextResponse.json(
      { error: "Partido no encontrado" },
      { status: 404 }
    )
  }

  // If goals are provided, auto-set status to FINISHED
  const effectiveStatus =
    typeof homeGoals === "number" && typeof awayGoals === "number"
      ? "FINISHED"
      : status || match.status

  const data: Record<string, unknown> = { status: effectiveStatus }
  if (typeof homeGoals === "number") data.homeGoals = homeGoals
  if (typeof awayGoals === "number") data.awayGoals = awayGoals
  if (typeof homeTeam === "string") data.homeTeam = homeTeam
  if (typeof awayTeam === "string") data.awayTeam = awayTeam

  const updated = await prisma.match.update({
    where: { id: matchId },
    data,
  })

  // Recalculate points for all predictions on this match
  if (
    typeof homeGoals === "number" &&
    typeof awayGoals === "number" &&
    effectiveStatus === "FINISHED"
  ) {
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    })

    for (const pred of predictions) {
      const points = calculatePoints(
        pred.homeGoals,
        pred.awayGoals,
        homeGoals,
        awayGoals
      )
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { points },
      })
    }
  }

  return NextResponse.json(updated)
}
