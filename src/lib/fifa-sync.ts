/**
 * Sincroniza resultados de la API FIFA con la base de datos.
 * Cuando un partido termina en la API, actualiza la DB y recalcula puntos.
 */

import { prisma } from "./prisma";
import { fetchAllMatches } from "./fifa-api";
import { calculatePoints } from "./scoring";
import { canResolveKnockout, resolveKnockoutBracket } from "./knockout";

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
		},
	});

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

		// ── Paso 2: Actualizar nombres de equipos en knockout ──
		// Cuando la API ya sabe qué equipos clasificaron (homeTeam/awayTeam reales),
		// sobrescribe los placeholders de la DB ("Winner Group A" → "Argentina")
		const apiResolved = new Set<number>();
		for (const dbm of dbMatches) {
			const api = apiMap.get(dbm.matchNumber);
			if (!api) continue;

			// Track que este match existe en la API (aunque sea con placeholders)
			apiResolved.add(dbm.matchNumber);

			const needsHomeUpdate =
				api.homeTeam && api.homeTeam !== dbm.homeTeam;
			const needsAwayUpdate =
				api.awayTeam && api.awayTeam !== dbm.awayTeam;

			if (!needsHomeUpdate && !needsAwayUpdate) continue;

			await prisma.match.update({
				where: { id: dbm.id },
				data: {
					...(needsHomeUpdate ? { homeTeam: api.homeTeam } : {}),
					...(needsAwayUpdate ? { awayTeam: api.awayTeam } : {}),
				},
			});

			updated++;
		}

		// ── Paso 3: Fallback a resolución local de brackets ──
		// Solo para matches que la API NO cubre (no están en apiMap).
		// La API tiene el bracket REAL con 495 combinaciones posibles.
		// Nuestra resolución local es Greedy y NO coincide con el bracket oficial,
		// así que NUNCA debe pisar lo que la API ya tiene (aunque sean placeholders).
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
