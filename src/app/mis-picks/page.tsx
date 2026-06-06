import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";
import MyPicksClient from "./MyPicksClient";

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
	prediction: {
		homeGoals: number;
		awayGoals: number;
		points: number | null;
	} | null;
	resultType: "exacto" | "acertado" | "errado" | "pendiente" | "sin-pronostico";
}

export const dynamic = "force-dynamic";

export default async function MisPicksPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const matches = await prisma.match.findMany({
		orderBy: { date: "asc" },
		include: {
			predictions: {
				where: { userId: session.user.id },
				select: { homeGoals: true, awayGoals: true, points: true },
			},
		},
	});

	const serialized = matches.map((m) => {
		const pred = m.predictions[0] || null;
		let resultType:
			| "exacto"
			| "acertado"
			| "errado"
			| "pendiente"
			| "sin-pronostico" = "sin-pronostico";

		if (pred) {
			if (
				m.status === "FINISHED" &&
				m.homeGoals !== null &&
				m.awayGoals !== null
			) {
				const pts =
					pred.points ??
					calculatePoints(
						pred.homeGoals,
						pred.awayGoals,
						m.homeGoals,
						m.awayGoals,
					);
				if (pts === 3) resultType = "exacto";
				else if (pts === 2) resultType = "acertado";
				else resultType = "errado";
			} else {
				resultType = "pendiente";
			}
		}

		return {
			id: m.id,
			matchNumber: m.matchNumber,
			homeTeam: m.homeTeam,
			awayTeam: m.awayTeam,
			homeGoals: m.homeGoals,
			awayGoals: m.awayGoals,
			date: m.date.toISOString(),
			venue: m.venue,
			stage: m.stage,
			group: m.group,
			status: m.status,
			prediction: pred,
			resultType,
		};
	});

	// Stats
	const withPrediction = serialized.filter((m) => m.prediction);
	const totalPreds = withPrediction.length;
	const finished = withPrediction.filter((m) => m.status === "FINISHED");
	const exactos = finished.filter((m) => m.resultType === "exacto").length;
	const acertados = finished.filter((m) => m.resultType === "acertado").length;
	const errados = finished.filter((m) => m.resultType === "errado").length;
	const pendientes = withPrediction.filter(
		(m) => m.status !== "FINISHED",
	).length;
	const totalPoints = finished.reduce((acc, m) => {
		const pts =
			m.prediction!.points ??
			calculatePoints(
				m.prediction!.homeGoals,
				m.prediction!.awayGoals,
				m.homeGoals!,
				m.awayGoals!,
			);
		return acc + pts;
	}, 0);

	const effectiveness =
		finished.length > 0
			? Math.round(((exactos + acertados) / finished.length) * 100)
			: 0;
	const avgPts =
		finished.length > 0 ? (totalPoints / finished.length).toFixed(1) : "0.0";

	const groupFinished = finished.filter((m) => m.stage === "GROUP");
	const knockoutFinished = finished.filter((m) => m.stage !== "GROUP");
	const groupPts = groupFinished.reduce((acc, m) => {
		const pts =
			m.prediction!.points ??
			calculatePoints(
				m.prediction!.homeGoals,
				m.prediction!.awayGoals,
				m.homeGoals!,
				m.awayGoals!,
			);
		return acc + pts;
	}, 0);
	const knockoutPts = knockoutFinished.reduce((acc, m) => {
		const pts =
			m.prediction!.points ??
			calculatePoints(
				m.prediction!.homeGoals,
				m.prediction!.awayGoals,
				m.homeGoals!,
				m.awayGoals!,
			);
		return acc + pts;
	}, 0);

	return (
		<>
			{/* Enzo background — right side, fixed, 22% opacity, faded */}
			<div
				className="fixed top-0 left-0 pointer-events-none z-0"
				style={{
					width: "100vw",
					height: "100dvh",
					backgroundImage: "url('/cuti.jpg')",
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
				{/* Header */}
				<div className="relative mb-6 sm:mb-8">
					<div className="absolute -inset-2 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 rounded-2xl blur-xl pointer-events-none" />
					<div className="relative">
						<span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
							📋 Mis pronósticos
						</span>
						<h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
							Tus <span className="text-accent">predicciones</span>
						</h1>
						<p className="text-text-muted text-sm mt-1">
							{totalPreds} de 104 partidos pronosticados
						</p>
					</div>
				</div>

				{/* Stats cards */}
				<div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
					<StatCard label="Puntos" value={totalPoints} color="gold" />
					<StatCard label="Pronosticados" value={totalPreds} color="default" />
					<StatCard label="Exactos" value={exactos} color="accent" />
					<StatCard label="Acertados" value={acertados} color="accent" />
					<StatCard label="Errados" value={errados} color="danger" />
				</div>

				{/* Extended stats */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
					<div className="bg-bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-center">
						<div className="text-xs text-text-secondary">Efectividad</div>
						<div
							className={`text-lg font-bold tabular-nums ${effectiveness >= 60 ? "text-accent" : effectiveness >= 40 ? "text-gold" : "text-danger"}`}
						>
							{effectiveness}%
						</div>
						<div className="text-[10px] text-text-muted">
							{exactos + acertados}/{finished.length} aciertos
						</div>
					</div>
					<div className="bg-bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-center">
						<div className="text-xs text-text-secondary">Promedio</div>
						<div className="text-lg font-bold tabular-nums text-text-primary">
							{avgPts}
						</div>
						<div className="text-[10px] text-text-muted">pts por partido</div>
					</div>
					<div className="bg-bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-center">
						<div className="text-xs text-text-secondary">Grupos</div>
						<div className="text-lg font-bold tabular-nums text-accent">
							{groupPts}
						</div>
						<div className="text-[10px] text-text-muted">
							{groupFinished.length} partidos
						</div>
					</div>
					<div className="bg-bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-center">
						<div className="text-xs text-text-secondary">Eliminatorias</div>
						<div className="text-lg font-bold tabular-nums text-gold">
							{knockoutPts}
						</div>
						<div className="text-[10px] text-text-muted">
							{knockoutFinished.length} partidos
						</div>
					</div>
				</div>

				{/* Pending-only row */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3 text-xs text-text-muted">
						{pendientes > 0 && (
							<span className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
								{pendientes} pendiente{pendientes !== 1 ? "s" : ""}
							</span>
						)}
						<span>🎯 Exacto: 3pts</span>
						<span>✅ Acierto: 2pts</span>
					</div>
				</div>

				<MyPicksClient matches={serialized as SerializedMatch[]} />
			</div>
		</>
	);
}

function StatCard({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color: "gold" | "accent" | "danger" | "default";
}) {
	const colors: Record<string, string> = {
		gold: "bg-gold/10 border-gold/20 text-gold",
		accent: "bg-accent/10 border-accent/20 text-accent",
		danger: "bg-red-900/20 border-red-800/30 text-danger",
		default: "bg-bg-secondary border-border/50 text-text-primary",
	};

	return (
		<div
			className={`rounded-xl border p-2.5 sm:p-3 text-center ${colors[color]}`}
		>
			<div className="text-lg sm:text-2xl font-bold tabular-nums">{value}</div>
			<div className="text-[10px] sm:text-[11px] opacity-80 mt-0.5 uppercase tracking-wider">
				{label}
			</div>
		</div>
	);
}
