import { prisma } from "@/lib/prisma"
import { calculatePoints } from "@/lib/scoring"

export const dynamic = "force-dynamic"

export default async function RankingPage() {
  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: { match: true },
      },
    },
  })

  const ranked = users
    .map((user) => {
      let totalPoints = 0
      let correctResults = 0
      let exactScores = 0
      let misses = 0

      for (const pred of user.predictions) {
        if (
          pred.match.status === "FINISHED" &&
          pred.match.homeGoals !== null &&
          pred.match.awayGoals !== null
        ) {
          const pts = calculatePoints(
            pred.homeGoals,
            pred.awayGoals,
            pred.match.homeGoals,
            pred.match.awayGoals
          )
          totalPoints += pts
          if (pts >= 2) correctResults++
          if (pts === 3) exactScores++
          if (pts === 0) misses++
        }
      }

      return {
        id: user.id,
        name: user.name || "Anónimo",
        points: totalPoints,
        predictions: user.predictions.length,
        correctResults,
        exactScores,
        misses,
      }
    })
    .sort((a, b) => b.points - a.points)

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
      {/* Header */}
      <div className="relative mb-6 sm:mb-8">
        <div className="absolute -inset-2 bg-gradient-to-br from-gold/5 via-transparent to-accent/5 rounded-2xl blur-xl pointer-events-none" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 text-gold text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
            🏆 Tabla de posiciones
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Ranking <span className="text-gold">Mundial 2026</span>
          </h1>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <div className="text-4xl sm:text-5xl mb-3">🏆</div>
          <p className="text-text-muted text-sm sm:text-base">
            Todavía no hay usuarios con pronósticos
          </p>
          <p className="text-text-muted text-xs sm:text-sm mt-1">
            ¡Registrate y empezá a sumar puntos!
          </p>
        </div>
      ) : (
        <>
          {/* Podium - only on sm+ */}
          {ranked.length >= 3 && (
            <div className="hidden sm:flex items-end justify-center gap-4 mb-10 h-44">
              {/* 2nd */}
              <div className="flex flex-col items-center w-28">
                <span className="text-2xl mb-1">🥈</span>
                <span className="font-semibold text-xs text-center truncate w-full px-1">
                  {ranked[1].name}
                </span>
                <div
                  className="w-full bg-bg-tertiary border border-silver/20 rounded-t-lg mt-2 flex items-center justify-center"
                  style={{ height: "80px" }}
                >
                  <span className="text-xl font-bold tabular-nums text-silver">
                    {ranked[1].points}
                  </span>
                </div>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center w-28">
                <span className="text-3xl mb-1">🥇</span>
                <span className="font-semibold text-xs text-center truncate w-full px-1 text-gold">
                  {ranked[0].name}
                </span>
                <div
                  className="w-full bg-gradient-to-b from-gold/20 to-gold/5 border border-gold/30 rounded-t-lg mt-2 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                  style={{ height: "104px" }}
                >
                  <span className="text-2xl font-bold tabular-nums text-gold">
                    {ranked[0].points}
                  </span>
                </div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center w-28">
                <span className="text-2xl mb-1">🥉</span>
                <span className="font-semibold text-xs text-center truncate w-full px-1">
                  {ranked[2].name}
                </span>
                <div
                  className="w-full bg-bg-tertiary border border-bronze/20 rounded-t-lg mt-2 flex items-center justify-center"
                  style={{ height: "64px" }}
                >
                  <span className="text-lg font-bold tabular-nums text-bronze">
                    {ranked[2].points}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile top 3 cards */}
          {ranked.length >= 3 && (
            <div className="sm:hidden grid grid-cols-3 gap-2 mb-6">
              {[ranked[1], ranked[0], ranked[2]].map((user, i) => {
                const pos = [2, 1, 3][i]
                const medals = ["", "🥇", "🥈", "🥉"]
                const borders = ["", "border-gold/30", "border-silver/20", "border-bronze/20"]
                const texts = ["", "text-gold", "text-silver", "text-bronze"]
                return (
                  <div
                    key={user.id}
                    className={`bg-bg-secondary border ${borders[pos]} rounded-xl p-3 text-center
                      ${pos === 1 ? "bg-gradient-to-b from-gold/10 to-transparent" : ""}`}
                  >
                    <span className="text-xl">{medals[pos]}</span>
                    <div className="text-xs font-medium truncate mt-1">{user.name}</div>
                    <div className={`text-lg font-bold tabular-nums mt-1 ${texts[pos]}`}>
                      {user.points}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">pts</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Table - responsive */}
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[36px_1fr_56px] sm:grid-cols-[48px_1fr_64px_56px_56px_56px] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-tertiary/50 border-b border-border">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                #
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Usuario
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">
                Pts
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">
                Aciertos
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">
                Exactos
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">
                Erradas
              </span>
            </div>

            {ranked.map((user, i) => {
              const isTop3 = i < 3
              const medalColors = [
                "bg-gradient-to-r from-gold/5 to-transparent border-l-2 border-l-gold/40",
                "bg-gradient-to-r from-silver/5 to-transparent border-l-2 border-l-silver/30",
                "bg-gradient-to-r from-bronze/5 to-transparent border-l-2 border-l-bronze/30",
              ]

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-[36px_1fr_56px] sm:grid-cols-[48px_1fr_64px_56px_56px_56px] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 
                    border-b border-border/40 last:border-0 hover:bg-bg-tertiary/30 transition-colors duration-150
                    ${isTop3 ? medalColors[i] : ""}`}
                >
                  <span
                    className={`font-bold text-xs sm:text-sm tabular-nums self-center ${
                      isTop3 ? (i === 0 ? "text-gold" : i === 1 ? "text-silver" : "text-bronze") : "text-text-secondary"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium text-xs sm:text-sm truncate self-center">
                    {user.name}
                  </span>
                  <span className="text-right font-bold text-xs sm:text-sm tabular-nums self-center">
                    {user.points}
                  </span>
                  <span className="hidden sm:block text-right text-xs text-text-muted tabular-nums self-center">
                    {user.correctResults}
                  </span>
                  <span className="hidden sm:block text-right text-xs text-text-muted tabular-nums self-center">
                    {user.exactScores}
                  </span>
                  <span className="hidden sm:block text-right text-xs text-danger tabular-nums self-center">
                    {user.misses}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Mobile legend */}
          <div className="sm:hidden flex items-center justify-center gap-4 mt-3 text-[10px] text-text-muted">
            <span>✅ Acierto: 2pts</span>
            <span>🎯 Exacto: +1pt</span>
            <span>❌ Errado: 0pts</span>
          </div>
        </>
      )}
    </div>
  )
}
