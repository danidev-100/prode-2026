import { prisma } from "@/lib/prisma";
import { getFlagUrl } from "@/lib/flags";
import { es } from "@/lib/translate-label";
import { fetchAllMatches, mergeApiIntoDbMatch } from "@/lib/fifa-api";
import { syncResultsFromApi } from "@/lib/fifa-sync";

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
			if (m.homeGoals > m.awayGoals) home.pts += 3;
			else if (m.homeGoals < m.awayGoals) away.pts += 3;
			else {
				home.pts += 1;
				away.pts += 1;
			}
		}
	}
	return Array.from(teamsMap.entries())
		.map(([name, stats]) => ({ name, ...stats, dg: stats.gf - stats.gc }))
		.sort((a, b) => {
			if (b.pts !== a.pts) return b.pts - a.pts;
			if (b.dg !== a.dg) return b.dg - a.dg;
			return b.gf - a.gf;
		});
}

const GROUPS = "ABCDEFGHIJKL".split("");
const KNOCKOUT = [
	"R32",
	"R16",
	"QUARTER",
	"SEMI",
	"THIRD_PLACE",
	"FINAL",
] as const;
const ROUND: Record<string, { icon: string; label: string }> = {
	R32: { icon: "🌊", label: "16avos" },
	R16: { icon: "🛡️", label: "Octavos" },
	QUARTER: { icon: "🏰", label: "Cuartos" },
	SEMI: { icon: "🔥", label: "Semis" },
	THIRD_PLACE: { icon: "🥉", label: "3er puesto" },
	FINAL: { icon: "🏆", label: "Final" },
};

function MatchRow({
	name,
	score,
	won,
	side,
}: {
	name: string | null;
	score: number | null;
	won: boolean;
	side: "L" | "V";
}) {
	return (
		<div
			className={`flex items-center gap-1.5 min-w-0 px-3 py-1.5 ${won ? "bg-accent/5 border-l-[3px] border-l-accent" : "border-l-[3px] border-l-transparent"}`}
		>
			<span className="font-bold text-[9px] tabular-nums w-3 text-center shrink-0 text-text-muted/20">
				{side}
			</span>
			{name && getFlagUrl(name, 20) ? (
				<img
					src={getFlagUrl(name, 20)!}
					alt=""
					className="w-3 h-2 rounded-sm object-cover shrink-0"
				/>
			) : (
				<div className="w-3 h-2 shrink-0" />
			)}
			<span
				className={`text-[11px] sm:text-xs truncate overflow-hidden min-w-0 flex-1 ${won ? "text-accent font-bold" : "text-text-primary font-medium"}`}
			>
				{name ? es(name) : "—"}
			</span>
			<span
				className={`text-right text-[11px] sm:text-xs font-bold tabular-nums w-3.5 shrink-0 ${won ? "text-accent" : "text-text-muted"}`}
			>
				{score !== null ? score : "—"}
			</span>
		</div>
	);
}

