"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getFlagUrl, QUALIFIED_TEAMS } from "@/lib/flags";

interface BracketResult {
	groupsProcessed: number;
	knockoutMatchesUpdated: number;
	thirdPlaceAssigned: number;
	errors: string[];
}

interface Match {
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
}

interface EditState {
	homeGoals: string;
	awayGoals: string;
	homeTeam: string;
	awayTeam: string;
	status: string;
}

const STAGES: { key: string; label: string }[] = [
	{ key: "all", label: "Todos" },
	{ key: "GROUP", label: "Grupos" },
	{ key: "R32", label: "16avos" },
	{ key: "R16", label: "8avos" },
	{ key: "QUARTER", label: "Cuartos" },
	{ key: "SEMI", label: "Semis" },
	{ key: "THIRD_PLACE", label: "3er Puesto" },
	{ key: "FINAL", label: "Final" },
];

export default function AdminPanel() {
	const { status } = useSession();
	const router = useRouter();
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("all");
	const [editing, setEditing] = useState<string | null>(null);
	const [editState, setEditState] = useState<EditState>({
		homeGoals: "",
		awayGoals: "",
		homeTeam: "",
		awayTeam: "",
		status: "FINISHED",
	});
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{
		text: string;
		type: "success" | "error";
	} | null>(null);
	const [resolvingBracket, setResolvingBracket] = useState(false);
	const [bracketResult, setBracketResult] = useState<BracketResult | null>(
		null,
	);

	useEffect(() => {
		if (status === "loading") return;
		if (status === "unauthenticated") {
			router.push("/login");
			return;
		}
		fetch("/api/matches")
			.then((r) => r.json())
			.then((data) => setMatches(data))
			.finally(() => setLoading(false));
	}, [status, router]);

	const filtered =
		filter === "all" ? matches : matches.filter((m) => m.stage === filter);

	// Group by date
	const grouped = (() => {
		const map = new Map<string, Match[]>();
		for (const m of filtered) {
			const d = new Date(m.date);
			const key = d.toLocaleDateString("es-AR", {
				weekday: "long",
				day: "numeric",
				month: "long",
			});
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(m);
		}
		return Array.from(map.entries());
	})();

	function startEdit(match: Match) {
		setEditing(match.id);
		setEditState({
			homeGoals: match.homeGoals?.toString() ?? "",
			awayGoals: match.awayGoals?.toString() ?? "",
			homeTeam: match.homeTeam ?? "",
			awayTeam: match.awayTeam ?? "",
			status: match.status,
		});
		setMessage(null);
	}

	function cancelEdit() {
		setEditing(null);
	}

	async function saveResult(matchId: string) {
		const h = editState.homeGoals === "" ? null : parseInt(editState.homeGoals);
		const a = editState.awayGoals === "" ? null : parseInt(editState.awayGoals);

		if (h !== null && (isNaN(h) || h < 0)) return;
		if (a !== null && (isNaN(a) || a < 0)) return;

		setSaving(true);
		setMessage(null);

		const res = await fetch("/api/matches/result", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				matchId,
				homeGoals: h,
				awayGoals: a,
				status: editState.status,
				homeTeam: editState.homeTeam || null,
				awayTeam: editState.awayTeam || null,
			}),
		});

		setSaving(false);

		if (!res.ok) {
			const data = await res.json();
			setMessage({ text: data.error || "Error al guardar", type: "error" });
			return;
		}

		const updated = await res.json();
		setMatches((prev) =>
			prev.map((m) => (m.id === matchId ? { ...m, ...updated } : m)),
		);
		setEditing(null);
		setMessage({ text: "✅ Resultado guardado", type: "success" });
	}

	async function handleResolveBracket() {
		setResolvingBracket(true);
		setBracketResult(null);
		setMessage(null);

		try {
			const res = await fetch("/api/matches/resolve-knockout", {
				method: "POST",
			});
			const data = await res.json();

			if (!res.ok) {
				setMessage({
					text: data.error || "Error al resolver bracket",
					type: "error",
				});
				if (data.errors?.length) setBracketResult(data);
				return;
			}

			setBracketResult(data);
			setMessage({
				text: `✅ Bracket resuelto: ${data.groupsProcessed} grupos, ${data.knockoutMatchesUpdated} partidos actualizados, ${data.thirdPlaceAssigned} terceros asignados`,
				type: "success",
			});

			// Refresh matches list
			const matchesRes = await fetch("/api/matches");
			const freshMatches = await matchesRes.json();
			setMatches(freshMatches);
		} catch {
			setMessage({
				text: "Error de conexión al resolver bracket",
				type: "error",
			});
		} finally {
			setResolvingBracket(false);
		}
	}

	const pendingCount = matches.filter((m) => m.status !== "FINISHED").length;
	const finishedCount = matches.filter((m) => m.status === "FINISHED").length;

	if (loading) {
		return (
			<div className="min-h-screen bg-bg-primary flex items-center justify-center">
				<div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-bg-primary px-4 py-6 sm:px-6 max-w-3xl mx-auto">
			{/* Header */}
			<div className="relative mb-6">
				<div className="absolute -inset-2 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 rounded-2xl blur-xl pointer-events-none" />
				<div className="relative">
					<div className="flex items-center justify-between">
						<div>
							<span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest mb-2">
								⚙️ Administración
							</span>
							<p className="text-sm text-text-muted mt-0.5">
								{finishedCount} finalizados · {pendingCount} pendientes
							</p>
							<div className="flex flex-wrap gap-2 mt-3">
								<button
									onClick={handleResolveBracket}
									disabled={resolvingBracket}
									className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold px-3 py-1.5 rounded-lg
                    hover:bg-gold/20 hover:border-gold/30 transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
								>
									{resolvingBracket ? (
										<>
											<span className="animate-spin w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full" />
											Resolviendo…
										</>
									) : (
										<>
											<svg
												className="w-3.5 h-3.5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
												/>
											</svg>
											🔗 Resolver bracket
										</>
									)}
								</button>
							</div>
						</div>
						<Link
							href="/"
							className="text-xs text-text-muted hover:text-accent transition-colors"
						>
							← Volver al prode
						</Link>
					</div>
				</div>
			</div>

			{/* Message */}
			{message && (
				<div
					className={`mb-4 p-3 rounded-lg text-sm font-medium ${
						message.type === "success"
							? "bg-green-900/20 text-green-400 border border-green-800"
							: "bg-red-900/20 text-red-400 border border-red-800"
					}`}
				>
					{message.text}
				</div>
			)}

			{/* Bracket result detail */}
			{bracketResult && bracketResult.errors.length > 0 && (
				<div className="mb-4 p-3 rounded-lg bg-red-900/10 border border-red-800/30 text-sm">
					<p className="font-medium text-red-400 text-xs mb-1">
						⚠️ Errores durante la resolución:
					</p>
					<ul className="list-disc list-inside text-red-300/80 text-[11px] space-y-0.5">
						{bracketResult.errors.map((err: string, i: number) => (
							<li key={i}>{err}</li>
						))}
					</ul>
				</div>
			)}

			{/* Stage filter */}
			<div className="flex flex-wrap gap-1.5 mb-6">
				{STAGES.map((s) => (
					<button
						key={s.key}
						onClick={() => setFilter(s.key)}
						className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-200 ${
							filter === s.key
								? "bg-accent text-black shadow-sm shadow-accent/20"
								: "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent hover:border-border"
						}`}
					>
						{s.label}
					</button>
				))}
				<span className="text-[11px] text-text-muted self-center ml-auto">
					{filtered.length} partidos
				</span>
			</div>

			{/* Match list */}
			{grouped.length === 0 ? (
				<p className="text-center text-text-muted py-16">Sin partidos</p>
			) : (
				<div className="flex flex-col gap-8">
					{grouped.map(([dateLabel, dayMatches]) => (
						<div key={dateLabel}>
							<h2 className="text-sm font-semibold text-text-secondary mb-3 capitalize px-1 flex items-center gap-2">
								<span className="w-1 h-4 bg-accent rounded-full" />
								{dateLabel}
							</h2>
							<div className="flex flex-col gap-3">
								{dayMatches.map((match) => {
									const isEditing = editing === match.id;
									const displayHome =
										match.homeTeam || `Equipo ${match.group || ""}1`;
									const displayAway =
										match.awayTeam || `Equipo ${match.group || ""}2`;

									return (
										<div
											key={match.id}
											className={`bg-bg-secondary border rounded-xl p-3 sm:p-4 transition-all duration-200 ${
												isEditing
													? "border-accent shadow-sm shadow-accent/10"
													: "border-border hover:border-border-hover"
											}`}
										>
											{/* Header */}
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-bg-tertiary text-text-secondary">
														{match.stage === "GROUP"
															? `Grupo ${match.group}`
															: match.stage}
													</span>
													<span className="text-[10px] text-text-muted">
														#{match.matchNumber}
													</span>
												</div>
												<span
													className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
														match.status === "FINISHED"
															? "bg-green-900/30 text-green-400"
															: "bg-bg-tertiary text-text-muted"
													}`}
												>
													{match.status === "FINISHED"
														? "Finalizado"
														: "Pendiente"}
												</span>
											</div>

											{/* Team name inputs (knockout stages) */}
											{isEditing && match.stage !== "GROUP" && (
												<div className="flex items-center gap-3 mb-3">
													<div className="flex-1">
														<input
															type="text"
															value={editState.homeTeam}
															onChange={(e) =>
																setEditState((s) => ({
																	...s,
																	homeTeam: e.target.value,
																}))
															}
															list="teams-list"
															placeholder="Equipo local"
															className="w-full text-xs px-2 py-1.5 rounded-lg bg-bg-tertiary border border-accent/50
                                text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                                placeholder:text-text-muted/40"
														/>
													</div>
													<span className="text-text-muted text-xs font-light shrink-0">
														vs
													</span>
													<div className="flex-1">
														<input
															type="text"
															value={editState.awayTeam}
															onChange={(e) =>
																setEditState((s) => ({
																	...s,
																	awayTeam: e.target.value,
																}))
															}
															list="teams-list"
															placeholder="Equipo visitante"
															className="w-full text-xs px-2 py-1.5 rounded-lg bg-bg-tertiary border border-accent/50
                                text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                                placeholder:text-text-muted/40"
														/>
													</div>
												</div>
											)}

											{/* Teams + score */}
											<div className="flex items-center justify-between gap-3">
												{/* Home */}
												<div className="flex-1 text-right flex items-center justify-end gap-2 min-w-0">
													<span className="font-semibold text-sm truncate">
														{displayHome}
													</span>
													{getFlagUrl(match.homeTeam) && (
														<img
															src={getFlagUrl(match.homeTeam)!}
															alt={match.homeTeam ?? ""}
															className="w-6 h-4 rounded-[2px] object-cover flex-shrink-0"
														/>
													)}
												</div>

												{/* Score / Edit form */}
												{isEditing ? (
													<div className="flex items-center gap-2 shrink-0">
														<input
															type="number"
															min={0}
															max={99}
															value={editState.homeGoals}
															onChange={(e) =>
																setEditState((s) => ({
																	...s,
																	homeGoals: e.target.value,
																}))
															}
															className="w-12 h-9 text-center text-sm font-semibold bg-bg-tertiary border border-accent rounded-lg
                                text-text-primary tabular-nums outline-none focus:ring-1 focus:ring-accent/30"
															placeholder="-"
														/>
														<span className="text-text-muted text-sm font-light">
															—
														</span>
														<input
															type="number"
															min={0}
															max={99}
															value={editState.awayGoals}
															onChange={(e) =>
																setEditState((s) => ({
																	...s,
																	awayGoals: e.target.value,
																}))
															}
															className="w-12 h-9 text-center text-sm font-semibold bg-bg-tertiary border border-accent rounded-lg
                                text-text-primary tabular-nums outline-none focus:ring-1 focus:ring-accent/30"
															placeholder="-"
														/>
													</div>
												) : match.homeGoals !== null &&
													match.awayGoals !== null ? (
													<div className="flex items-center gap-2 shrink-0">
														<span className="text-xl font-bold tabular-nums text-text-primary">
															{match.homeGoals}
														</span>
														<span className="text-text-muted">—</span>
														<span className="text-xl font-bold tabular-nums text-text-primary">
															{match.awayGoals}
														</span>
													</div>
												) : (
													<span className="text-lg font-bold text-text-muted/20 shrink-0">
														VS
													</span>
												)}

												{/* Away */}
												<div className="flex-1 text-left flex items-center gap-2 min-w-0">
													{getFlagUrl(match.awayTeam) && (
														<img
															src={getFlagUrl(match.awayTeam)!}
															alt={match.awayTeam ?? ""}
															className="w-6 h-4 rounded-[2px] object-cover flex-shrink-0"
														/>
													)}
													<span className="font-semibold text-sm truncate">
														{displayAway}
													</span>
												</div>
											</div>

											{/* Edit mode: status toggle + actions */}
											{isEditing && (
												<div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
													<select
														value={editState.status}
														onChange={(e) =>
															setEditState((s) => ({
																...s,
																status: e.target.value,
															}))
														}
														className="text-xs px-2 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-primary outline-none"
													>
														<option value="SCHEDULED">SCHEDULED</option>
														<option value="FINISHED">FINISHED</option>
													</select>
													<div className="flex gap-2 ml-auto">
														<button
															onClick={cancelEdit}
															className="text-xs px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
														>
															Cancelar
														</button>
														<button
															onClick={() => saveResult(match.id)}
															disabled={saving}
															className="text-xs px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold
                                transition-all duration-200 disabled:opacity-50 active:scale-95"
														>
															{saving ? "Guardando..." : "Guardar"}
														</button>
													</div>
												</div>
											)}

											{/* Non-edit: edit button */}
											{!isEditing && (
												<div className="mt-2">
													<button
														onClick={() => startEdit(match)}
														className="text-[11px] text-text-muted hover:text-accent transition-colors"
													>
														{match.homeGoals !== null
															? "✏️ Editar resultado"
															: "📝 Cargar resultado"}
													</button>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Datalist for team autocomplete */}
			<datalist id="teams-list">
				{QUALIFIED_TEAMS.map((t) => (
					<option key={t} value={t} />
				))}
			</datalist>
		</div>
	);
}
