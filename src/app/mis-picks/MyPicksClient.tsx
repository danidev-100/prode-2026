"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { getFlagUrl } from "@/lib/flags";

interface Prediction {
	homeGoals: number;
	awayGoals: number;
	points: number | null;
}

interface SerializedMatch {
	id: string;
	matchNumber: number;
	homeTeam: string | null;
	awayTeam: string | null;
	homeGoals: number | null;
	awayGoals: number | null;
	date: string;
	venue: string;
	stage: string;
	group: string | null;
	status: string;
	prediction: Prediction | null;
	resultType: "exacto" | "acertado" | "errado" | "pendiente" | "sin-pronostico";
}

const FILTERS = [
	{ key: "all", label: "Todos" },
	{ key: "pendiente", label: "⏳ Pendientes" },
	{ key: "exacto", label: "🌟 Exactos" },
	{ key: "acertado", label: "✅ Acertados" },
	{ key: "errado", label: "❌ Errados" },
	{ key: "sin-pronostico", label: "Sin pronóstico" },
] as const;

const stageBadge: Record<string, { label: string; color: string }> = {
	GROUP: { label: "Grupo", color: "bg-bg-tertiary text-text-secondary" },
	R32: { label: "16avos", color: "bg-accent/10 text-accent" },
	R16: { label: "8avos", color: "bg-accent/10 text-accent" },
	QUARTER: { label: "Cuartos", color: "bg-gold/10 text-gold" },
	SEMI: { label: "Semis", color: "bg-gold/10 text-gold" },
	THIRD_PLACE: { label: "3er Puesto", color: "bg-bronze/10 text-bronze" },
	FINAL: { label: "Final", color: "bg-gold/20 text-gold" },
};

