"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getFlagUrl } from "@/lib/flags";

interface MatchCardProps {
	id: string;
	matchNumber: number;
	homeTeam: string | null;
	awayTeam: string | null;
	homeGoals: number | null;
	awayGoals: number | null;
	date: string;
	venue: string;
	group: string | null;
	stage: string;
	status: string;
	userPrediction: {
		homeGoals: number;
		awayGoals: number;
		points: number | null;
	} | null;
}

const stageBadge: Record<
	string,
	{ label: string; color: string; icon: string }
> = {
	GROUP: {
		label: "Grupo",
		color: "bg-bg-tertiary text-text-secondary border-border",
		icon: "",
	},
	R32: {
		label: "16avos",
		color: "bg-accent/10 text-accent border-accent/20",
		icon: "⚡",
	},
	R16: {
		label: "8avos",
		color: "bg-accent/10 text-accent border-accent/20",
		icon: "🔥",
	},
	QUARTER: {
		label: "Cuartos",
		color: "bg-gold/10 text-gold border-gold/20",
		icon: "⭐",
	},
	SEMI: {
		label: "Semifinal",
		color: "bg-gold/10 text-gold border-gold/20",
		icon: "🌟",
	},
	THIRD_PLACE: {
		label: "3er Puesto",
		color: "bg-bronze/10 text-bronze border-bronze/20",
		icon: "🥉",
	},
	FINAL: {
		label: "Final",
		color:
			"bg-gradient-to-r from-gold/20 to-accent/10 text-gold border-gold/30",
		icon: "🏆",
	},
};

