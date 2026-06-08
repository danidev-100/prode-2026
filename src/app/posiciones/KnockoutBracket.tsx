"use client";

import type { SerializedMatch } from "./types";

/* ─── Flag helper ─── */
function flag(name: string): string {
	const m: Record<string, string> = {
		Mexico: "mx",
		"South Africa": "za",
		"South Korea": "kr",
		"Czech Republic": "cz",
		Canada: "ca",
		"Bosnia and Herzegovina": "ba",
		"United States": "us",
		Paraguay: "py",
		Haiti: "ht",
		Scotland: "gb-sct",
		Australia: "au",
		Turkey: "tr",
		Brazil: "br",
		Morocco: "ma",
		Qatar: "qa",
		Switzerland: "ch",
		"Ivory Coast": "ci",
		Ecuador: "ec",
		Germany: "de",
		Curaçao: "cw",
		Netherlands: "nl",
		Japan: "jp",
		Sweden: "se",
		Tunisia: "tn",
		Iran: "ir",
		"New Zealand": "nz",
		Spain: "es",
		"Cape Verde": "cv",
		Belgium: "be",
		Egypt: "eg",
		"Saudi Arabia": "sa",
		Uruguay: "uy",
		France: "fr",
		Senegal: "sn",
		Iraq: "iq",
		Norway: "no",
		Argentina: "ar",
		Algeria: "dz",
		Austria: "at",
		Jordan: "jo",
		Portugal: "pt",
		"Democratic Republic of the Congo": "cd",
		England: "gb-eng",
		Croatia: "hr",
		Uzbekistan: "uz",
		Colombia: "co",
		Ghana: "gh",
		Panama: "pa",
	};
	return m[name] || "";
}

/* ─── Traduce etiquetas de la API al español ─── */
function es(label: string): string {
	return label
		.replace(/^Winner Group /, "Ganador Grupo ")
		.replace(/^Runner-up Group /, "Segundo Grupo ")
		.replace(/^3rd Group /, "3° Grupo ")
		.replace(/^Winner Match /, "Ganador Partido ")
		.replace(/^Loser Match /, "Perdedor Partido ");
}

/* ─── Svg icon for rank (position badge) ─── */
function PosBadge({ n }: { n: number }) {
	const colors = ["text-accent", "text-accent/70", "text-text-muted/50"];
	const col = colors[n] || colors[2];
	return (
		<span
			className={`font-bold text-[11px] tabular-nums w-4 text-center shrink-0 ${col}`}
		>
			{n + 1}
		</span>
	);
}

/* ─── Team info row ─── */
function TeamRow({
	name,
	score,
	winner,
	index,
}: {
	name: string;
	score: number | null;
	winner: boolean;
	index: number;
}) {
	return (
		<div
			className={`flex items-center gap-2 min-w-0 px-4 py-2.5 ${
				winner
					? "bg-accent/5 border-l-2 border-l-accent"
					: "border-l-2 border-l-transparent"
			}`}
		>
			<PosBadge n={index} />
			<div className="w-4 h-3 rounded-[2px] bg-bg-tertiary overflow-hidden ring-1 ring-white/5 shrink-0">
				{flag(name) && (
					<img
						src={`https://flagcdn.com/w20/${flag(name)}.png`}
						alt=""
						className="w-full h-full object-cover"
						onError={(e) => {
							(e.target as HTMLImageElement).style.display = "none";
						}}
					/>
				)}
			</div>
			<span
				className={`text-xs sm:text-sm truncate min-w-0 flex-1 ${
					winner ? "text-accent font-bold" : "text-text-primary font-medium"
				}`}
			>
				{name}
			</span>
			<span
				className={`tabular-nums font-bold text-xs sm:text-sm w-5 text-center shrink-0 ${
					winner ? "text-accent" : "text-text-muted"
				}`}
			>
				{score !== null ? score : "—"}
			</span>
		</div>
	);
}

/* ─── Match card (like a group table) ─── */
function MatchCard({ m }: { m: SerializedMatch }) {
	const homeName = m.homeTeam
		? es(m.homeTeam)
		: m.homeLabel
			? es(m.homeLabel)
			: "—";
	const awayName = m.awayTeam
		? es(m.awayTeam)
		: m.awayLabel
			? es(m.awayLabel)
			: "—";
	const homeWon =
		m.status === "FINISHED" && (m.homeGoals ?? 0) > (m.awayGoals ?? 0);
	const awayWon =
		m.status === "FINISHED" && (m.awayGoals ?? 0) > (m.homeGoals ?? 0);

	return (
		<div className="bg-transparent border border-border/5 rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/30">
			{/* Match header */}
			<div className="px-4 py-2 bg-bg-tertiary/10 border-b border-border/20 flex items-center justify-between">
				<span className="text-[10px] font-semibold text-text-muted">
					#{m.matchNumber}
				</span>
				<span className="text-[10px] font-semibold text-text-muted">
					{m.stage === "R32"
						? "🌊"
						: m.stage === "R16"
							? "🛡️"
							: m.stage === "QUARTER"
								? "🏰"
								: m.stage === "SEMI"
									? "🔥"
									: m.stage === "FINAL"
										? "🏆"
										: "🥉"}
				</span>
			</div>

			{/* Teams */}
			<div className="divide-y divide-border/30">
				<TeamRow
					name={homeName}
					score={m.homeGoals}
					winner={homeWon}
					index={0}
				/>
				<TeamRow
					name={awayName}
					score={m.awayGoals}
					winner={awayWon}
					index={1}
				/>
			</div>
		</div>
	);
}