export default function MyPicksClient({
	matches,
}: {
	matches: SerializedMatch[];
}) {
	const [filter, setFilter] = useState<string>("all");
	const scrollRef = useRef<HTMLDivElement>(null);

	const filtered = useMemo(() => {
		if (filter === "all") return matches;
		return matches.filter((m) => m.resultType === filter);
	}, [matches, filter]);

	const grouped = useMemo(() => {
		const map = new Map<string, SerializedMatch[]>();

		for (const match of filtered) {
			if (match.resultType === "sin-pronostico") continue;
			const d = new Date(match.date);
			const key = d.toLocaleDateString("es-AR", {
				weekday: "long",
				day: "numeric",
				month: "long",
			});
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(match);
		}

		return Array.from(map.entries());
	}, [filtered]);

	// Scroll active pill into view on mobile
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const active = el.querySelector(`[data-filter="${filter}"]`);
		if (active) {
			active.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [filter]);

	const pillClass = (key: string) =>
		`shrink-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
			filter === key
				? "bg-accent text-black shadow-sm shadow-accent/20"
				: "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-border hover:border-border-hover"
		}`;

	const resultColors: Record<
		string,
		{ bg: string; text: string; label: string }
	> = {
		exacto: {
			bg: "bg-accent/5 border-l-2 border-l-accent",
			text: "text-accent",
			label: "🌟 Exacto",
		},
		acertado: {
			bg: "bg-accent/3 border-l-2 border-l-accent/50",
			text: "text-accent/70",
			label: "✅ Acertado",
		},
		errado: {
			bg: "bg-red-900/10 border-l-2 border-l-danger/40",
			text: "text-danger",
			label: "❌ Errado",
		},
		pendiente: {
			bg: "bg-gold/5 border-l-2 border-l-gold/30",
			text: "text-gold",
			label: "⏳ Pendiente",
		},
		"sin-pronostico": { bg: "", text: "text-text-muted", label: "—" },
	};

	return (
		<div className="flex flex-col">
			{/* Filter pills */}
			<div className="sm:hidden mb-4 -mx-4 px-4">
				<div
					ref={scrollRef}
					className="flex gap-1.5 overflow-x-auto pb-2"
					style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
				>
					{FILTERS.map((f) => (
						<button
							key={f.key}
							data-filter={f.key}
							onClick={() => setFilter(f.key)}
							className={pillClass(f.key)}
						>
							{f.label}
						</button>
					))}
				</div>
				<div className="text-[11px] text-text-muted mt-1 tabular-nums">
					{filtered.filter((m) => m.resultType !== "sin-pronostico").length}{" "}
					partidos
				</div>
			</div>

			{/* Desktop filters */}
			<div className="hidden sm:flex flex-wrap items-center gap-1.5 mb-6">
				{FILTERS.filter((f) => f.key !== "sin-pronostico").map((f) => (
					<button
						key={f.key}
						onClick={() => setFilter(f.key)}
						className={pillClass(f.key)}
					>
						{f.label}
					</button>
				))}
				<span className="text-[11px] text-text-muted ml-auto tabular-nums">
					{filtered.filter((m) => m.resultType !== "sin-pronostico").length}{" "}
					partidos
				</span>
			</div>

			{/* Match list */}
			{grouped.length === 0 ? (
				<div className="text-center py-16">
					<div className="text-4xl mb-3">📋</div>
					<p className="text-text-muted text-sm">
						{filter === "all"
							? "No empezaste a pronosticar todavía"
							: `No hay pronósticos con este filtro`}
					</p>
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
								{dayMatches.map((match) => {
									const rc =
										resultColors[match.resultType] ||
										resultColors["sin-pronostico"];
									const badge = stageBadge[match.stage] || stageBadge.GROUP;
									const pred = match.prediction;

									return (
										<div
											key={match.id}
											className={`bg-transparent border border-border/10 rounded-xl p-3 sm:p-4 transition-all duration-200
                        hover:border-border-hover hover:bg-bg-tertiary/5 ${rc.bg}`}
										>
											{/* Header */}
											<div className="flex items-center justify-between gap-1.5 mb-2">
												<span
													className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${badge.color}`}
												>
													{badge.label} {match.group || ""}
												</span>
												<span
													className={`text-[10px] font-semibold ${rc.text}`}
												>
													{rc.label}
												</span>
											</div>

											{/* Teams + score */}
											<div className="flex items-center justify-between gap-3">
												{/* Home */}
												<div className="flex-1 min-w-0 flex items-center justify-end gap-2">
													<span className="font-semibold text-sm truncate text-right">
														{match.homeTeam || `Equipo ${match.group || ""}1`}
													</span>
													{getFlagUrl(match.homeTeam) && (
														<img
															src={getFlagUrl(match.homeTeam)!}
															alt={match.homeTeam ?? ""}
															className="w-6 h-4 rounded-[2px] object-cover shrink-0"
														/>
													)}
												</div>

												{/* Prediction */}
												<div className="flex flex-col items-center shrink-0 px-2 gap-0.5">
													{pred ? (
														<>
															<div className="flex items-center gap-1.5">
																<span className="text-base sm:text-lg font-bold tabular-nums text-accent">
																	{pred.homeGoals}
																</span>
																<span className="text-xs text-accent/30 font-light">
																	—
																</span>
																<span className="text-base sm:text-lg font-bold tabular-nums text-accent">
																	{pred.awayGoals}
																</span>
															</div>
															{match.status === "FINISHED" &&
																match.homeGoals !== null && (
																	<span className="text-[10px] text-text-muted tabular-nums">
																		Real: {match.homeGoals}—{match.awayGoals}
																	</span>
																)}
															{match.status === "FINISHED" &&
																pred.points !== null && (
																	<span
																		className={`text-[10px] font-bold ${pred.points >= 2 ? "text-accent" : "text-danger"}`}
																	>
																		{pred.points} pts
																	</span>
																)}
															{match.status !== "FINISHED" && (
																<span className="text-[10px] text-gold font-medium">
																	Pendiente
																</span>
															)}
														</>
													) : (
														<span className="text-sm text-text-muted/50">
															—
														</span>
													)}
												</div>

												{/* Away */}
												<div className="flex-1 min-w-0 flex items-center gap-2">
													{getFlagUrl(match.awayTeam) && (
														<img
															src={getFlagUrl(match.awayTeam)!}
															alt={match.awayTeam ?? ""}
															className="w-6 h-4 rounded-[2px] object-cover shrink-0"
														/>
													)}
													<span className="font-semibold text-sm truncate">
														{match.awayTeam || `Equipo ${match.group || ""}2`}
													</span>
												</div>
											</div>

											{/* Venue */}
											<div className="mt-2 flex items-center gap-1 text-[10px] text-text-primary/60">
												<svg
													className="w-3 h-3 shrink-0"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={1.5}
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
													/>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
													/>
												</svg>
												<span className="truncate">{match.venue}</span>
												<span className="ml-auto text-text-muted text-[9px]">
													#{match.matchNumber}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
