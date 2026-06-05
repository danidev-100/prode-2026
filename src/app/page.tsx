import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import MatchList from "@/components/MatchList"

export default async function HomePage() {
  const session = await auth()

  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: {
      predictions: session?.user?.id
        ? {
            where: { userId: session.user.id },
            select: { homeGoals: true, awayGoals: true },
          }
        : false,
    },
  })

  const serialized = matches.map((m) => ({
    ...m,
    date: m.date.toISOString(),
    userPrediction: Array.isArray(m.predictions)
      ? m.predictions[0] || null
      : null,
  }))

  const finishedCount = matches.filter((m) => m.status === "FINISHED").length
  const totalMatches = matches.length

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
      {/* Hero */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Prode Mundial{" "}
          <span className="text-accent">2026</span>
        </h1>
        <p className="text-text-secondary mt-1.5 sm:mt-2 text-xs sm:text-sm max-w-md">
          11 junio – 19 julio · 48 selecciones · 104 partidos · Canadá, México, EE.UU.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 sm:mt-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-text-muted">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent shrink-0" />
            <span>{finishedCount}/{totalMatches} jugados</span>
          </div>
          {!session?.user && (
            <span className="text-[11px] sm:text-xs text-text-muted">
              ·{" "}
              <a href="/login" className="text-accent hover:underline font-medium">
                Ingresá
              </a>{" "}
              para pronosticar
            </span>
          )}
        </div>
      </div>

      <MatchList matches={serialized as any} isLoggedIn={!!session?.user} />
    </div>
  )
}