/* ─── Round section card ─── */
function RoundSection({
	label,
	icon,
	matches,
}: {
	label: string;
	icon: string;
	matches: SerializedMatch[];
}) {
	if (matches.length === 0) return null;

	return (
		<div className="bg-transparent border border-border/5 rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/20">
			{/* Round header */}
			<div className="px-4 py-3 bg-bg-tertiary/10 border-b border-border/20 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-base">{icon}</span>
					<h3 className="font-bold text-sm sm:text-base text-text-primary tracking-wide">
						{label}
					</h3>
				</div>
				<span className="text-[10px] sm:text-xs text-text-muted tabular-nums">
					{matches.length} partidos
				</span>
			</div>

			{/* Matches grid */}
			<div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
				{matches.map((m) => (
					<MatchCard key={m.id} m={m} />
				))}
			</div>
		</div>
	);
}

/* ─── Final card (special, highlighted) ─── */
function FinalSection({ match }: { match: SerializedMatch | undefined }) {
	if (!match) return null;
	const homeName = match.homeTeam
		? es(match.homeTeam)
		: match.homeLabel
			? es(match.homeLabel)
			: "—";
	const awayName = match.awayTeam
		? es(match.awayTeam)
		: match.awayLabel
			? es(match.awayLabel)
			: "—";
	const homeWon =
		match.status === "FINISHED" &&
		(match.homeGoals ?? 0) > (match.awayGoals ?? 0);
	const awayWon =
		match.status === "FINISHED" &&
		(match.awayGoals ?? 0) > (match.homeGoals ?? 0);

	return (
		<div className="bg-gradient-to-br from-accent/[0.04] via-gold/[0.02] to-accent/[0.03] border border-accent/20 rounded-xl overflow-hidden shadow-sm shadow-accent/5">
			{/* Header */}
			<div className="px-4 py-3 bg-accent/[0.04] border-b border-accent/15 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-xl drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]">
						🏆
					</span>
					<h3 className="font-bold text-sm sm:text-base text-accent tracking-wide">
						Gran Final
					</h3>
				</div>
				<span className="text-[10px] text-text-muted">
					#104 · 19 jul · MetLife Stadium
				</span>
			</div>

			{/* Teams */}
			<div className="divide-y divide-border/20">
				<div
					className={`flex items-center gap-2 min-w-0 px-4 py-3 ${homeWon ? "bg-accent/5 border-l-2 border-l-accent" : "border-l-2 border-l-transparent"}`}
				>
					<span className="font-bold text-[11px] tabular-nums w-4 text-center shrink-0 text-accent">
						🏆
					</span>
					<div className="w-5 h-4 rounded-[2px] bg-bg-tertiary overflow-hidden ring-1 ring-white/5 shrink-0">
						{flag(homeName) && (
							<img
								src={`https://flagcdn.com/w20/${flag(homeName)}.png`}
								alt=""
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = "none";
								}}
							/>
						)}
					</div>
					<span
						className={`text-sm font-bold truncate flex-1 ${homeWon ? "text-accent" : "text-text-primary"}`}
					>
						{homeName}
					</span>
					<span
						className={`tabular-nums font-bold text-sm w-5 text-center shrink-0 ${homeWon ? "text-accent" : "text-text-muted"}`}
					>
						{match.homeGoals !== null ? match.homeGoals : "—"}
					</span>
				</div>
				<div
					className={`flex items-center gap-2 min-w-0 px-4 py-3 ${awayWon ? "bg-accent/5 border-l-2 border-l-accent" : "border-l-2 border-l-transparent"}`}
				>
					<span className="font-bold text-[11px] tabular-nums w-4 text-center shrink-0 text-text-muted/50">
						🥈
					</span>
					<div className="w-5 h-4 rounded-[2px] bg-bg-tertiary overflow-hidden ring-1 ring-white/5 shrink-0">
						{flag(awayName) && (
							<img
								src={`https://flagcdn.com/w20/${flag(awayName)}.png`}
								alt=""
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = "none";
								}}
							/>
						)}
					</div>
					<span
						className={`text-sm font-bold truncate flex-1 ${awayWon ? "text-accent" : "text-text-primary"}`}
					>
						{awayName}
					</span>
					<span
						className={`tabular-nums font-bold text-sm w-5 text-center shrink-0 ${awayWon ? "text-accent" : "text-text-muted"}`}
					>
						{match.awayGoals !== null ? match.awayGoals : "—"}
					</span>
				</div>
			</div>
		</div>
	);
}

