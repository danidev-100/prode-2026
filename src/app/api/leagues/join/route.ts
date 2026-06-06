import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
	const session = await auth()
	if (!session?.user?.id) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 })
	}

	const { code } = await req.json()

	if (!code || typeof code !== "string") {
		return NextResponse.json({ error: "Código requerido" }, { status: 400 })
	}

	const normalizedCode = code.trim().toUpperCase()

	const league = await prisma.league.findUnique({
		where: { code: normalizedCode },
	})

	if (!league) {
		return NextResponse.json({ error: "Liga no encontrada" }, { status: 404 })
	}

	// Check if already a member
	const existing = await prisma.leagueMember.findUnique({
		where: {
			leagueId_userId: {
				leagueId: league.id,
				userId: session.user.id,
			},
		},
	})

	if (existing) {
		return NextResponse.json({ error: "Ya estás en esta liga" }, { status: 409 })
	}

	await prisma.leagueMember.create({
		data: {
			leagueId: league.id,
			userId: session.user.id,
		},
	})

	return NextResponse.json({
		id: league.id,
		name: league.name,
		code: league.code,
		message: `Te uniste a "${league.name}"`,
	})
}
