import { prisma } from "@/lib/prisma";
import { getFlagUrl } from "@/lib/flags";

export const dynamic = "force-dynamic";

interface TeamStanding {
	name: string;
	pj: number;
	gf: number;
	gc: number;
	dg: number;
	pts: number;
}

function computeStandings(
	_group: string,
	matches: {
		homeTeam: string | null;
		awayTeam: string | null;
		homeGoals: number | null;
		awayGoals: number | null;
		status: string;
	}[],
): TeamStanding[] {
	const teamsMap = new Map<
		string,
		{ pj: number; gf: number; gc: number; pts: number }
	>();

	for (const m of matches) {
		if (!m.homeTeam || !m.awayTeam) continue;
		if (!teamsMap.has(m.homeTeam))
			teamsMap.set(m.homeTeam, { pj: 0, gf: 0, gc: 0, pts: 0 });
		if (!teamsMap.has(m.awayTeam))
			teamsMap.set(m.awayTeam, { pj: 0, gf: 0, gc: 0, pts: 0 });

		if (
			m.status === "FINISHED" &&
			m.homeGoals !== null &&
			m.awayGoals !== null
		) {
			const home = teamsMap.get(m.homeTeam)!;
			const away = teamsMap.get(m.awayTeam)!;
			home.pj++;
			away.pj++;
			home.gf += m.homeGoals;
			home.gc += m.awayGoals;
			away.gf += m.awayGoals;
			away.gc += m.homeGoals;

			if (m.homeGoals > m.awayGoals) {
				home.pts += 3;
			} else if (m.homeGoals < m.awayGoals) {
				away.pts += 3;
			} else {
				home.pts += 1;
				away.pts += 1;
			}
		}
	}

	return Array.from(teamsMap.entries())
		.map(([name, stats]) => ({
			name,
			...stats,
			dg: stats.gf - stats.gc,
		}))
		.sort((a, b) => {
			if (b.pts !== a.pts) return b.pts - a.pts;
			if (b.dg !== a.dg) return b.dg - a.dg;
			return b.gf - a.gf;
		});
}

const GROUPS = "ABCDEFGHIJKL".split("");

export default async function PosicionesPage() {
	const allMatches = await prisma.match.findMany({
		where: { stage: "GROUP" },
		orderBy: { date: "asc" },
	});

	const groupsData = GROUPS.map((letter) => {
		const groupMatches = allMatches.filter((m) => m.group === letter);
		const standings = computeStandings(letter, groupMatches);
		return { letter, standings };
	}).filter((g) => g.standings.length > 0);

	return (
		<div className="max-w-4xl mx-auto py-6 sm:py-8 px-4">
			{/* Header */}
			<div className="relative mb-6 sm:mb-8">
				<div className="absolute -inset-2 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 rounded-2xl blur-xl pointer-events-none" />
				<div className="relative">
					<span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
						🏟️ Fase de grupos
					</span>
					<h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
						Posiciones <span className="text-accent">Mundial 2026</span>
					</h1>
					<p className="text-text-muted text-sm mt-1">
						12 grupos · 48 selecciones · 3 pts por victoria · 1 pt por empate ·
						0 pts por derrota
					</p>
				</div>
			</div>

			{/* Groups grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
				{groupsData.map(({ letter, standings }) => {
					// count finished matches in this group
					const finishedCount = allMatches.filter(
						(m) => m.group === letter && m.status === "FINISHED",
					).length;
					const totalMatches = 6; // each group has exactly 6 matches

					return (
						<div
							key={letter}
							className="bg-transparent border border-border/5 rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/30"
						>
							{/* Group header */}
							<div className="px-4 py-3 bg-bg-tertiary/10 border-b border-border/20 flex items-center justify-between">
								<h2 className="font-bold text-sm sm:text-base text-text-primary tracking-wide">
									Grupo <span className="text-accent">{letter}</span>
								</h2>
								<span className="text-[10px] sm:text-xs text-text-muted tabular-nums">
									{finishedCount}/{totalMatches} jugados
								</span>
							</div>

							{/* Table header */}
							<div className="grid grid-cols-[1fr_28px_28px_28px_32px] sm:grid-cols-[1fr_32px_32px_32px_36px] gap-1 px-4 py-2 bg-bg-tertiary/5 border-b border-border/10 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
								<span>Equipo</span>
								<span className="text-right">PJ</span>
								<span className="text-right">GF</span>
								<span className="text-right">GC</span>
								<span className="text-right">Pts</span>
							</div>

							{/* Standings rows */}
							{standings.length === 0 ? (
								<div className="px-4 py-8 text-center text-text-muted text-xs">
									Sin datos de grupo
								</div>
							) : (
								standings.map((team, i) => {
									const isQualifying = i < 2; // top 2 qualify
									const rowColors = [
										"bg-accent/5 border-l-2 border-l-accent/40",
										"bg-accent/3 border-l-2 border-l-accent/20",
										"",
										"",
										"",
									];

									return (
										<div
											key={team.name}
											className={`grid grid-cols-[1fr_28px_28px_28px_32px] sm:grid-cols-[1fr_32px_32px_32px_36px] gap-1 px-4 py-2.5
                        border-b border-border/30 last:border-0 hover:bg-bg-tertiary/30 transition-colors duration-150
                        ${isQualifying ? rowColors[i] : ""}
                        ${i === standings.length - 1 ? "border-b-0" : ""}`}
										>
											<div className="flex items-center gap-2 min-w-0">
												{/* Position badge */}
												<span
													className={`font-bold text-[11px] sm:text-xs tabular-nums shrink-0 w-4 text-center ${
														i === 0
															? "text-accent"
															: i === 1
																? "text-accent/70"
																: "text-text-muted"
													}`}
												>
													{i + 1}
												</span>
												<img
													src={getFlagUrl(team.name, 20) || ""}
													alt={team.name}
													className="w-4 h-3 sm:w-5 sm:h-4 rounded-sm object-cover shrink-0 shadow-sm"
												/>
												<span className="text-xs sm:text-sm font-medium truncate text-text-primary">
													{team.name}
												</span>
											</div>
											<span className="text-right text-xs sm:text-sm tabular-nums text-text-primary font-medium">
												{team.pj}
											</span>
											<span className="text-right text-xs sm:text-sm tabular-nums text-text-primary">
												{team.gf}
											</span>
											<span className="text-right text-xs sm:text-sm tabular-nums text-text-primary">
												{team.gc}
											</span>
											<span
												className={`text-right text-xs sm:text-sm font-bold tabular-nums ${
													isQualifying ? "text-accent" : "text-text-primary"
												}`}
											>
												{team.pts}
											</span>
										</div>
									);
								})
							)}

							{/* Footer legend */}
							<div className="px-4 py-2 border-t border-border/10 flex items-center gap-3 text-[9px] sm:text-[10px] text-text-muted">
								<span>DG: dif. de gol</span>
								<span>3 pts · 1 emp · 0 der</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
