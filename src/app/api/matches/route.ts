import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: {
      predictions: { select: { userId: true, homeGoals: true, awayGoals: true } },
    },
  })

  return NextResponse.json(matches)
}
