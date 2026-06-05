"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import MatchCard from "./MatchCard"

interface Prediction {
  homeGoals: number
  awayGoals: number
  points: number | null
}

interface Match {
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
  userPrediction: Prediction | null
}

const GROUPS = "ABCDEFGHIJKL".split("")
const KNOCKOUT = [
  { key: "R32", label: "16avos" },
  { key: "R16", label: "8avos" },
  { key: "QUARTER", label: "Cuartos" },
  { key: "SEMI", label: "Semis" },
  { key: "THIRD_PLACE", label: "3er Puesto" },
  { key: "FINAL", label: "Final" },
]

export default function MatchList({
  matches,
  isLoggedIn,
}: {
  matches: Match[]
  isLoggedIn: boolean
}) {
  const [filter, setFilter] = useState<string>("all")
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (filter === "all") return matches
    if (filter === "grupos") return matches.filter((m) => m.stage === "GROUP")
    if (filter === "knockout") return matches.filter((m) => m.stage !== "GROUP")
    if (filter.startsWith("group-")) {
      const g = filter.replace("group-", "")
      return matches.filter((m) => m.group === g && m.stage === "GROUP")
    }
    return matches.filter((m) => m.stage === filter)
  }, [matches, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>()

    for (const match of filtered) {
      const d = new Date(match.date)
      const key = d.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(match)
    }

    return Array.from(map.entries())
  }, [filtered])

  // Scroll to active pill on mobile
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const active = el.querySelector(`[data-filter="${filter}"]`)
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [filter])

  const pillClass = (key: string) =>
    `shrink-0 px-3 py-1.5 sm:py-1 text-xs sm:text-sm rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
      filter === key
        ? "bg-accent text-black shadow-sm shadow-accent/20"
        : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-border hover:border-border-hover"
    }`

  const activeCount = filtered.length

  return (
    <div className="flex flex-col">
      {/* Desktop filters */}
      <div className="hidden sm:flex flex-wrap items-center gap-1.5 mb-6">
        <button onClick={() => setFilter("all")} className={pillClass("all")}>
          Todos
        </button>
        <span className="text-text-muted text-xs px-1">·</span>
        {GROUPS.map((g) => (
          <button
            key={`group-${g}`}
            onClick={() => setFilter(`group-${g}`)}
            className={pillClass(`group-${g}`)}
          >
            Grupo {g}
          </button>
        ))}
        <span className="text-text-muted text-xs px-1">·</span>
        {KNOCKOUT.map((k) => (
          <button
            key={k.key}
            onClick={() => setFilter(k.key)}
            className={pillClass(k.key)}
          >
            {k.label}
          </button>
        ))}
        <span className="text-[11px] text-text-muted ml-auto tabular-nums">
          {activeCount} partido{activeCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile scrollable filters */}
      <div className="sm:hidden mb-4 -mx-4 px-4">
        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <button
            data-filter="all"
            onClick={() => setFilter("all")}
            className={pillClass("all")}
          >
            Todos
          </button>
          <button
            data-filter="grupos"
            onClick={() => setFilter("grupos")}
            className={pillClass("grupos")}
          >
            Grupos
          </button>
          <button
            data-filter="knockout"
            onClick={() => setFilter("knockout")}
            className={pillClass("knockout")}
          >
            Eliminatorias
          </button>
          {GROUPS.map((g) => (
            <button
              key={`group-${g}`}
              data-filter={`group-${g}`}
              onClick={() => setFilter(`group-${g}`)}
              className={pillClass(`group-${g}`)}
            >
              G{g}
            </button>
          ))}
          {KNOCKOUT.map((k) => (
            <button
              key={k.key}
              data-filter={k.key}
              onClick={() => setFilter(k.key)}
              className={pillClass(k.key)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-text-muted mt-1.5 tabular-nums">
          {activeCount} partido{activeCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Match list */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-text-muted text-sm">No hay partidos para este filtro</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-8">
          {grouped.map(([dateLabel, dayMatches]) => (
            <div key={dateLabel}>
              <h2 className="text-xs sm:text-sm font-semibold text-text-secondary mb-2 sm:mb-3 px-1 flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full shrink-0" />
                <span className="capitalize">{dateLabel}</span>
              </h2>
              <div className="flex flex-col gap-2 sm:gap-3">
                {dayMatches.map((match) => (
                  <MatchCard key={match.id} {...match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
