import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchAllMatches, mergeApiIntoDbMatch } from "@/lib/fifa-api";
import { syncResultsFromApi } from "@/lib/fifa-sync";
import { es, isPlaceholder } from "@/lib/translate-label";
import MatchList from "@/components/MatchList";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	// Sincronizar resultados automáticos desde la API
	await syncResultsFromApi();

	const session = await auth();

	const dbMatches = await prisma.match.findMany({
		orderBy: { date: "asc" },
		include: {
			predictions: session?.user?.id
				? {
						where: { userId: session.user.id },
						select: { homeGoals: true, awayGoals: true, points: true },
					}
				: false,
		},
	});

	const apiMatches = await fetchAllMatches(dbMatches);

	const serialized = dbMatches.map((m) => {
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
		// Preferir DB si la API devuelve placeholder ("Winner Match XX")
		const apiHome = apiMatch?.homeTeam;
		const apiAway = apiMatch?.awayTeam;
		const resolvedHome = apiHome && !isPlaceholder(apiHome) ? apiHome : m.homeTeam;
		const resolvedAway = apiAway && !isPlaceholder(apiAway) ? apiAway : m.awayTeam;
		return {
			id: m.id,
			matchNumber: m.matchNumber,
			homeTeam: resolvedHome ? es(resolvedHome) : resolvedHome,
			awayTeam: resolvedAway ? es(resolvedAway) : resolvedAway,
			homeGoals: live.homeGoals,
			awayGoals: live.awayGoals,
			date: m.date.toISOString(),
			venue: m.venue,
			group: m.group,
			stage: m.stage,
			status: live.status,
			userPrediction: Array.isArray(m.predictions)
				? m.predictions[0] || null
				: null,
		};
	});

	const finishedCount = dbMatches.filter((m) => {
		const live = mergeApiIntoDbMatch(
			{
				matchNumber: m.matchNumber,
				homeGoals: m.homeGoals,
				awayGoals: m.awayGoals,
				status: m.status,
			},
			apiMatches,
		);
		return live.status === "FINISHED";
	}).length;
	const totalMatches = dbMatches.length;

	// Group stage progress: how many groups have all matches finished
	const groups = "ABCDEFGHIJKL".split("");
	const groupsFinished = groups.filter((g) => {
		const groupMatches = dbMatches.filter(
			(m) => m.group === g && m.stage === "GROUP",
		);
		return (
			groupMatches.length === 6 &&
			groupMatches.every((m) => {
				const live = mergeApiIntoDbMatch(
					{
						matchNumber: m.matchNumber,
						homeGoals: m.homeGoals,
						awayGoals: m.awayGoals,
						status: m.status,
					},
					apiMatches,
				);
				return live.status === "FINISHED";
			})
		);
	}).length;

	const tournamentStart = new Date("2026-06-11");
	const tournamentEnd = new Date("2026-07-19");
	const now = new Date();
	const daysLeft = Math.max(
		0,
		Math.ceil((tournamentStart.getTime() - now.getTime()) / 86400000),
	);
	const tournamentStarted = now >= tournamentStart;
	const tournamentOver = now > tournamentEnd;

	return (
		<>
			{/* Messi background — right side, fixed, 22% opacity, faded */}
			<div
				className="fixed top-0 left-0 pointer-events-none z-0"
				style={{
					width: "100vw",
					height: "100dvh",
					backgroundImage: "url('/messicopa.webp')",
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
			<div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
				{/* Hero — World Cup 2026 */}
				<div className="relative mb-8 sm:mb-10">
					{/* Background glow */}
					<div className="absolute -inset-4 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 rounded-3xl blur-2xl pointer-events-none" />

					<div className="relative">
						{/* Top badge */}
						<div className="flex items-center gap-2 mb-4">
							<span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest">
								<span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
								FIFA World Cup 2026
							</span>
							{tournamentStarted && !tournamentOver && (
								<span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gold font-medium bg-gold/5 border border-gold/10 px-2 py-1 rounded-full">
									🏟️ En juego
								</span>
							)}
						</div>

						{/* Title */}
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
							<span className="text-text-primary">Prode</span>{" "}
							<span className="bg-gradient-to-r from-accent via-accent-glow to-accent bg-clip-text text-transparent">
								Mundial
							</span>
						</h1>
						<div className="flex items-center gap-3 mt-1">
							<span className="text-5xl sm:text-6xl font-black text-gold animate-float drop-shadow-[0_0_18px_rgba(245,158,11,0.3)]">
								🏆
							</span>
							<span className="text-4xl sm:text-5xl font-black text-text-primary/90 tracking-tighter">
								2026
							</span>
						</div>

						{/* Subtitle */}
						<p className="text-text-secondary mt-2 sm:mt-3 text-sm sm:text-base max-w-lg leading-relaxed">
							11 junio – 19 julio · 48 selecciones · 104 partidos ·{" "}
							<span className="text-text-primary font-medium">
								Canadá 🇨🇦 México 🇲🇽 EE.UU. 🇺🇸
							</span>
						</p>

						{/* Stats row */}
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 sm:mt-5">
							<div className="flex items-center gap-1.5 text-xs sm:text-sm">
								<div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-lg px-2.5 py-1.5">
									<span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
									<span className="text-text-primary font-semibold tabular-nums">
										{finishedCount}
									</span>
									<span className="text-text-muted">
										/ {totalMatches} jugados
									</span>
								</div>
							</div>
							{groupsFinished > 0 && (
								<div className="flex items-center gap-1 text-xs sm:text-sm">
									<div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-lg px-2.5 py-1.5">
										<span className="text-gold text-sm">✓</span>
										<span className="text-text-primary font-semibold tabular-nums">
											{groupsFinished}
										</span>
										<span className="text-text-muted">grupos cerrados</span>
									</div>
								</div>
							)}
							{daysLeft > 0 && (
								<div className="flex items-center gap-1 text-xs sm:text-sm animate-shimmer">
									<div className="flex items-center gap-1 bg-gold/5 border border-gold/20 rounded-lg px-2.5 py-1.5">
										<span className="text-gold">⏳</span>
										<span className="text-gold font-semibold tabular-nums">
											{daysLeft}
										</span>
										<span className="text-gold/70">días para el inicio</span>
									</div>
								</div>
							)}
							{!session?.user && (
								<a
									href="/login"
									className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-black font-semibold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm shadow-accent/20 hover:shadow-accent/30 active:scale-95"
								>
									⚽ Ingresá y pronosticá
								</a>
							)}
						</div>
					</div>
				</div>

				<MatchList matches={serialized} isLoggedIn={!!session?.user} />
			</div>
		</>
	);
}
