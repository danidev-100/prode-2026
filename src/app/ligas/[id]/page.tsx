"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface RankingEntry {
	userId: string;
	name: string;
	points: number;
	predictions: number;
	correctResults: number;
	exactScores: number;
	role: string;
	joinedAt: string;
}

interface LeagueData {
	id: string;
	name: string;
	code: string;
	createdBy: string;
	memberCount: number;
	createdAt: string;
	isMember: boolean;
	currentUserRank: number | null;
	ranking: RankingEntry[];
}

export default function LeagueDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { status } = useSession();
	const router = useRouter();
	const [data, setData] = useState<LeagueData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (status === "loading") return;
		if (status === "unauthenticated") {
			router.push("/login");
			return;
		}

		fetch(`/api/leagues/${id}`)
			.then((r) => {
				if (!r.ok) throw new Error("Liga no encontrada");
				return r.json();
			})
			.then((d) => setData(d))
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, [id, status, router]);

	if (loading) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center">
				<div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="max-w-2xl mx-auto py-16 px-4 text-center">
				<span className="text-4xl">🔍</span>
				<p className="text-text-muted text-sm mt-3">
					{error || "Liga no encontrada"}
				</p>
				<Link
					href="/ligas"
					className="inline-block mt-4 text-accent hover:underline text-sm"
				>
					← Volver a mis ligas
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
			{/* Header */}
			<div className="relative mb-6">
				<div className="absolute -inset-2 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 rounded-2xl blur-xl pointer-events-none" />
				<div className="relative">
					<Link
						href="/ligas"
						className="text-xs text-text-muted hover:text-accent transition-colors inline-flex items-center gap-1 mb-3"
					>
						← Mis ligas
					</Link>
					<div className="flex items-start justify-between gap-4">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
								{data.name}
							</h1>
							<div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
								<span>
									👥 {data.memberCount} miembro
									{data.memberCount !== 1 ? "s" : ""}
								</span>
								<span>👑 {data.createdBy}</span>
								{data.currentUserRank && (
									<span className="text-accent font-semibold">
										#{data.currentUserRank} en la liga
									</span>
								)}
							</div>
						</div>
						<div className="bg-bg-secondary border border-border/50 rounded-lg px-3 py-2 text-center shrink-0">
							<div className="text-[9px] text-text-muted uppercase tracking-wider">
								Código
							</div>
							<div className="text-sm font-mono font-bold text-accent tracking-[0.3em]">
								{data.code}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Ranking */}
			<div className="bg-transparent border border-border/5 rounded-xl overflow-hidden">
				<div className="grid grid-cols-[36px_1fr_56px] sm:grid-cols-[48px_1fr_64px_56px_56px] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-tertiary/5 border-b border-border/10">
					<span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
						#
					</span>
					<span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
						Jugador
					</span>
					<span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">
						Pts
					</span>
					<span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">
						Aciertos
					</span>
					<span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">
						Exactos
					</span>
				</div>

				{data.ranking.length === 0 ? (
					<div className="text-center py-12 text-text-muted text-sm">
						Sin participantes todavía
					</div>
				) : (
					data.ranking.map((entry, i) => {
						const isMe =
							entry.userId ===
							data.ranking.find((r) => r.role === "OWNER")?.userId;
						const rowBg =
							i < 3
								? [
										"bg-gradient-to-r from-gold/5 to-transparent border-l-2 border-l-gold/40",
										"bg-gradient-to-r from-silver/5 to-transparent border-l-2 border-l-silver/30",
										"bg-gradient-to-r from-bronze/5 to-transparent border-l-2 border-l-bronze/30",
									][i]
								: "";

						return (
							<div
								key={entry.userId}
								className={`grid grid-cols-[36px_1fr_56px] sm:grid-cols-[48px_1fr_64px_56px_56px] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3
                  border-b border-border/5 last:border-0 hover:bg-bg-tertiary/5 transition-colors ${rowBg}`}
							>
								<span
									className={`font-bold text-xs sm:text-sm tabular-nums self-center ${
										i === 0
											? "text-gold"
											: i === 1
												? "text-silver"
												: i === 2
													? "text-bronze"
													: "text-text-secondary"
									}`}
								>
									{i + 1}
								</span>
								<span className="font-medium text-xs sm:text-sm truncate self-center flex items-center gap-1.5">
									{entry.name}
									{entry.role === "OWNER" && (
										<span className="text-[10px] text-gold" title="Dueño">
											👑
										</span>
									)}
								</span>
								<span className="text-right font-bold text-xs sm:text-sm tabular-nums self-center">
									{entry.points}
								</span>
								<span className="hidden sm:block text-right text-xs text-text-muted tabular-nums self-center">
									{entry.correctResults}
								</span>
								<span className="hidden sm:block text-right text-xs text-accent tabular-nums self-center">
									{entry.exactScores}
								</span>
							</div>
						);
					})
				)}
			</div>

			{/* Legend */}
			<div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-text-muted">
				<span>✅ Acierto: 2pts</span>
				<span>🎯 Exacto: +1pt</span>
			</div>
		</div>
	);
}
