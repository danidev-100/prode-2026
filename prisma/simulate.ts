import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function points(predH: number, predA: number, actH: number, actA: number) {
  let p = 0
  if (Math.sign(predH - predA) === Math.sign(actH - actA)) p += 2
  if (predH === actH && predA === actA) p += 1
  return p
}

async function simulate() {
  console.log("=== SIMULACIÓN PRODE MUNDIAL 2026 ===\n")

  const hashed = await bcrypt.hash("test123", 12)
  const user = await prisma.user.upsert({
    where: { email: "dani@prode.com" },
    update: {},
    create: { name: "Dani", email: "dani@prode.com", password: hashed },
  })
  console.log(`Usuario: ${user.name} (${user.email}) / pass: test123\n`)

  const matches = await prisma.match.findMany({ orderBy: { matchNumber: "asc" } })

  // Setear resultados inventados para los primeros 8 partidos (fase de grupos)
  const fakeResults: [number, number][] = [
    [3, 1], [1, 0], [2, 2], [0, 2],
    [1, 1], [2, 0], [0, 0], [3, 2],
  ]

  console.log("--- Resultados simulados (partidos #1-#8) ---")
  for (let i = 0; i < 8; i++) {
    const m = matches[i]
    await prisma.match.update({
      where: { id: m.id },
      data: { homeGoals: fakeResults[i][0], awayGoals: fakeResults[i][1], status: "FINISHED" },
    })
    console.log(
      `  #${m.matchNumber} ${m.homeTeam || "?"} ${fakeResults[i][0]}-${fakeResults[i][1]} ${m.awayTeam || "?"}`
    )
  }

  // Pronósticos de Dani - algunos correctos, otros no
  const predictions: [number, number, number][] = [
    // match#  result  prediction
    [1, 3, 1],   // 3-1 exacto → 3 puntos
    [2, 1, 0],   // exacto → 3
    [3, 1, 0],   // pred 1-0, real 2-2 → 0 (resultado distinto)
    [4, 2, 1],   // pred 2-1, real 0-2 → 0 (resultado distinto)
    [5, 1, 1],   // exacto empate 1-1 → 3
    [6, 1, 0],   // pred 1-0, real 2-0 → 2 (resultado correcto, no exacto)
    [7, 2, 1],   // pred 2-1, real 0-0 → 0
    [8, 2, 1],   // pred 2-1, real 3-2 → 2 (resultado correcto, no exacto)
  ]

  console.log("\n--- Pronósticos de Dani ---")
  let total = 0
  for (const [matchNum, predH, predA] of predictions) {
    const m = matches[matchNum - 1]
    const pts = points(predH, predA, fakeResults[matchNum - 1][0], fakeResults[matchNum - 1][1])
    total += pts

    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId: m.id } },
      update: { homeGoals: predH, awayGoals: predA, points: pts },
      create: { userId: user.id, matchId: m.id, homeGoals: predH, awayGoals: predA, points: pts },
    })

    const icons: Record<number, string> = { 0: "❌", 2: "✅", 3: "🌟" }
    console.log(
      `  #${matchNum} ${m.homeTeam} vs ${m.awayTeam}: pred ${predH}-${predA} | real ${fakeResults[matchNum-1][0]}-${fakeResults[matchNum-1][1]} | ${icons[pts]} ${pts}pts`
    )
  }
  console.log(`  TOTAL Dani: ${total} puntos\n`)

  // Crear un segundo usuario para ver ranking
  const user2 = await prisma.user.upsert({
    where: { email: "juan@prode.com" },
    update: {},
    create: { name: "Juan", email: "juan@prode.com", password: hashed },
  })

  const juanPreds: [number, number, number][] = [
    [1, 2, 0], [2, 2, 1], [3, 1, 1], [4, 1, 2],
    [5, 0, 0], [6, 1, 0], [7, 0, 2], [8, 4, 1],
  ]
  let juanTotal = 0
  console.log("--- Pronósticos de Juan ---")
  for (const [matchNum, predH, predA] of juanPreds) {
    const m = matches[matchNum - 1]
    const pts = points(predH, predA, fakeResults[matchNum - 1][0], fakeResults[matchNum - 1][1])
    juanTotal += pts

    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user2.id, matchId: m.id } },
      update: { homeGoals: predH, awayGoals: predA, points: pts },
      create: { userId: user2.id, matchId: m.id, homeGoals: predH, awayGoals: predA, points: pts },
    })

    const icons: Record<number, string> = { 0: "❌", 2: "✅", 3: "🌟" }
    console.log(
      `  #${matchNum}: pred ${predH}-${predA} | ${icons[pts]} ${pts}pts`
    )
  }
  console.log(`  TOTAL Juan: ${juanTotal} puntos\n`)

  // Pronósticos para partidos FUTUROS (todavía no jugados)
  const futurePreds: [number, number][] = [
    [2, 1], [0, 0], [1, 3], [3, 0], [1, 1], [2, 0],
  ]
  console.log("--- Pronósticos a futuro (#9-#14) ---")
  for (let i = 0; i < 6; i++) {
    const m = matches[8 + i]
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId: m.id } },
      update: { homeGoals: futurePreds[i][0], awayGoals: futurePreds[i][1] },
      create: {
        userId: user.id,
        matchId: m.id,
        homeGoals: futurePreds[i][0],
        awayGoals: futurePreds[i][1],
      },
    })
    console.log(
      `  #${m.matchNumber} ${m.homeTeam} vs ${m.awayTeam}: ${futurePreds[i][0]}-${futurePreds[i][1]}`
    )
  }

  // Ranking final
  const allUsers = await prisma.user.findMany({
    include: {
      predictions: { include: { match: true } },
    },
  })

  const ranked = allUsers
    .map((u) => {
      let tp = 0
      for (const p of u.predictions) {
        if (p.match.status === "FINISHED" && p.points !== null) tp += p.points
      }
      return { name: u.name, points: tp, totalPreds: u.predictions.length }
    })
    .sort((a, b) => b.points - a.points)

  console.log("\n=== 🏆 RANKING 🏆 ===")
  ranked.forEach((r, i) => {
    const medals = ["🥇", "🥈", "🥉"]
    console.log(
      `  ${medals[i] || ""} ${i + 1}. ${r.name} - ${r.points}pts (${r.totalPreds} pronósticos)`
    )
  })

  await prisma.$disconnect()
}

simulate().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
