import { prisma } from "@/lib/prisma"

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamStats {
  team: string
  group: string
  played: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

interface GroupStandings {
  group: string
  teams: TeamStats[]
  winner: TeamStats
  runnerUp: TeamStats
  third: TeamStats
  fourth?: TeamStats
}

interface KnockoutSlot {
  matchNumber: number
  role: "winner" | "runnerUp" | "third"
  /** Group letter(s). For third-place, this is the eligibility list. */
  groupRef: string
  /** For third-place slots: which group letters are eligible */
  eligibleGroups?: string[]
}

// ─── Group standings calculator ──────────────────────────────────────────────

function calculatePoints(home: number, away: number): { homePts: number; awayPts: number } {
  if (home > away) return { homePts: 3, awayPts: 0 }
  if (home < away) return { homePts: 0, awayPts: 3 }
  return { homePts: 1, awayPts: 1 }
}

function sortTeams(teams: TeamStats[]): TeamStats[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.team.localeCompare(b.team) // alphabetical as last resort
  })
}

async function getGroupStandings(): Promise<GroupStandings[]> {
  const groups = "ABCDEFGHIJKL".split("")

  const matches = await prisma.match.findMany({
    where: { stage: "GROUP", status: "FINISHED" },
    select: {
      group: true,
      homeTeam: true,
      awayTeam: true,
      homeGoals: true,
      awayGoals: true,
    },
  })

  // Build stats per team per group
  const statsMap = new Map<string, Map<string, TeamStats>>()

  for (const m of matches) {
    if (!m.group || !m.homeTeam || !m.awayTeam || m.homeGoals === null || m.awayGoals === null) continue

    const g = m.group

    if (!statsMap.has(g)) statsMap.set(g, new Map())
    const groupMap = statsMap.get(g)!

    for (const [team, gf, ga] of [[m.homeTeam, m.homeGoals, m.awayGoals] as const, [m.awayTeam, m.awayGoals, m.homeGoals] as const]) {
      if (!groupMap.has(team)) {
        groupMap.set(team, { team, group: g, played: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 })
      }
      const s = groupMap.get(team)!
      s.played++
      const { homePts, awayPts } = calculatePoints(
        team === m.homeTeam ? m.homeGoals : m.awayGoals,
        team === m.homeTeam ? m.awayGoals : m.homeGoals
      )
      // Actually we already have gf/ga from the destructuring
      s.goalsFor += gf
      s.goalsAgainst += ga
      s.goalDifference = s.goalsFor - s.goalsAgainst
      s.points += team === m.homeTeam ? (m.homeGoals > m.awayGoals ? 3 : m.homeGoals === m.awayGoals ? 1 : 0)
        : (m.awayGoals > m.homeGoals ? 3 : m.awayGoals === m.homeGoals ? 1 : 0)
    }
  }

  const result: GroupStandings[] = []

  for (const g of groups) {
    const groupMap = statsMap.get(g)
    if (!groupMap || groupMap.size === 0) continue

    const teams = sortTeams(Array.from(groupMap.values()))
    result.push({
      group: g,
      teams,
      winner: teams[0],
      runnerUp: teams[1],
      third: teams[2],
      fourth: teams[3],
    })
  }

  return result
}

// ─── Third-place ranking ─────────────────────────────────────────────────────

function rankThirdPlaced(standings: GroupStandings[]): TeamStats[] {
  return sortTeams(standings.map((s) => s.third))
}

// ─── Bracket assignments ─────────────────────────────────────────────────────

/**
 * For R32, the third-place from different groups map to specific matches.
 * Each entry: matchNumber → eligible group letters for the third-place slot.
 */
const THIRD_PLACE_SLOTS: { matchNumber: number; eligibleGroups: string[] }[] = [
  { matchNumber: 74, eligibleGroups: ["A", "B", "C", "D", "F"] },
  { matchNumber: 77, eligibleGroups: ["C", "D", "F", "G", "H"] },
  { matchNumber: 79, eligibleGroups: ["C", "E", "F", "H", "I"] },
  { matchNumber: 80, eligibleGroups: ["E", "H", "I", "J", "K"] },
  { matchNumber: 81, eligibleGroups: ["B", "E", "F", "I", "J"] },
  { matchNumber: 82, eligibleGroups: ["A", "E", "H", "I", "J"] },
  { matchNumber: 85, eligibleGroups: ["E", "F", "G", "I", "J"] },
  { matchNumber: 87, eligibleGroups: ["D", "E", "I", "J", "L"] },
]

