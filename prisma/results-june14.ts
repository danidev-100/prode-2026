import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function points(predH: number, predA: number, actH: number, actA: number) {
  let p = 0
  if (Math.sign(predH - predA) === Math.sign(actH - actA)) p += 2
  if (predH === actH && predA === actA) p += 1
  return p
}

async function setJune14Results() {
  console.log("=== RESULTADOS 14 DE JUNIO ===\n")

  const results: [number, number, number, number][] = [
    [9, 2, 0],   // Ivory Coast 2-0 Ecuador
    [10, 4, 1],  // Germany 4-1 Curaçao
    [11, 2, 2],  // Netherlands 2-2 Japan
    [12, 1, 0],  // Sweden 1-0 Tunisia
  ]

  for (const [matchNum, homeG, awayG] of results) {
    const match = await prisma.match.findUnique({ where: { matchNumber: matchNum } })
    if (!match) continue

    await prisma.match.update({
      where: { matchNumber: matchNum },
      data: { homeGoals: homeG, awayGoals: awayG, status: "FINISHED" },
    })

    console.log(
      `  #${matchNum} ${match.homeTeam} ${homeG}-${awayG} ${match.awayTeam}`
    )

    // Recalcular puntos para este partido
    const preds = await prisma.prediction.findMany({
      where: { matchId: match.id },
      include: { user: true },
    })

    for (const pred of preds) {
      const pts = points(pred.homeGoals, pred.awayGoals, homeG, awayG)
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { points: pts },
      })
      const icons: Record<number, string> = { 0: "❌", 2: "✅", 3: "🌟" }
      console.log(
        `    ${pred.user.name}: pred ${pred.homeGoals}-${pred.awayGoals} | ${icons[pts]} ${pts}pts`
      )
    }
    console.log("")
  }

  // Ranking actualizado
  const allUsers = await prisma.user.findMany({
    include: {
      predictions: { include: { match: true } },
    },
  })

  console.log("=== RANKING ACTUALIZADO ===")
  const ranked = allUsers
    .map((u) => {
      let tp = 0
      for (const p of u.predictions) {
        if (p.match.status === "FINISHED" && p.points !== null) tp += p.points
      }
      return { name: u.name || "?", points: tp, preds: u.predictions.length }
    })
    .sort((a, b) => b.points - a.points)

  ranked.forEach((r, i) => {
    const medals = ["🥇", "🥈", "🥉"]
    console.log(
      `  ${medals[i] || ` ${i + 1}.`} ${r.name} - ${r.points}pts (${r.preds} pronósticos)`
    )
  })

  await prisma.$disconnect()
}

setJune14Results().catch((e) => { console.error(e); process.exit(1) })
