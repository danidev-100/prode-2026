import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeagueRanking } from "@/lib/league";

// GET /api/leagues/[id] — league detail + ranking
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	const { id } = await params;

	const league = await prisma.league.findUnique({
		where: { id },
		include: {
			createdBy: { select: { name: true } },
			_count: { select: { members: true } },
		},
	});

	if (!league) {
		return NextResponse.json({ error: "Liga no encontrada" }, { status: 404 });
	}

	// Check if user is a member
	const membership = await prisma.leagueMember.findUnique({
		where: {
			leagueId_userId: {
				leagueId: id,
				userId: session.user.id,
			},
		},
	});

	const ranking = await getLeagueRanking(id);
	const currentUserRank =
		ranking.findIndex((r) => r.userId === session.user.id) + 1;

	return NextResponse.json({
		id: league.id,
		name: league.name,
		code: league.code,
		createdBy: league.createdBy.name,
		memberCount: league._count.members,
		createdAt: league.createdAt.toISOString(),
		isMember: !!membership,
		currentUserRank: currentUserRank || null,
		ranking,
	});
}
