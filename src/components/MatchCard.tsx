"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getFlagUrl } from "@/lib/flags"

interface MatchCardProps {
  id: string
  matchNumber: number
  homeTeam: string | null
  awayTeam: string | null
  homeGoals: number | null
  awayGoals: number | null
  date: string
  venue: string
  group: string | null
  stage: string
  status: string
  userPrediction: { homeGoals: number; awayGoals: number } | null
}

const stageBadge: Record<string, { label: string; color: string }> = {
  GROUP: { label: "Grupo", color: "bg-bg-tertiary text-text-secondary" },
  R32: { label: "16avos", color: "bg-accent-muted text-accent" },
  R16: { label: "8avos", color: "bg-accent-muted text-accent" },
  QUARTER: { label: "Cuartos", color: "bg-gold-muted text-gold" },
  SEMI: { label: "Semi", color: "bg-gold-muted text-gold" },
  THIRD_PLACE: { label: "3er Puesto", color: "bg-bronze/20 text-bronze" },
  FINAL: { label: "Final", color: "bg-gold-muted text-gold" },
}

export default function MatchCard({
  id,
  matchNumber,
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  date,
  venue,
  group,
  stage,
  status,
  userPrediction,
}: MatchCardProps) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [home, setHome] = useState(userPrediction?.homeGoals?.toString() ?? "")
  const [away, setAway] = useState(userPrediction?.awayGoals?.toString() ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!userPrediction)
  const [error, setError] = useState("")

  const matchDate = new Date(date)
  const lockDate = new Date(matchDate.getTime() - 3 * 60 * 60 * 1000)
  const isLocked = new Date() > lockDate
  const isFinished = status === "FINISHED"
  const isLoggedIn = sessionStatus === "authenticated"
  const showForm = !isFinished && isLoggedIn && !isLocked
  const showLogin = !isFinished && !isLoggedIn

  const displayHome = homeTeam || `Equipo ${group || ""}1`
  const displayAway = awayTeam || `Equipo ${group || ""}2`
  const badge = stageBadge[stage] || stageBadge.GROUP

  async function handleSave() {
    const h = parseInt(home)
    const a = parseInt(away)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Goles inválidos")
      return
    }

    setSaving(true)
    setError("")

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: id, homeGoals: h, awayGoals: a }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al guardar")
      return
    }

    setSaved(true)
    router.refresh()
  }

  const dateStr = matchDate.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const timeStr = matchDate.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return (
    <div className="group bg-bg-secondary border border-border rounded-xl p-3 sm:p-4 hover:border-border-hover hover:bg-bg-tertiary/50 transition-all duration-200">
      {/* Header - stacked on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${badge.color}`}
          >
            {badge.label} {group || ""}
          </span>
          <span className="text-[10px] text-text-muted tabular-nums">#{matchNumber}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-text-muted">
          <span className="capitalize">{dateStr}</span>
          <span>·</span>
          <span className="tabular-nums">{timeStr} hs</span>
        </div>
      </div>

      {/* Match - stacked vertically on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-3">
        {/* Teams row on mobile: Home | Score | Away */}
        <div className="flex items-center justify-between sm:hidden gap-2">
          <span className="flex-1 text-right font-semibold text-sm truncate inline-flex items-center justify-end gap-1.5">
            {displayHome}
            {getFlagUrl(homeTeam) && (
              <img src={getFlagUrl(homeTeam)!} alt={homeTeam ?? ""} className="w-5 h-3.5 rounded-[2px] object-cover shadow-sm flex-shrink-0" />
            )}
          </span>

          <span className="shrink-0 text-text-muted/30 text-xs font-bold mx-1">VS</span>

          <span className="flex-1 text-left font-semibold text-sm truncate inline-flex items-center gap-1.5">
            {getFlagUrl(awayTeam) && (
              <img src={getFlagUrl(awayTeam)!} alt={awayTeam ?? ""} className="w-5 h-3.5 rounded-[2px] object-cover shadow-sm flex-shrink-0" />
            )}
            {displayAway}
          </span>
        </div>

        {/* Desktop layout: home | score | away */}
        <div className="hidden sm:flex sm:flex-1 sm:min-w-0 sm:justify-end items-center gap-2">
          <span className="font-semibold text-sm truncate">{displayHome}</span>
          {getFlagUrl(homeTeam) && (
            <img src={getFlagUrl(homeTeam)!} alt={homeTeam ?? ""} className="w-6 h-4 rounded-[2px] object-cover shadow-sm flex-shrink-0" />
          )}
        </div>

        {/* Score / Prediction */}
        <div className="flex flex-col items-center shrink-0">
          {isFinished && homeGoals !== null && awayGoals !== null ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl font-bold tabular-nums text-text-primary">
                {homeGoals}
              </span>
              <span className="text-base sm:text-xl text-text-muted font-light">—</span>
              <span className="text-xl sm:text-2xl font-bold tabular-nums text-text-primary">
                {awayGoals}
              </span>
            </div>
          ) : saved || userPrediction ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-base sm:text-lg font-semibold tabular-nums text-accent">
                {userPrediction?.homeGoals ?? home}
              </span>
              <span className="text-text-muted text-xs sm:text-sm">—</span>
              <span className="text-base sm:text-lg font-semibold tabular-nums text-accent">
                {userPrediction?.awayGoals ?? away}
              </span>
            </div>
          ) : showForm ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={99}
                value={home}
                onChange={(e) => setHome(e.target.value)}
                placeholder="—"
                className="w-12 h-11 sm:w-11 sm:h-9 text-center text-sm font-semibold bg-bg-tertiary border border-border rounded-lg
                  focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200
                  placeholder:text-text-muted/30 text-text-primary tabular-nums"
              />
              <span className="text-text-muted text-xs font-light">vs</span>
              <input
                type="number"
                min={0}
                max={99}
                value={away}
                onChange={(e) => setAway(e.target.value)}
                placeholder="—"
                className="w-12 h-11 sm:w-11 sm:h-9 text-center text-sm font-semibold bg-bg-tertiary border border-border rounded-lg
                  focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200
                  placeholder:text-text-muted/30 text-text-primary tabular-nums"
              />
            </div>
          ) : showLogin ? (
            <span className="text-xs text-text-muted py-2">—</span>
          ) : isLocked ? (
            <div className="flex items-center gap-1.5 py-1">
              <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-gold font-medium">Cerrado</span>
            </div>
          ) : (
            <span className="text-lg sm:text-xl font-bold text-text-muted/20 py-1">VS</span>
          )}
        </div>

        {/* Away team (desktop) */}
        <div className="hidden sm:flex sm:flex-1 sm:min-w-0 sm:justify-start items-center gap-2">
          {getFlagUrl(awayTeam) && (
            <img src={getFlagUrl(awayTeam)!} alt={awayTeam ?? ""} className="w-6 h-4 rounded-[2px] object-cover shadow-sm flex-shrink-0" />
          )}
          <span className="font-semibold text-sm truncate">{displayAway}</span>
        </div>
      </div>

      {/* Venue */}
      <div className="mt-2 text-[10px] sm:text-[11px] text-text-muted truncate">
        {venue}
      </div>

      {/* Actions */}
      <div className="mt-3 min-h-[28px]">
        {showForm && !saved && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-black font-semibold text-xs px-4 py-2.5 sm:py-1.5 rounded-lg
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation
                min-h-[44px] sm:min-h-0"
            >
              {saving ? "Guardando..." : "Guardar pronóstico"}
            </button>
            {error && (
              <span className="text-danger text-xs text-center sm:text-left">{error}</span>
            )}
          </div>
        )}

        {showForm && saved && (
          <span className="text-xs text-accent font-medium flex items-center gap-1 py-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Pronóstico guardado
          </span>
        )}

        {isLocked && userPrediction && (
          <span className="text-[10px] sm:text-[11px] text-gold/60">
            Se bloquea 3hs antes del partido
          </span>
        )}
      </div>
    </div>
  )
}
