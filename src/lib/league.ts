import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const CODE_LENGTH = 6
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I,O,0,1 to avoid confusion

export function generateLeagueCode(): string {
	let code: string
	do {
		code = ""
		const bytes = crypto.randomBytes(CODE_LENGTH)
		for (let i = 0; i < CODE_LENGTH; i++) {
			code += CODE_CHARS[bytes[i]! % CODE_CHARS.length]
		}
	} while (code.length < CODE_LENGTH)
	return code
}

export async function createUniqueLeagueCode(): Promise<string> {
	for (let attempt = 0; attempt < 10; attempt++) {
		const code = generateLeagueCode()
		const existing = await prisma.league.findUnique({ where: { code } })
		if (!existing) return code
	}
	throw new Error("No se pudo generar un código único")
}

export async function getLeagueRanking(leagueId: string) {
	const members = await prisma.leagueMember.findMany({
		where: { leagueId },
		include: {
			user: {
				include: {
					predictions: {
						include: { match: true },
					},
				},
			},
		},
	})

	const { calculatePoints } = await import("@/lib/scoring")

	const ranked = members
		.map((member) => {
			let totalPoints = 0
			let correctResults = 0
			let exactScores = 0
			let totalPreds = 0

			for (const pred of member.user.predictions) {
				if (
					pred.match.status === "FINISHED" &&
					pred.match.homeGoals !== null &&
					pred.match.awayGoals !== null
				) {
					totalPreds++
					const pts = calculatePoints(
						pred.homeGoals,
						pred.awayGoals,
						pred.match.homeGoals,
						pred.match.awayGoals,
					)
					totalPoints += pts
					if (pts >= 2) correctResults++
					if (pts === 3) exactScores++
				}
			}

			return {
				userId: member.user.id,
				name: member.user.name || "Anónimo",
				points: totalPoints,
				predictions: totalPreds,
				correctResults,
				exactScores,
				role: member.role,
				joinedAt: member.joinedAt.toISOString(),
			}
		})
		.sort((a, b) => b.points - a.points)

	return ranked
}