/* ─── Third place card ─── */
function ThirdSection({ match }: { match: SerializedMatch | undefined }) {
	if (!match) return null;
	const homeName = match.homeTeam
		? es(match.homeTeam)
		: match.homeLabel
			? es(match.homeLabel)
			: "—";
	const awayName = match.awayTeam
		? es(match.awayTeam)
		: match.awayLabel
			? es(match.awayLabel)
			: "—";
	const homeWon =
		match.status === "FINISHED" &&
		(match.homeGoals ?? 0) > (match.awayGoals ?? 0);
	const awayWon =
		match.status === "FINISHED" &&
		(match.awayGoals ?? 0) > (match.homeGoals ?? 0);

	return (
		<div className="bg-gradient-to-br from-bronze/[0.04] to-transparent border border-bronze/15 rounded-xl overflow-hidden">
			<div className="px-4 py-2.5 bg-bronze/[0.04] border-b border-bronze/10 flex items-center gap-2">
				<span className="text-base">🥉</span>
				<h3 className="font-bold text-xs sm:text-sm text-text-primary">
					Tercer puesto
				</h3>
			</div>
			<div className="divide-y divide-border/20">
				<div
					className={`flex items-center gap-2 min-w-0 px-4 py-2.5 ${homeWon ? "bg-accent/5" : ""}`}
				>
					<div className="w-4 h-3 rounded-[2px] bg-bg-tertiary overflow-hidden ring-1 ring-white/5 shrink-0">
						{flag(homeName) && (
							<img
								src={`https://flagcdn.com/w20/${flag(homeName)}.png`}
								alt=""
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = "none";
								}}
							/>
						)}
					</div>
					<span
						className={`text-xs truncate flex-1 ${homeWon ? "text-accent font-bold" : "text-text-primary"}`}
					>
						{homeName}
					</span>
					<span
						className={`tabular-nums font-bold text-xs w-5 text-center ${homeWon ? "text-accent" : "text-text-muted"}`}
					>
						{match.homeGoals !== null ? match.homeGoals : "—"}
					</span>
				</div>
				<div
					className={`flex items-center gap-2 min-w-0 px-4 py-2.5 ${awayWon ? "bg-accent/5" : ""}`}
				>
					<div className="w-4 h-3 rounded-[2px] bg-bg-tertiary overflow-hidden ring-1 ring-white/5 shrink-0">
						{flag(awayName) && (
							<img
								src={`https://flagcdn.com/w20/${flag(awayName)}.png`}
								alt=""
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = "none";
								}}
							/>
						)}
					</div>
					<span
						className={`text-xs truncate flex-1 ${awayWon ? "text-accent font-bold" : "text-text-primary"}`}
					>
						{awayName}
					</span>
					<span
						className={`tabular-nums font-bold text-xs w-5 text-center ${awayWon ? "text-accent" : "text-text-muted"}`}
					>
						{match.awayGoals !== null ? match.awayGoals : "—"}
					</span>
				</div>
			</div>
		</div>
	);
}

/* ─── Main ─── */
const ROUNDS = [
	{ stage: "R32", label: "16avos de final", icon: "🌊" },
	{ stage: "R16", label: "Octavos de final", icon: "🛡️" },
	{ stage: "QUARTER", label: "Cuartos de final", icon: "🏰" },
	{ stage: "SEMI", label: "Semifinales", icon: "🔥" },
] as const;

export default function KnockoutBracket({
	matches,
}: {
	matches: SerializedMatch[];
}) {
	if (matches.length === 0) return null;

	const finalMatch = matches.find((m) => m.stage === "FINAL");
	const thirdMatch = matches.find((m) => m.stage === "THIRD_PLACE");

	return (
		<div className="mt-10 sm:mt-14">
			{/* Separator */}
			<div className="flex items-center gap-3 mb-6 sm:mb-8">
				<div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
				<span className="text-accent text-lg sm:text-xl" aria-hidden>
					🏆
				</span>
				<div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
			</div>

			{/* Header */}
			<div className="relative mb-6 sm:mb-8">
				<div className="absolute -inset-2 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 rounded-2xl blur-xl pointer-events-none" />
				<div className="relative">
					<span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
						🗺️ Fase eliminatoria
					</span>
					<h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
						Llaves del <span className="text-accent">Mundial 2026</span>
					</h2>
					<p className="text-text-muted text-xs sm:text-sm mt-1">
						32 selecciones · eliminación directa · 28 jun – 19 jul
					</p>
				</div>
			</div>

			{/* Rounds grid */}
			<div className="flex flex-col gap-4 sm:gap-6">
				{ROUNDS.map((round) => (
					<RoundSection
						key={round.stage}
						label={round.label}
						icon={round.icon}
						matches={matches.filter((m) => m.stage === round.stage)}
					/>
				))}

				{/* Final */}
				<FinalSection match={finalMatch} />

				{/* Third place */}
				<ThirdSection match={thirdMatch} />
			</div>
		</div>
	);
}
