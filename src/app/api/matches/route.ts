import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: {
      predictions: { select: { userId: true, homeGoals: true, awayGoals: true, points: true } },
    },
  })

  return NextResponse.json(matches)
}
