"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getFlagUrl, QUALIFIED_TEAMS } from "@/lib/flags"

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
}

interface EditState {
  homeGoals: string
  awayGoals: string
  homeTeam: string
  awayTeam: string
  status: string
}

const STAGES: { key: string; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "GROUP", label: "Grupos" },
  { key: "R32", label: "16avos" },
  { key: "R16", label: "8avos" },
  { key: "QUARTER", label: "Cuartos" },
  { key: "SEMI", label: "Semis" },
  { key: "THIRD_PLACE", label: "3er Puesto" },
  { key: "FINAL", label: "Final" },
]

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [editing, setEditing] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ homeGoals: "", awayGoals: "", homeTeam: "", awayTeam: "", status: "FINISHED" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => setMatches(data))
      .finally(() => setLoading(false))
  }, [status, router])

  const filtered = filter === "all"
    ? matches
    : matches.filter((m) => m.stage === filter)

  // Group by date
  const grouped = (() => {
    const map = new Map<string, Match[]>()
    for (const m of filtered) {
      const d = new Date(m.date)
      const key = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return Array.from(map.entries())
  })()

  function startEdit(match: Match) {
    setEditing(match.id)
    setEditState({
      homeGoals: match.homeGoals?.toString() ?? "",
      awayGoals: match.awayGoals?.toString() ?? "",
      homeTeam: match.homeTeam ?? "",
      awayTeam: match.awayTeam ?? "",
      status: match.status,
    })
    setMessage(null)
  }

  function cancelEdit() {
    setEditing(null)
  }

  async function saveResult(matchId: string) {
    const h = editState.homeGoals === "" ? null : parseInt(editState.homeGoals)
    const a = editState.awayGoals === "" ? null : parseInt(editState.awayGoals)

    if (h !== null && (isNaN(h) || h < 0)) return
    if (a !== null && (isNaN(a) || a < 0)) return

    setSaving(true)
    setMessage(null)

    const res = await fetch("/api/matches/result", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        homeGoals: h,
        awayGoals: a,
        status: editState.status,
        homeTeam: editState.homeTeam || null,
        awayTeam: editState.awayTeam || null,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setMessage({ text: data.error || "Error al guardar", type: "error" })
      return
    }

    const updated = await res.json()
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...updated } : m))
    )
    setEditing(null)
    setMessage({ text: "✅ Resultado guardado", type: "success" })
  }

  const pendingCount = matches.filter((m) => m.status !== "FINISHED").length
  const finishedCount = matches.filter((m) => m.status === "FINISHED").length

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-6 sm:px-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Panel Admin</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {finishedCount} finalizados · {pendingCount} pendientes
          </p>
        </div>
        <a
          href="/"
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          ← Volver al prode
        </a>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-900/20 text-green-400 border border-green-800"
              : "bg-red-900/20 text-red-400 border border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stage filter */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-200 ${
              filter === s.key
                ? "bg-accent text-black shadow-sm shadow-accent/20"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent hover:border-border"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-[11px] text-text-muted self-center ml-auto">
          {filtered.length} partidos
        </span>
      </div>

      {/* Match list */}
      {grouped.length === 0 ? (
        <p className="text-center text-text-muted py-16">Sin partidos</p>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(([dateLabel, dayMatches]) => (
            <div key={dateLabel}>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 capitalize px-1 flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full" />
                {dateLabel}
              </h2>
              <div className="flex flex-col gap-3">
                {dayMatches.map((match) => {
                  const isEditing = editing === match.id
                  const displayHome = match.homeTeam || `Equipo ${match.group || ""}1`
                  const displayAway = match.awayTeam || `Equipo ${match.group || ""}2`

                  return (
                    <div
                      key={match.id}
                      className={`bg-bg-secondary border rounded-xl p-3 sm:p-4 transition-all duration-200 ${
                        isEditing
                          ? "border-accent shadow-sm shadow-accent/10"
                          : "border-border hover:border-border-hover"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-bg-tertiary text-text-secondary">
                            {match.stage === "GROUP" ? `Grupo ${match.group}` : match.stage}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            #{match.matchNumber}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            match.status === "FINISHED"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-bg-tertiary text-text-muted"
                          }`}
                        >
                          {match.status === "FINISHED" ? "Finalizado" : "Pendiente"}
                        </span>
                      </div>

                      {/* Team name inputs (knockout stages) */}
                      {isEditing && match.stage !== "GROUP" && (
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={editState.homeTeam}
                              onChange={(e) =>
                                setEditState((s) => ({ ...s, homeTeam: e.target.value }))
                              }
                              list="teams-list"
                              placeholder="Equipo local"
                              className="w-full text-xs px-2 py-1.5 rounded-lg bg-bg-tertiary border border-accent/50
                                text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                                placeholder:text-text-muted/40"
                            />
                          </div>
                          <span className="text-text-muted text-xs font-light shrink-0">vs</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={editState.awayTeam}
                              onChange={(e) =>
                                setEditState((s) => ({ ...s, awayTeam: e.target.value }))
                              }
                              list="teams-list"
                              placeholder="Equipo visitante"
                              className="w-full text-xs px-2 py-1.5 rounded-lg bg-bg-tertiary border border-accent/50
                                text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                                placeholder:text-text-muted/40"
                            />
                          </div>
                        </div>
                      )}

                      {/* Teams + score */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Home */}
                        <div className="flex-1 text-right flex items-center justify-end gap-2 min-w-0">
                          <span className="font-semibold text-sm truncate">{displayHome}</span>
                          {getFlagUrl(match.homeTeam) && (
                            <img
                              src={getFlagUrl(match.homeTeam)!}
                              alt={match.homeTeam ?? ""}
                              className="w-6 h-4 rounded-[2px] object-cover flex-shrink-0"
                            />
                          )}
                        </div>

                        {/* Score / Edit form */}
                        {isEditing ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={editState.homeGoals}
                              onChange={(e) =>
                                setEditState((s) => ({ ...s, homeGoals: e.target.value }))
                              }
                              className="w-12 h-9 text-center text-sm font-semibold bg-bg-tertiary border border-accent rounded-lg
                                text-text-primary tabular-nums outline-none focus:ring-1 focus:ring-accent/30"
                              placeholder="-"
                            />
                            <span className="text-text-muted text-sm font-light">—</span>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={editState.awayGoals}
                              onChange={(e) =>
                                setEditState((s) => ({ ...s, awayGoals: e.target.value }))
                              }
                              className="w-12 h-9 text-center text-sm font-semibold bg-bg-tertiary border border-accent rounded-lg
                                text-text-primary tabular-nums outline-none focus:ring-1 focus:ring-accent/30"
                              placeholder="-"
                            />
                          </div>
                        ) : match.homeGoals !== null && match.awayGoals !== null ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xl font-bold tabular-nums text-text-primary">
                              {match.homeGoals}
                            </span>
                            <span className="text-text-muted">—</span>
                            <span className="text-xl font-bold tabular-nums text-text-primary">
                              {match.awayGoals}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-text-muted/20 shrink-0">VS</span>
                        )}

                        {/* Away */}
                        <div className="flex-1 text-left flex items-center gap-2 min-w-0">
                          {getFlagUrl(match.awayTeam) && (
                            <img
                              src={getFlagUrl(match.awayTeam)!}
                              alt={match.awayTeam ?? ""}
                              className="w-6 h-4 rounded-[2px] object-cover flex-shrink-0"
                            />
                          )}
                          <span className="font-semibold text-sm truncate">{displayAway}</span>
                        </div>
                      </div>

                      {/* Edit mode: status toggle + actions */}
                      {isEditing && (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                          <select
                            value={editState.status}
                            onChange={(e) =>
                              setEditState((s) => ({ ...s, status: e.target.value }))
                            }
                            className="text-xs px-2 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-primary outline-none"
                          >
                            <option value="SCHEDULED">SCHEDULED</option>
                            <option value="FINISHED">FINISHED</option>
                          </select>
                          <div className="flex gap-2 ml-auto">
                            <button
                              onClick={cancelEdit}
                              className="text-xs px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => saveResult(match.id)}
                              disabled={saving}
                              className="text-xs px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold
                                transition-all duration-200 disabled:opacity-50 active:scale-95"
                            >
                              {saving ? "Guardando..." : "Guardar"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Non-edit: edit button */}
                      {!isEditing && (
                        <div className="mt-2">
                          <button
                            onClick={() => startEdit(match)}
                            className="text-[11px] text-text-muted hover:text-accent transition-colors"
                          >
                            {match.homeGoals !== null ? "✏️ Editar resultado" : "📝 Cargar resultado"}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Datalist for team autocomplete */}
      <datalist id="teams-list">
        {QUALIFIED_TEAMS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  )
}
