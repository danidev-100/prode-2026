/**
 * Traduce etiquetas de fase eliminatoria del inglés al español.
 */
export function es(label: string): string {
	return label
		.replace(/^Winner Group /, "Ganador Grupo ")
		.replace(/^Runner-up Group /, "Segundo Grupo ")
		.replace(/^3rd Group /, "3° Grupo ")
		.replace(/^Winner Match /, "Ganador Partido ")
		.replace(/^Loser Match /, "Perdedor Partido ");
}