export default async function PosicionesPage() {
	// Sincronizar resultados automáticos desde la API
	await syncResultsFromApi();

	const dbMatches = await prisma.match.findMany({ orderBy: { date: "asc" } });
	const apiMatches = await fetchAllMatches(dbMatches);

	// Overlay API scores + team names onto DB matches
	const liveMatches = dbMatches.map((m) => {
		const live = mergeApiIntoDbMatch(
			{
				matchNumber: m.matchNumber,
				homeGoals: m.homeGoals,
				awayGoals: m.awayGoals,
				status: m.status,
			},
			apiMatches,
		);
		const apiMatch = apiMatches?.get(m.matchNumber);
		return {
			...m,
			homeTeam: apiMatch?.homeTeam || m.homeTeam,
			awayTeam: apiMatch?.awayTeam || m.awayTeam,
			homeGoals: live.homeGoals,
			awayGoals: live.awayGoals,
			status: live.status,
		};
	});

	const groupMatches = liveMatches.filter((m) => m.stage === "GROUP");
	const koMatches = liveMatches.filter((m) =>
		KNOCKOUT.includes(m.stage as (typeof KNOCKOUT)[number]),
	);

	const groupsData = GROUPS.map((letter) => {
		const gm = groupMatches.filter((m) => m.group === letter);
		return { letter, standings: computeStandings(letter, gm) };
	}).filter((g) => g.standings.length > 0);

	return (
		<>
			<div
				className="fixed top-0 left-0 pointer-events-none z-0"
				style={{
					width: "100vw",
					height: "100dvh",
					backgroundImage: "url('/julian - copia.jpg')",
					backgroundPosition: "center center",
					backgroundRepeat: "no-repeat",
					backgroundSize: "cover",
					opacity: 0.22,
					maskImage:
						"linear-gradient(to right, transparent 0%, black 30%, black 100%)",
					WebkitMaskImage:
						"linear-gradient(to right, transparent 0%, black 30%, black 100%)",
				}}
			/>
			<div className="max-w-4xl mx-auto py-6 sm:py-8 px-4">
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
							12 grupos · 48 selecciones · 3 pts victoria · 1 pt empate · 0
							derrota
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
					{groupsData.map(({ letter, standings }) => {
						const fin = groupMatches.filter(
							(m) => m.group === letter && m.status === "FINISHED",
						).length;
						return (
							<div
								key={letter}
								className="bg-transparent border border-border/5 rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/30"
							>
								<div className="px-4 py-3 bg-bg-tertiary/10 border-b border-border/20 flex items-center justify-between">
									<h2 className="font-bold text-sm sm:text-base text-text-primary tracking-wide">
										Grupo <span className="text-accent">{letter}</span>
									</h2>
									<span className="text-[10px] sm:text-xs text-text-muted tabular-nums">
										{fin}/6 jugados
									</span>
								</div>
								<div className="grid grid-cols-[1fr_28px_28px_28px_32px] sm:grid-cols-[1fr_32px_32px_32px_36px] gap-1 px-4 py-2 bg-bg-tertiary/5 border-b border-border/10 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
									<span>Equipo</span>
									<span className="text-right">PJ</span>
									<span className="text-right">GF</span>
									<span className="text-right">GC</span>
									<span className="text-right">Pts</span>
								</div>
								{standings.length === 0 ? (
									<div className="px-4 py-8 text-center text-text-muted text-xs">
										Sin datos de grupo
									</div>
								) : (
									standings.map((team, i) => {
										const top = i < 2;
										const colors = [
											"bg-accent/5 border-l-2 border-l-accent/40",
											"bg-accent/3 border-l-2 border-l-accent/20",
											"",
											"",
											"",
										];
										return (
											<div
												key={team.name}
												className={`grid grid-cols-[1fr_28px_28px_28px_32px] sm:grid-cols-[1fr_32px_32px_32px_36px] gap-1 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-bg-tertiary/30 transition-colors duration-150 ${top ? colors[i] : ""} ${i === standings.length - 1 ? "border-b-0" : ""}`}
											>
												<div className="flex items-center gap-2 min-w-0">
													<span
														className={`font-bold text-[11px] sm:text-xs tabular-nums shrink-0 w-4 text-center ${i === 0 ? "text-accent" : i === 1 ? "text-accent/70" : "text-text-muted"}`}
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
													className={`text-right text-xs sm:text-sm font-bold tabular-nums ${top ? "text-accent" : "text-text-primary"}`}
												>
													{team.pts}
												</span>
											</div>
										);
									})
								)}
								<div className="px-4 py-2 border-t border-border/10 flex items-center gap-3 text-[9px] sm:text-[10px] text-text-muted">
									<span>DG: dif. de gol</span>
									<span>3 pts · 1 emp · 0 der</span>
								</div>
							</div>
						);
					})}
				</div>

				{/* ── Knockout ── */}
				{koMatches.length > 0 && (
					<>
						<div className="flex items-center gap-3 my-8 sm:my-10">
							<div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
							<span className="text-accent text-lg" aria-hidden>
								🏆
							</span>
							<div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
						</div>

						<div className="flex flex-col gap-4 sm:gap-6">
							{KNOCKOUT.map((stage) => {
								const stageMatches = koMatches.filter((m) => m.stage === stage);
								if (stageMatches.length === 0) return null;
								const meta = ROUND[stage];

								return (
									<div
										key={stage}
										className="bg-transparent border border-border/5 rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/30"
									>
										<div className="px-4 py-3 bg-bg-tertiary/10 border-b border-border/20 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="text-base">{meta.icon}</span>
												<h3 className="font-bold text-sm sm:text-base text-text-primary tracking-wide">
													{meta.label}
												</h3>
											</div>
											<span className="text-[10px] sm:text-xs text-text-muted tabular-nums">
												{stageMatches.length} partido
												{stageMatches.length !== 1 ? "s" : ""}
											</span>
										</div>

										<div className="p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
											{stageMatches.map((m) => {
												const hw =
													m.status === "FINISHED" &&
													(m.homeGoals ?? 0) > (m.awayGoals ?? 0);
												const aw =
													m.status === "FINISHED" &&
													(m.awayGoals ?? 0) > (m.homeGoals ?? 0);
												return (
													<div
														key={m.id}
														className="bg-bg-secondary/30 border border-border/5 rounded-lg overflow-hidden"
													>
														<div className="px-2 py-1 bg-bg-tertiary/5 border-b border-border/10 flex items-center justify-between">
															<span className="text-[8px] font-semibold text-text-muted/50">
																#{m.matchNumber}
															</span>
															<span className="text-[8px] text-text-muted/30">
																{meta.icon}
															</span>
														</div>
														<MatchRow
															name={m.homeTeam}
															score={m.homeGoals}
															won={hw}
															side="L"
														/>
														<div className="h-px bg-gradient-to-r from-transparent via-border/5 to-transparent mx-2" />
														<MatchRow
															name={m.awayTeam}
															score={m.awayGoals}
															won={aw}
															side="V"
														/>
													</div>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}
			</div>
		</>
	);
}
