"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface League {
	id: string;
	name: string;
	code: string;
	memberCount: number;
	role: string;
	createdAt: string;
}

export default function LigasPage() {
	const { status } = useSession();
	const router = useRouter();
	const [leagues, setLeagues] = useState<League[]>([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<"list" | "create" | "join">("list");

	// Create form
	const [newName, setNewName] = useState("");
	const [creating, setCreating] = useState(false);

	// Join form
	const [joinCode, setJoinCode] = useState("");
	const [joining, setJoining] = useState(false);

	const [message, setMessage] = useState<{
		text: string;
		type: "success" | "error";
	} | null>(null);

	useEffect(() => {
		if (status === "loading") return;
		if (status === "unauthenticated") {
			router.push("/login");
			return;
		}
		fetchLeagues();
	}, [status, router]);

	async function fetchLeagues() {
		try {
			const res = await fetch("/api/leagues");
			if (res.ok) {
				const data = await res.json();
				setLeagues(data);
			}
		} catch {
			// silent
		} finally {
			setLoading(false);
		}
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		setMessage(null);
		setCreating(true);

		try {
			const res = await fetch("/api/leagues", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newName }),
			});

			const data = await res.json();

			if (!res.ok) {
				setMessage({ text: data.error || "Error al crear", type: "error" });
				return;
			}

			setLeagues((prev) => [data, ...prev]);
			setNewName("");
			setTab("list");
			setMessage({
				text: `✅ Liga "${data.name}" creada — Código: ${data.code}`,
				type: "success",
			});
		} catch {
			setMessage({ text: "Error de conexión", type: "error" });
		} finally {
			setCreating(false);
		}
	}

	async function handleJoin(e: React.FormEvent) {
		e.preventDefault();
		setMessage(null);
		setJoining(true);

		try {
			const res = await fetch("/api/leagues/join", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: joinCode }),
			});

			const data = await res.json();

			if (!res.ok) {
				setMessage({ text: data.error || "Error al unirse", type: "error" });
				return;
			}

			setJoinCode("");
			setTab("list");
			setMessage({
				text: data.message || "✅ Te uniste a la liga",
				type: "success",
			});
			await fetchLeagues();
		} catch {
			setMessage({ text: "Error de conexión", type: "error" });
		} finally {
			setJoining(false);
		}
	}

	if (loading) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center">
				<div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
			{/* Header */}
			<div className="relative mb-6 sm:mb-8">
				<div className="absolute -inset-2 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 rounded-2xl blur-xl pointer-events-none" />
				<div className="relative">
					<span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
						👥 Ligas privadas
					</span>
					<h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
						Tus <span className="text-accent">ligas</span>
					</h1>
					<p className="text-text-muted text-sm mt-1">
						Competí con amigos en grupos cerrados
					</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 mb-6">
				<button
					onClick={() => setTab("list")}
					className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
						tab === "list"
							? "bg-accent text-black"
							: "bg-bg-secondary text-text-secondary hover:text-text-primary border border-border"
					}`}
				>
					Mis ligas
				</button>
				<button
					onClick={() => setTab("create")}
					className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
						tab === "create"
							? "bg-accent text-black"
							: "bg-bg-secondary text-text-secondary hover:text-text-primary border border-border"
					}`}
				>
					+ Crear liga
				</button>
				<button
					onClick={() => setTab("join")}
					className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
						tab === "join"
							? "bg-accent text-black"
							: "bg-bg-secondary text-text-secondary hover:text-text-primary border border-border"
					}`}
				>
					🔗 Unirse por código
				</button>
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

			{/* Tab content */}
			{tab === "list" && (
				<div className="flex flex-col gap-3">
					{leagues.length === 0 ? (
						<div className="text-center py-12 border border-dashed border-border/50 rounded-xl">
							<span className="text-4xl">👥</span>
							<p className="text-text-muted text-sm mt-3">
								No estás en ninguna liga todavía
							</p>
							<p className="text-text-muted text-xs mt-1">
								Creá una o unite a una existente con un código
							</p>
						</div>
					) : (
						leagues.map((league) => (
							<Link
								key={league.id}
								href={`/ligas/${league.id}`}
								className="bg-transparent border border-border/10 rounded-xl p-4 hover:border-accent/30 transition-all duration-200 hover:bg-bg-tertiary/5"
							>
								<div className="flex items-center justify-between">
									<div className="min-w-0">
										<h3 className="font-semibold text-sm text-text-primary truncate">
											{league.name}
										</h3>
										<div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted">
											<span>
												👥 {league.memberCount} miembro
												{league.memberCount !== 1 ? "s" : ""}
											</span>
											<span>
												🔑{" "}
												<code className="text-accent/80 font-mono text-[10px]">
													{league.code}
												</code>
											</span>
											{league.role === "OWNER" && (
												<span className="text-gold">👑 Dueño</span>
											)}
										</div>
									</div>
									<svg
										className="w-4 h-4 text-text-muted shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</Link>
						))
					)}
				</div>
			)}

			{tab === "create" && (
				<form onSubmit={handleCreate} className="flex flex-col gap-4">
					<div>
						<label
							htmlFor="league-name"
							className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
						>
							Nombre de la liga
						</label>
						<input
							id="league-name"
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							required
							maxLength={50}
							placeholder="Ej: Amigos del prode"
							className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                text-text-primary placeholder:text-text-muted/40
                focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
						/>
						<p className="text-[11px] text-text-muted mt-1">
							Máximo 50 caracteres
						</p>
					</div>

					<button
						type="submit"
						disabled={creating}
						className="w-full h-11 bg-gradient-to-r from-accent to-accent-hover hover:from-accent-glow hover:to-accent text-black font-semibold text-sm rounded-lg
              transition-all duration-200 disabled:opacity-50 active:scale-[0.98] shadow-sm shadow-accent/20"
					>
						{creating ? "Creando..." : "Crear liga"}
					</button>
				</form>
			)}

			{tab === "join" && (
				<form onSubmit={handleJoin} className="flex flex-col gap-4">
					<div>
						<label
							htmlFor="join-code"
							className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
						>
							Código de invitación
						</label>
						<input
							id="join-code"
							type="text"
							value={joinCode}
							onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
							required
							minLength={6}
							maxLength={6}
							placeholder="Ej: ABC123"
							className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                text-text-primary placeholder:text-text-muted/40 text-center font-mono text-lg tracking-[0.5em]
                focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all uppercase"
						/>
						<p className="text-[11px] text-text-muted mt-1 text-center">
							Código de 6 caracteres
						</p>
					</div>

					<button
						type="submit"
						disabled={joining}
						className="w-full h-11 bg-gradient-to-r from-accent to-accent-hover hover:from-accent-glow hover:to-accent text-black font-semibold text-sm rounded-lg
              transition-all duration-200 disabled:opacity-50 active:scale-[0.98] shadow-sm shadow-accent/20"
					>
						{joining ? "Uniéndose..." : "Unirse a la liga"}
					</button>
				</form>
			)}
		</div>
	);
}