/**
 * Assign the top 8 third-placed teams to their predetermined knockout slots.
 * Uses a constraint-based approach: more constrained slots (fewer eligible groups)
 * get priority in assignment.
 */
function assignThirdPlaceSlots(
  rankedThirds: TeamStats[]
): Map<number, TeamStats> {
  const qualified = rankedThirds.slice(0, 8)
  const result = new Map<number, TeamStats>()

  // Sort slots by constraint (fewest eligible groups = most constrained first)
  const sortedSlots = [...THIRD_PLACE_SLOTS].sort(
    (a, b) => a.eligibleGroups.length - b.eligibleGroups.length
  )

  const assigned = new Set<string>() // team names already assigned

  for (const slot of sortedSlots) {
    // Find the highest-ranked unassigned team from eligible groups
    const eligible = qualified.filter(
      (t) => slot.eligibleGroups.includes(t.group) && !assigned.has(t.team)
    )

    if (eligible.length === 0) {
      console.warn(
        `[knockout] No eligible third-place team for match #${slot.matchNumber} ` +
          `(eligible: ${slot.eligibleGroups.join(",")})`
      )
      continue
    }

    const picked = eligible[0] // highest-ranked (already sorted)
    assigned.add(picked.team)
    result.set(slot.matchNumber, picked)
  }

  return result
}

// ─── Main resolver ───────────────────────────────────────────────────────────

export interface ResolveResult {
  groupsProcessed: number
  knockoutMatchesUpdated: number
  thirdPlaceAssigned: number
  errors: string[]
}