export default function MatchCard({
	id,
	matchNumber,
	homeTeam,
	awayTeam,
	homeGoals,
	awayGoals,
	date,
	venue,
	group,
	stage,
	status,
	userPrediction,
}: MatchCardProps) {
	const { status: sessionStatus } = useSession();
	const router = useRouter();
	const [home, setHome] = useState(userPrediction?.homeGoals?.toString() ?? "");
	const [away, setAway] = useState(userPrediction?.awayGoals?.toString() ?? "");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(!!userPrediction);
	const [error, setError] = useState("");

	const matchDate = new Date(date);
	const lockDate = new Date(matchDate.getTime() - 3 * 60 * 60 * 1000);
	const isLocked = new Date() > lockDate;
	const isFinished = status === "FINISHED";
	const isLoggedIn = sessionStatus === "authenticated";
	const showForm = !isFinished && isLoggedIn && !isLocked;
	const showLogin = !isFinished && !isLoggedIn;

	const displayHome = homeTeam || `Equipo ${group || ""}1`;
	const displayAway = awayTeam || `Equipo ${group || ""}2`;
	const badge = stageBadge[stage] || stageBadge.GROUP;

	async function handleSave() {
		const h = parseInt(home);
		const a = parseInt(away);
		if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
			setError("Goles inválidos");
			return;
		}

		setSaving(true);
		setError("");

		const res = await fetch("/api/predictions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ matchId: id, homeGoals: h, awayGoals: a }),
		});

		setSaving(false);

		if (!res.ok) {
			const data = await res.json();
			setError(data.error || "Error al guardar");
			return;
		}

		setSaved(true);
		router.refresh();
	}

	const dateStr = matchDate.toLocaleDateString("es-AR", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
	const timeStr = matchDate.toLocaleTimeString("es-AR", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	const isKnockout = stage !== "GROUP";
	const isHighlight = stage === "FINAL" || stage === "SEMI";

	return (
		<div
			className={`group relative bg-transparent border rounded-xl p-3 sm:p-4 transition-all duration-300
        hover:border-border-hover hover:bg-bg-tertiary/5 hover:shadow-lg hover:shadow-black/5
        ${isFinished ? "border-border/20" : "border-border/10"}
        ${isHighlight ? "ring-1 ring-gold/10 hover:ring-gold/20" : ""}
      `}
		>
			{/* Subtle top accent line for knockout */}
			{isKnockout && (
				<div
					className={`absolute top-0 left-4 right-4 h-[1px] rounded-full ${
						stage === "FINAL"
							? "bg-gradient-to-r from-transparent via-gold to-transparent"
							: stage === "SEMI" || stage === "QUARTER"
								? "bg-gradient-to-r from-transparent via-accent/40 to-transparent"
								: "bg-gradient-to-r from-transparent via-accent/20 to-transparent"
					}`}
				/>
			)}

			{/* Header */}
			<div
				className={`flex items-center justify-between gap-1.5 ${isKnockout ? "mt-1" : ""} mb-3`}
			>
				<div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
					<span
						className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap border ${badge.color}`}
					>
						{badge.icon && <span className="mr-0.5">{badge.icon}</span>}
						{badge.label} {group || ""}
					</span>
					<span className="text-[10px] text-text-primary/70 tabular-nums">
						#{matchNumber}
					</span>
				</div>
				<div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-text-primary/80 shrink-0">
					<span className="capitalize">{dateStr}</span>
					<span>·</span>
					<span className="tabular-nums">{timeStr} hs</span>
				</div>
			</div>

			{/* Match */}
			<div className="flex items-center justify-between gap-2 sm:gap-4">
				{/* Home team */}
				<div className="flex-1 min-w-0 flex items-center justify-end gap-2">
					<span className="font-semibold text-sm sm:text-base truncate text-right">
						{displayHome}
					</span>
					{getFlagUrl(homeTeam) && (
						<img
							src={getFlagUrl(homeTeam)!}
							alt={homeTeam ?? ""}
							className="w-7 h-5 sm:w-8 sm:h-5.5 rounded-[3px] object-cover shadow-sm flex-shrink-0 ring-1 ring-white/5"
						/>
					)}
				</div>

				{/* Score / Prediction */}
				<div className="flex flex-col items-center shrink-0 px-2 sm:px-3 gap-1">
					{isFinished && homeGoals !== null && awayGoals !== null ? (
						userPrediction ? (
							<>
								{/* Numbers only — centered with team names, no label to push down */}
								<div className="flex items-center gap-1.5 sm:gap-2">
									<span className="text-lg sm:text-xl font-bold tabular-nums text-accent">
										{userPrediction.homeGoals}
									</span>
									<span className="text-sm sm:text-base text-accent/30 font-light">
										—
									</span>
									<span className="text-lg sm:text-xl font-bold tabular-nums text-accent">
										{userPrediction.awayGoals}
									</span>
								</div>
							</>
						) : (
							<>
								{/* No prediction — show real result as primary */}
								<span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-text-primary/60 font-semibold">
									Resultado
								</span>
								<div className="flex items-center gap-1.5 sm:gap-2">
									<span className="text-lg sm:text-xl font-bold tabular-nums text-text-primary">
										{homeGoals}
									</span>
									<span className="text-sm sm:text-base text-text-primary/30 font-light">
										—
									</span>
									<span className="text-lg sm:text-xl font-bold tabular-nums text-text-primary">
										{awayGoals}
									</span>
								</div>
							</>
						)
					) : saved || userPrediction ? (
						<>
							<span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-text-primary/60 font-semibold">
								Tu pronóstico
							</span>
							<div className="flex items-center gap-2 sm:gap-3">
								<span className="text-base sm:text-lg font-semibold tabular-nums text-accent">
									{userPrediction?.homeGoals ?? home}
								</span>
								<span className="text-text-primary/30 text-xs sm:text-sm">
									—
								</span>
								<span className="text-base sm:text-lg font-semibold tabular-nums text-accent">
									{userPrediction?.awayGoals ?? away}
								</span>
							</div>
						</>
					) : showForm ? (
						<div className="flex items-center gap-2">
							<input
								type="number"
								min={0}
								max={99}
								value={home}
								onChange={(e) => setHome(e.target.value)}
								placeholder="—"
								className="w-11 h-10 sm:w-12 sm:h-9 text-center text-sm font-semibold bg-bg-tertiary/10 border border-border/10 rounded-lg
                  focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200
                  placeholder:text-text-muted/30 text-text-primary tabular-nums"
							/>
							<span className="text-text-primary/40 text-xs font-light">
								vs
							</span>
							<input
								type="number"
								min={0}
								max={99}
								value={away}
								onChange={(e) => setAway(e.target.value)}
								placeholder="—"
								className="w-11 h-10 sm:w-12 sm:h-9 text-center text-sm font-semibold bg-bg-tertiary/10 border border-border/10 rounded-lg
                  focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200
                  placeholder:text-text-muted/30 text-text-primary tabular-nums"
							/>
						</div>
					) : showLogin ? (
						<span className="text-xs text-text-primary/50 py-2">—</span>
					) : isLocked ? (
						<div className="flex items-center gap-1.5 py-1">
							<svg
								className="w-3.5 h-3.5 text-gold"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							<span className="text-xs text-gold font-medium">Cerrado</span>
						</div>
					) : (
						<span className="text-lg sm:text-xl font-bold text-text-primary/20 py-1">
							VS
						</span>
					)}
				</div>

				{/* Away team */}
				<div className="flex-1 min-w-0 flex items-center gap-2">
					{getFlagUrl(awayTeam) && (
						<img
							src={getFlagUrl(awayTeam)!}
							alt={awayTeam ?? ""}
							className="w-7 h-5 sm:w-8 sm:h-5.5 rounded-[3px] object-cover shadow-sm flex-shrink-0 ring-1 ring-white/5"
						/>
					)}
					<span className="font-semibold text-sm sm:text-base truncate">
						{displayAway}
					</span>
				</div>
			</div>

			{/* Finished match: points + result below (outside match row — keeps numbers aligned) */}
			{isFinished && homeGoals !== null && awayGoals !== null && (
				<div className="flex flex-col items-center gap-0.5 mt-1">
					{userPrediction ? (
						<>
							{/* Label */}
							<span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-accent/70 font-semibold">
								Tu pronóstico
							</span>
							{/* Points */}
							<div className="text-[10px] sm:text-[11px] leading-tight">
								{userPrediction.points !== null &&
								userPrediction.points !== undefined ? (
									<span
										className={`font-bold ${userPrediction.points >= 2 ? "text-accent" : "text-danger"}`}
									>
										{userPrediction.points === 3
											? "🌟 3 puntos"
											: userPrediction.points === 2
												? "✅ 2 puntos"
												: "❌ 0 puntos"}
									</span>
								) : (
									<span className="text-text-primary/50 italic">
										Puntos: pendiente
									</span>
								)}
							</div>
							{/* Real result — small, muted */}
							<div className="text-[10px] sm:text-[11px] leading-tight pt-0.5 border-t border-border/30">
								<span className="text-text-primary/60">
									Resultado:{" "}
									<span className="font-medium text-text-primary/80 tabular-nums">
										{homeGoals}—{awayGoals}
									</span>
								</span>
							</div>
						</>
					) : isLoggedIn ? (
						<span className="text-[10px] sm:text-[11px] text-text-primary/50 italic">
							No pronosticaste
						</span>
					) : null}
				</div>
			)}

			{/* Venue + stadium feel */}
			<div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-text-primary/70">
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
				<span className="truncate">{venue}</span>
			</div>

			{/* Actions */}
			<div className="mt-3 min-h-[28px]">
				{showForm && !saved && (
					<div className="flex flex-col sm:flex-row sm:items-center gap-2">
						<button
							onClick={handleSave}
							disabled={saving}
							className="w-full sm:w-auto bg-gradient-to-r from-accent to-accent-hover hover:from-accent-glow hover:to-accent text-black font-semibold text-xs px-4 py-2.5 sm:py-1.5 rounded-lg
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                min-h-[44px] sm:min-h-0 shadow-sm shadow-accent/20"
						>
							{saving ? "Guardando..." : "Guardar pronóstico"}
						</button>
						{error && (
							<span className="text-danger text-xs text-center sm:text-left">
								{error}
							</span>
						)}
					</div>
				)}

				{showForm && saved && (
					<span className="text-xs text-accent font-medium flex items-center gap-1 py-1">
						<svg
							className="w-3.5 h-3.5 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						Pronóstico guardado
					</span>
				)}

				{isLocked && userPrediction && (
					<span className="text-[10px] sm:text-[11px] text-gold/60 flex items-center gap-1">
						<svg
							className="w-3 h-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
						Se bloquea 3hs antes del partido
					</span>
				)}
			</div>
		</div>
	);
}
