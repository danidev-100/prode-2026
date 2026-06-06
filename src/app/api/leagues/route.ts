import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUniqueLeagueCode } from "@/lib/league"

// GET /api/leagues — list my leagues
export async function GET() {
	const session = await auth()
	if (!session?.user?.id) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 })
	}

	const memberships = await prisma.leagueMember.findMany({
		where: { userId: session.user.id },
		include: {
			league: {
				include: {
					members: {
						select: { id: true },
					},
					_count: { select: { members: true } },
				},
			},
		},
		orderBy: { joinedAt: "desc" },
	})

	const leagues = memberships.map((m) => ({
		id: m.league.id,
		name: m.league.name,
		code: m.league.code,
		memberCount: m.league._count.members,
		role: m.role,
		createdAt: m.league.createdAt.toISOString(),
	}))

	return NextResponse.json(leagues)
}

// POST /api/leagues — create a new league
export async function POST(req: NextRequest) {
	const session = await auth()
	if (!session?.user?.id) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 })
	}

	const { name } = await req.json()

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
	}

	if (name.trim().length > 50) {
		return NextResponse.json(
			{ error: "El nombre no puede tener más de 50 caracteres" },
			{ status: 400 },
		)
	}

	const code = await createUniqueLeagueCode()

	const league = await prisma.league.create({
		data: {
			name: name.trim(),
			code,
			createdById: session.user.id,
			members: {
				create: {
					userId: session.user.id,
					role: "OWNER",
				},
			},
		},
	})

	return NextResponse.json(
		{
			id: league.id,
			name: league.name,
			code: league.code,
			memberCount: 1,
			role: "OWNER",
			createdAt: league.createdAt.toISOString(),
		},
		{ status: 201 },
	)
}