export async function resolveKnockoutBracket(): Promise<ResolveResult> {
  const result: ResolveResult = {
    groupsProcessed: 0,
    knockoutMatchesUpdated: 0,
    thirdPlaceAssigned: 0,
    errors: [],
  }

  // ── Step 1: Calculate group standings ──
  const standings = await getGroupStandings()
  result.groupsProcessed = standings.length

  if (standings.length === 0) {
    result.errors.push("No hay grupos con partidos finalizados")
    return result
  }

  // ── Step 2: Update group winners and runners-up in knockout matches ──
  // Maps like "Winner Group A" → "Argentina", "Runner-up Group A" → "Algeria"
  const teamReplacements = new Map<string, string>()

  for (const s of standings) {
    teamReplacements.set(`Winner Group ${s.group}`, s.winner.team)
    teamReplacements.set(`Runner-up Group ${s.group}`, s.runnerUp.team)
  }

  // ── Step 3: Assign third-placed teams ──
  const rankedThirds = rankThirdPlaced(standings)

  // Try Annex C first (FIFA-compliant), fall back to greedy algorithm
  const thirdPlaceTeamsMap = new Map<string, TeamStats>()
  for (const s of standings) {
    thirdPlaceTeamsMap.set(s.group, s.third)
  }

  const annexCResult = resolveAnnexC(rankedThirds, thirdPlaceTeamsMap)
  const useAnnexC = annexCResult !== null && annexCResult.size > 0

  const thirdPlaceAssignments = new Map<number, TeamStats>()
  if (useAnnexC) {
    // Convert Annex C result (Map<matchNumber, teamName>) to Map<matchNumber, TeamStats>
    for (const [mn, teamName] of annexCResult) {
      // Find the TeamStats for this team
      const found = rankedThirds.find((t) => t.team === teamName)
      if (found) {
        thirdPlaceAssignments.set(mn, found)
      }
    }
  } else {
    // Fall back to greedy constraint-based algorithm
    const greedyAssignments = assignThirdPlaceSlots(rankedThirds)
    for (const [mn, team] of greedyAssignments) {
      thirdPlaceAssignments.set(mn, team)
    }
  }

  // ── Step 4: Update all knockout matches ──
  const knockoutMatches = await prisma.match.findMany({
    where: {
      stage: { in: ["R32", "R16", "QUARTER", "SEMI", "THIRD_PLACE", "FINAL"] },
    },
    orderBy: { matchNumber: "asc" },
  })

  for (const match of knockoutMatches) {
    const updates: Record<string, string | null> = {}

    // Check homeTeam
    if (match.homeTeam && teamReplacements.has(match.homeTeam)) {
      updates.homeTeam = teamReplacements.get(match.homeTeam)!
    }

    // Check awayTeam
    if (match.awayTeam && teamReplacements.has(match.awayTeam)) {
      updates.awayTeam = teamReplacements.get(match.awayTeam)!
    }

    // Check third-place slots specifically (by match number for the R32 matches)
    if (thirdPlaceAssignments.has(match.matchNumber)) {
      const assigned = thirdPlaceAssignments.get(match.matchNumber)!
      if (match.homeTeam && match.homeTeam.startsWith("3rd")) {
        updates.homeTeam = assigned.team
      } else if (match.awayTeam && match.awayTeam.startsWith("3rd")) {
        updates.awayTeam = assigned.team
      }
    }

    // Also handle "Winner Match XX", "Loser Match XX" for later rounds
    // These can only be resolved after the earlier matches have winners
    // For now, we handle the chain: if a match has "Winner Match 74" as homeTeam,
    // we look at match #74's winner (i.e., the homeTeam of match 74)

    if (Object.keys(updates).length > 0) {
      await prisma.match.update({
        where: { id: match.id },
        data: updates,
      })
      result.knockoutMatchesUpdated++
    }
  }

  // ── Step 5: Resolve chained references (Winner Match XX, Loser Match XX) ──
  // These need to be resolved iteratively since R16 depends on R32 results, etc.
  for (let round = 0; round < 5; round++) {
    const chainedMatches = await prisma.match.findMany({
      where: {
        stage: { in: ["R16", "QUARTER", "SEMI", "THIRD_PLACE", "FINAL"] },
        OR: [
          { homeTeam: { startsWith: "Winner Match" } },
          { homeTeam: { startsWith: "Loser Match" } },
          { awayTeam: { startsWith: "Winner Match" } },
          { awayTeam: { startsWith: "Loser Match" } },
        ],
      },
    })

    if (chainedMatches.length === 0) break

    for (const match of chainedMatches) {
      const updates: Record<string, string | null> = {}

      for (const [field, value] of [
        ["homeTeam", match.homeTeam] as const,
        ["awayTeam", match.awayTeam] as const,
      ]) {
        if (!value) continue

        // Parse "Winner Match 74" → matchNumber 74
        const winnerMatch = value.match(/^Winner Match (\d+)$/)
        const loserMatch = value.match(/^Loser Match (\d+)$/)

        if (winnerMatch) {
          const refMatchNumber = parseInt(winnerMatch[1])
          const refMatch = await prisma.match.findUnique({
            where: { matchNumber: refMatchNumber },
          })
          if (refMatch && refMatch.homeGoals !== null && refMatch.awayGoals !== null) {
            const winnerTeam =
              refMatch.homeGoals > refMatch.awayGoals
                ? refMatch.homeTeam
                : refMatch.homeGoals < refMatch.awayGoals
                ? refMatch.awayTeam
                : null // draws in knockout = penalties, but we don't track that
            if (winnerTeam) {
              updates[field] = winnerTeam
            }
          }
        }

        if (loserMatch) {
          const refMatchNumber = parseInt(loserMatch[1])
          const refMatch = await prisma.match.findUnique({
            where: { matchNumber: refMatchNumber },
          })
          if (refMatch && refMatch.homeGoals !== null && refMatch.awayGoals !== null) {
            const loserTeam =
              refMatch.homeGoals < refMatch.awayGoals
                ? refMatch.homeTeam
                : refMatch.homeGoals > refMatch.awayGoals
                ? refMatch.awayTeam
                : null
            if (loserTeam) {
              updates[field] = loserTeam
            }
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.match.update({
          where: { id: match.id },
          data: updates,
        })
        result.knockoutMatchesUpdated++
      }
    }
  }

  result.thirdPlaceAssigned = thirdPlaceAssignments.size

  return result
}

// ─── Annex C: Combinaciones de terceros puestos ─────────────────────────────
//
// FIFA publicó 495 combinaciones posibles en Annex C del reglamento.
// Cada combinación asigna un grupo específico a cada match de R32.
// Acá están las combinaciones conocidas, keyeadas por el sorted set de
// grupos cuyos terceros puestos clasifican.
//
// Formato: "grupos_ordenados" → { matchNumber: grupo_tercer_puesto }
const ANNEX_C: Record<string, Record<number, string>> = {
	// Combinación #67: B, D, E, F, I, J, K, L (nuestro fixture actual)
	"BDEFIJKL": {
		74: "D",  // Germany vs Paraguay (3rd D)
		77: "F",  // France vs Sweden (3rd F)
		79: "E",  // Mexico vs Ecuador (3rd E)
		80: "K",  // England vs DR Congo (3rd K)
		81: "B",  // USA vs Bosnia (3rd B)
		82: "I",  // Belgium vs Senegal (3rd I)
		85: "J",  // Switzerland vs Algeria (3rd J)
		87: "L",  // Colombia vs Ghana (3rd L)
	},
};

/**
 * Determina qué grupos tienen terceros puestos clasificados, busca la
 * combinación en Annex C, y devuelve el mapping matchNumber → nombre del equipo.
 *
 * @param rankedThirds Terceros puestos rankeados (top 8 clasifican)
 * @param thirdPlaceTeamsMap Map<grupo, TeamStats> con todos los terceros
 * @returns Map<matchNumber, nombre_del_equipo> o null si no hay combinación conocida
 */
export function resolveAnnexC(
	rankedThirds: TeamStats[],
	thirdPlaceTeamsMap: Map<string, TeamStats>,
): Map<number, string> | null {
	const qualified = rankedThirds.slice(0, 8);
	if (qualified.length < 8) return null;

	// Construir key: grupos ordenados alfabéticamente
	const qualifiedGroups = qualified
		.map((t) => t.group)
		.sort()
		.join("");
	const config = ANNEX_C[qualifiedGroups];
	if (!config) return null;

	// Mapear matchNumber → nombre del equipo
	const result = new Map<number, string>();
	for (const [mnStr, groupLetter] of Object.entries(config)) {
		const mn = parseInt(mnStr);
		const team = thirdPlaceTeamsMap.get(groupLetter);
		if (team) {
			result.set(mn, team.team);
		}
	}

	return result;
}

/**
 * Lee la DB, calcula standings, rankea terceros, busca en Annex C,
 * y devuelve qué partidos de R32 necesitan actualizar sus terceros puestos.
 *
 * @returns Map<matchNumber, nombre_del_equipo_tercer_puesto>
 */
export async function resolveAnnexCFromDb(): Promise<Map<number, string>> {
	const standings = await getGroupStandings();
	if (standings.length < 12) return new Map();

	// Map grupo → third place team
	const thirdPlaceTeams = new Map<string, TeamStats>();
	for (const s of standings) {
		thirdPlaceTeams.set(s.group, s.third);
	}

	const rankedThirds = rankThirdPlaced(standings);
	const result = resolveAnnexC(rankedThirds, thirdPlaceTeams);
	return result ?? new Map();
}

// ─── Convenience: check if resolution is ready ──────────────────────────────

export async function canResolveKnockout(): Promise<{
  ready: boolean
  groupsComplete: number
  totalGroups: number
  finishedKnockoutMatches: number
  reason?: string
}> {
  const totalGroups = 12

  const groups = "ABCDEFGHIJKL".split("")
  let groupsComplete = 0

  for (const g of groups) {
    const count = await prisma.match.count({
      where: { group: g, stage: "GROUP" },
    })
    const finished = await prisma.match.count({
      where: { group: g, stage: "GROUP", status: "FINISHED" },
    })
    if (count > 0 && count === finished) groupsComplete++
  }

  const finishedKnockout = await prisma.match.count({
    where: {
      stage: { in: ["R32", "R16", "QUARTER", "SEMI", "THIRD_PLACE", "FINAL"] },
      status: "FINISHED",
    },
  })

  const ready = groupsComplete >= 8 // need at least 8 groups resolved to have 8 third-place teams

  return {
    ready,
    groupsComplete,
    totalGroups,
    finishedKnockoutMatches: finishedKnockout,
    reason: ready
      ? undefined
      : `Faltan ${totalGroups - groupsComplete} grupos por completar`,
  }
}
