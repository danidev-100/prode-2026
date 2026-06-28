/**
 * Sincroniza resultados de la API FIFA con la base de datos.
 * Cuando un partido termina en la API, actualiza la DB y recalcula puntos.
 */

import { prisma } from "./prisma";
import { fetchAllMatches } from "./fifa-api";
import { calculatePoints } from "./scoring";
import { canResolveKnockout, resolveKnockoutBracket, resolveAnnexCFromDb } from "./knockout";

let lastSync = 0;
const SYNC_INTERVAL_MS = 30_000; // cada 30 segundos como mínimo

/**
 * Sincroniza resultados desde la API hacia la DB.
 * Solo corre si pasaron al menos SYNC_INTERVAL_MS desde la última vez.
 * Devuelve cuántos partidos se actualizaron.
 */
export async function syncResultsFromApi(): Promise<number> {
	const now = Date.now();
	if (now - lastSync < SYNC_INTERVAL_MS) return 0;
	lastSync = now;

	// Fetch DB matches con team names para poder mapear por nombre
	const dbMatches = await prisma.match.findMany({
		select: {
			id: true,
			matchNumber: true,
			homeTeam: true,
			awayTeam: true,
			homeGoals: true,
			awayGoals: true,
			status: true,
			stage: true,
			group: true,
		},
	});

	// Build group→teams lookup para validar consistencia de updates de la API
	const groupTeams = new Map<string, Set<string>>();
	for (const m of dbMatches) {
		if (!m.group || m.stage !== "GROUP") continue;
		if (!groupTeams.has(m.group)) groupTeams.set(m.group, new Set());
		const teams = groupTeams.get(m.group)!;
		if (m.homeTeam) teams.add(m.homeTeam);
		if (m.awayTeam) teams.add(m.awayTeam);
	}

	const apiMap = await fetchAllMatches(dbMatches);
	if (!apiMap) return 0;

	let updated = 0;

	for (const dbm of dbMatches) {
		const api = apiMap.get(dbm.matchNumber);
		if (!api) continue;

		// Solo procesar si la API dice que terminó
		if (!api.finished) continue;

		// Si ya está FINISHED en DB con los mismos scores, saltear
		if (
			dbm.status === "FINISHED" &&
			dbm.homeGoals === api.homeScore &&
			dbm.awayGoals === api.awayScore
		) {
			continue;
		}

		// Actualizar match en DB
		await prisma.match.update({
			where: { id: dbm.id },
			data: {
				homeGoals: api.homeScore,
				awayGoals: api.awayScore,
				status: "FINISHED",
			},
		});

		// Recalcular puntos para todos los pronósticos de este partido
		const predictions = await prisma.prediction.findMany({
			where: { matchId: dbm.id },
		});

		for (const pred of predictions) {
			const points = calculatePoints(
				pred.homeGoals,
				pred.awayGoals,
				api.homeScore ?? 0,
				api.awayScore ?? 0,
			);
			await prisma.prediction.update({
				where: { id: pred.id },
				data: { points },
			});
		}

		updated++;
	}

		// ── Paso 2: Actualizar/revertir nombres de equipos en knockout ──
		// La API es la fuente de verdad para el bracket.
		//
		// Reglas:
		//   1. Si la API tiene un equipo real (homeTeam/awayTeam) y es consistente
		//      con el grupo → actualizar DB.
		//   2. Si la API NO tiene equipo real pero SÍ tiene label, y la DB tiene
		//      un equipo distinto a la label → REVERTIR DB a la label (placeholder).
		//      Esto deshace asignaciones incorrectas del resolvedor local.
		//   3. Si la API tiene un equipo real pero NO es consistente con el grupo
		//      → rechazar update y revertir a label si la DB tiene otro equipo.
		const apiResolved = new Set<number>();
		for (const dbm of dbMatches) {
			const api = apiMap.get(dbm.matchNumber);
			if (!api) continue;

			// Track que este match existe en la API (aunque sea con placeholders)
			apiResolved.add(dbm.matchNumber);

			// Validar que el equipo resuelto por la API pertenezca al grupo correcto
			function validateTeamInGroup(
				teamName: string | null,
				label: string | null,
			): boolean {
				if (!teamName || !label) return true; // sin dato o sin label → no hay validación
				const groupLetter = label.match(/^(?:Winner|Runner-up) Group ([A-L])$/)?.[1];
				if (!groupLetter) return true; // tercera posición o label no parseable → skip validación
				const teams = groupTeams.get(groupLetter);
				return teams?.has(teamName) ?? false;
			}

			const homeValid =
				!api.homeTeam || validateTeamInGroup(api.homeTeam, api.homeLabel);
			const awayValid =
				!api.awayTeam || validateTeamInGroup(api.awayTeam, api.awayLabel);

			const updates: Record<string, string | null> = {};

			// Regla 1: API tiene equipo real y válido → actualizar
			if (api.homeTeam && homeValid && api.homeTeam !== dbm.homeTeam) {
				updates.homeTeam = api.homeTeam;
			}
			if (api.awayTeam && awayValid && api.awayTeam !== dbm.awayTeam) {
				updates.awayTeam = api.awayTeam;
			}

			// Regla 2: API no tiene equipo real pero tiene label → revertir a label.
			// Solo para campos con label "3rd..." porque el resolvedor local asigna
			// INCORRECTAMENTE los terceros puestos (usa greedy, no Annex C).
			// Winner/Runner-up del resolvedor local son correctos (standings determinísticos).
			function isThirdLabel(label: string | null): boolean {
				return !!label && label.startsWith("3rd");
			}
			if (
				!api.homeTeam &&
				isThirdLabel(api.homeLabel) &&
				dbm.homeTeam !== api.homeLabel
			) {
				updates.homeTeam = api.homeLabel;
			}
			if (
				!api.awayTeam &&
				isThirdLabel(api.awayLabel) &&
				dbm.awayTeam !== api.awayLabel
			) {
				updates.awayTeam = api.awayLabel;
			}

			// Regla 3: API tiene equipo real pero inválido → revertir a label si DB difiere
			if (api.homeTeam && !homeValid && api.homeLabel && dbm.homeTeam !== api.homeLabel) {
				updates.homeTeam = api.homeLabel;
			}
			if (api.awayTeam && !awayValid && api.awayLabel && dbm.awayTeam !== api.awayLabel) {
				updates.awayTeam = api.awayLabel;
			}

			if (Object.keys(updates).length === 0) continue;

			await prisma.match.update({
				where: { id: dbm.id },
				data: updates,
			});

			updated++;
		}

		// ── Paso 3: Aplicar bracket correcto desde Annex C ──
		// Para matches donde la API no resolvió el tercer puesto, usamos la
		// tabla de combinaciones de FIFA (Annex C) que tiene los 495 escenarios
		// posibles de clasificación de terceros.
		const annexCAssignments = await resolveAnnexCFromDb();
		if (annexCAssignments.size > 0) {
			for (const [mn, teamName] of annexCAssignments) {
				const dbm = dbMatches.find((m) => m.matchNumber === mn);
				if (!dbm) continue;

				// Solo actualizar si el match todavía tiene placeholder en el awayTeam
				// (el equipo real de la API ya se aplicó en paso 2)
				if (
					dbm.awayTeam &&
					!dbm.awayTeam.startsWith("Winner") &&
					!dbm.awayTeam.startsWith("Runner-up") &&
					!dbm.awayTeam.startsWith("3rd") &&
					!dbm.awayTeam.startsWith("Loser")
				) {
					continue; // ya tiene equipo real, no tocar
				}

				if (dbm.awayTeam === teamName) continue; // ya está actualizado

				await prisma.match.update({
					where: { id: dbm.id },
					data: { awayTeam: teamName },
				});
				updated++;
			}
		}

		// ── Paso 4: Fallback a resolución local de brackets ──
		// Solo para matches que la API NO cubre (no están en apiMap).
		const { ready } = await canResolveKnockout();
		if (ready) {
			const knockoutMatches = await prisma.match.findMany({
				where: {
					stage: { in: ["R32", "R16", "QUARTER", "SEMI", "THIRD_PLACE", "FINAL"] },
					matchNumber: { notIn: [...apiResolved] },
				},
			});

			if (knockoutMatches.length > 0) {
				const localResult = await resolveKnockoutBracket();
				updated += localResult.knockoutMatchesUpdated;
			}
		}

		if (updated > 0) {
			console.log(
				`[fifa-sync] ${updated} partido(s) actualizado(s) con puntos recalculados`,
			);
		}

		return updated;
}
