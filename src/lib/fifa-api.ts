/**
 * FIFA World Cup 2026 API client
 *
 * Fuente: https://worldcup26.ir (open-source, gratis, sin key)
 * Endpoints:
 *   GET /get/games   → todos los partidos con resultados
 *   GET /get/teams   → selecciones
 *   GET /get/groups  → grupos y posiciones
 *   GET /get/stadiums → estadios
 */

const API_BASE = "https://worldcup26.ir";

export type ApiMatch = {
	id: string; // "1".."104" → matchNumber
	homeTeam: string;
	awayTeam: string;
	homeLabel: string | null; // label for placeholder teams (e.g. "Winner Group A")
	awayLabel: string | null;
	homeScore: number | null;
	awayScore: number | null;
	finished: boolean;
	group: string;
	stage: string;
	date: string; // ISO-like
};

type RawApiMatch = {
	id: string;
	home_team_name_en: string;
	away_team_name_en: string;
	home_team_label?: string;
	away_team_label?: string;
	home_score: string;
	away_score: string;
	finished: "TRUE" | "FALSE";
	group: string;
	type: string;
	local_date: string; // "MM/DD/YYYY HH:mm"
};

function mapStage(apiType: string): string {
	switch (apiType) {
		case "group":
			return "GROUP";
		case "r32":
			return "ROUND_OF_32";
		case "r16":
			return "ROUND_OF_16";
		case "qf":
			return "QUARTER_FINAL";
		case "sf":
			return "SEMI_FINAL";
		case "third":
			return "THIRD_PLACE";
		case "final":
			return "FINAL";
		default:
			return apiType.toUpperCase();
	}
}

function parseApiDate(dateStr: string): string {
	// "MM/DD/YYYY HH:mm" → ISO string
	const [datePart, timePart] = dateStr.split(" ");
	if (!datePart || !timePart) return dateStr;
	const [month, day, year] = datePart.split("/");
	return `${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}T${timePart}:00.000Z`;
}

function parseScore(val: string): number | null {
	const n = parseInt(val, 10);
	return isNaN(n) ? null : n;
}

function parseFinished(val: string): boolean {
	return val === "TRUE";
}

/**
 * Transforma un partido de la API al formato interno.
 */
function transformMatch(raw: RawApiMatch): ApiMatch {
	// Use labels when home/away team name is a placeholder ("0")
	const homeTeam =
		raw.home_team_name_en && raw.home_team_name_en !== "0"
			? raw.home_team_name_en
			: "";
	const awayTeam =
		raw.away_team_name_en && raw.away_team_name_en !== "0"
			? raw.away_team_name_en
			: "";

	return {
		id: raw.id,
		homeTeam,
		awayTeam,
		homeLabel: raw.home_team_label || null,
		awayLabel: raw.away_team_label || null,
		homeScore: parseScore(raw.home_score),
		awayScore: parseScore(raw.away_score),
		finished: parseFinished(raw.finished),
		group: raw.group,
		stage: mapStage(raw.type),
		date: parseApiDate(raw.local_date),
	};
}

/**
 * Fetch todos los partidos desde la API externa.
 * Devuelve los partidos normalizados, indexados por matchNumber.
 * En caso de error, devuelve null.
 */
export async function fetchAllMatches(): Promise<Map<number, ApiMatch> | null> {
	try {
		const res = await fetch(`${API_BASE}/get/games`, {
			next: { revalidate: 60 }, // cache 60s en producción
			signal: AbortSignal.timeout(8000), // timeout 8s
		});

		if (!res.ok) {
			console.warn(`[fifa-api] HTTP ${res.status} al fetchear partidos`);
			return null;
		}

		const body = await res.json();
		const rawList: RawApiMatch[] = body?.games ?? body ?? [];

		if (!Array.isArray(rawList) || rawList.length === 0) {
			console.warn("[fifa-api] respuesta vacía o inesperada");
			return null;
		}

		const map = new Map<number, ApiMatch>();
		for (const raw of rawList) {
			// Incluir partidos con equipos definidos O con labels (knockout placeholder)
			const hasTeam = raw.home_team_name_en && raw.away_team_name_en;
			const hasLabel = raw.home_team_label || raw.away_team_label;
			if (hasTeam || hasLabel) {
				const match = transformMatch(raw);
				const num = parseInt(match.id, 10);
				if (!isNaN(num)) {
					map.set(num, match);
				}
			}
		}

		console.log(`[fifa-api] ${map.size} partidos sincronizados`);
		return map;
	} catch (err) {
		console.warn("[fifa-api] error de conexión:", err);
		return null;
	}
}

/**
 * Dado un match de la DB y un mapa de la API, devuelve
 * los campos actualizados (homeGoals, awayGoals, status).
 * Si no hay dato en la API, devuelve los valores originales.
 */
export function mergeApiIntoDbMatch(
	dbMatch: {
		matchNumber: number;
		homeGoals: number | null;
		awayGoals: number | null;
		status: string;
	},
	apiMap: Map<number, ApiMatch> | null,
): { homeGoals: number | null; awayGoals: number | null; status: string } {
	if (!apiMap) {
		return {
			homeGoals: dbMatch.homeGoals,
			awayGoals: dbMatch.awayGoals,
			status: dbMatch.status,
		};
	}

	const api = apiMap.get(dbMatch.matchNumber);
	if (!api) {
		return {
			homeGoals: dbMatch.homeGoals,
			awayGoals: dbMatch.awayGoals,
			status: dbMatch.status,
		};
	}

	return {
		homeGoals: api.finished ? api.homeScore : dbMatch.homeGoals,
		awayGoals: api.finished ? api.awayScore : dbMatch.awayGoals,
		status: api.finished ? "FINISHED" : dbMatch.status,
	};
}
