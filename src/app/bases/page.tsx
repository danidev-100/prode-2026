import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Bases y Condiciones | Prode Mundial 2026",
	description:
		"Bases y condiciones del Prode Mundial 2026. Reglas de participación, sistema de puntuación, privacidad y términos legales.",
};

const sections = [
	{
		id: "introduccion",
		title: "1. Introducción",
		content: (
			<>
				<p>
					El <strong>Prode Mundial 2026</strong> es un juego de pronósticos
					deportivos <strong>sin apuestas económicas ni fines de lucro</strong>,
					organizado por <strong>Daniel Fernandez</strong> (&quot;el
					organizador&quot;) con el único propósito de divertirse y compartir la
					pasión por el fútbol, el deporte más lindo del mundo.
				</p>
				<p>
					Esta plataforma fue creada con dedicación y cariño para todos los que
					amamos este deporte: para juntarse con amigos,
					familia o conocidos y vivir el Mundial 2026 de una forma más
					entretenida.{" "}
					<strong>
						No hay dinero de por medio, no hay apuestas, solo fútbol y
						diversión.
					</strong>
				</p>
				<p>
					Al registrarse y participar, el usuario (&quot;participante&quot;)
					acepta las presentes bases y condiciones en su totalidad. Si no está
					de acuerdo, deberá abstenerse de utilizar la plataforma.
				</p>
			</>
		),
	},
	{
		id: "participacion",
		title: "2. Participación",
		content: (
			<>
				<h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">
					2.1. Requisitos
				</h3>
				<ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary">
					<li>
						Ser mayor de 18 años (recomendado) o contar con autorización
						parental.
					</li>
					<li>Registrarse con un email válido y nombre real o de usuario.</li>
					<li>
						No compartir la cuenta con terceros. Cada participante es
						responsable de su acceso.
					</li>
				</ul>

				<h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">
					2.2. Una cuenta por persona
				</h3>
				<p>
					Cada participante puede tener una sola cuenta. El organizador se
					reserva el derecho de eliminar cuentas duplicadas o sospechosas sin
					previo aviso.
				</p>

				<h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">
					2.3. Sin costo económico
				</h3>
				<p>
					La participación en el Prode Mundial 2026 es completamente gratuita.
					No se requiere ningún pago, depósito ni transacción económica para
					registrarse, pronosticar o participar en ligas privadas.
				</p>
			</>
		),
	},
	{
		id: "funcionamiento",
		title: "3. Funcionamiento del juego",
		content: (
			<>
				<h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">
					3.1. Pronósticos
				</h3>
				<p>
					El participante deberá pronosticar el resultado de cada partido del
					Mundial FIFA 2026 indicando los goles del equipo local y visitante
					<strong> hasta 30 minutos antes del inicio del partido</strong>.
				</p>
				<p>
					Una vez que comienza el partido, el pronóstico queda bloqueado y no
					puede modificarse. Los pronósticos ingresados fuera del plazo de 30
					minutos previos al inicio <strong>no sumarán puntos</strong>.
				</p>

				<h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">
					3.2. Sistema de puntuación
				</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm text-text-secondary border-collapse">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-2 pr-4 font-semibold text-text-primary">
									Condición
								</th>
								<th className="text-left py-2 font-semibold text-text-primary">
									Puntos
								</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">
									Acierto de resultado (quién gana o empata)
								</td>
								<td className="py-2">
									<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent font-bold text-xs">
										2
									</span>
								</td>
							</tr>
							<tr className="border-b border-border/50">
								<td className="py-2">
									Acierto de marcador exacto
									<span className="text-text-muted text-xs ml-1">
										(se suman a los 2 del resultado)
									</span>
								</td>
								<td className="py-2">
									<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold/10 text-gold font-bold text-xs">
										+1
									</span>
								</td>
							</tr>
							<tr>
								<td className="py-2 pr-4">
									Sin pronóstico o pronóstico vencido
								</td>
								<td className="py-2">
									<span className="text-text-muted text-xs">0</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">
					3.3. Tabla de posiciones
				</h3>
				<p>
					Las posiciones se calculan automáticamente sumando los puntos
					obtenidos en cada partido. El ranking global considera a todos los
					participantes. Las ligas privadas muestran la posición dentro de ese
					grupo específico.
				</p>

				<h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">
					3.4. Desempate
				</h3>
				<p>
					En caso de empate en el ranking, se utilizarán los siguientes
					criterios de desempate en orden:
				</p>
				<ol className="list-decimal pl-5 space-y-1 text-sm text-text-secondary mt-2">
					<li>Mayor cantidad de marcadores exactos acertados.</li>
					<li>Mayor cantidad de resultados acertados.</li>
					<li>Menor cantidad de pronósticos sin realizar.</li>
					<li>
						Fecha de registro (el participante más antiguo tiene prioridad).
					</li>
				</ol>
			</>
		),
	},
	{
		id: "ligas",
		title: "4. Ligas privadas",
		content: (
			<>
				<p>
					Las ligas privadas permiten a grupos de participantes competir entre
					sí de forma independiente al ranking global.
				</p>
				<ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary mt-2">
					<li>
						Cualquier participante puede crear una liga y compartir el código de
						invitación.
					</li>
					<li>
						El creador de la liga es el administrador y puede gestionar
						miembros.
					</li>
					<li>No hay límite de ligas por participante.</li>
					<li>
						Las ligas no tienen costo adicional y son independientes del ranking
						global.
					</li>
				</ul>
			</>
		),
	},
	{
		id: "privacidad",
		title: "5. Privacidad y datos personales",
		content: (
			<>
				<p>
					El organizador recopila únicamente los datos necesarios para el
					funcionamiento del juego: nombre, email y pronósticos realizados.
				</p>
				<ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary mt-2">
					<li>
						<strong>Email:</strong> se utiliza exclusivamente para la creación
						de cuenta, recuperación de contraseña y notificaciones relacionadas
						al prode.
					</li>
					<li>
						<strong>Nombre:</strong> se muestra públicamente en rankings y
						ligas. No es obligatorio usar el nombre real.
					</li>
					<li>
						<strong>Pronósticos:</strong> son visibles para el participante y
						para los administradores. No se comparten con terceros.
					</li>
					<li>
						<strong>No se almacenan</strong> datos bancarios, financieros ni de
						tarjetas de crédito.
					</li>
					<li>
						<strong>No se vende ni comparte</strong> información personal con
						terceros bajo ningún concepto.
					</li>
				</ul>
				<p className="mt-3">
					El participante puede solicitar la eliminación de su cuenta y datos
					asociados en cualquier momento escribiendo al correo del organizador.
				</p>
			</>
		),
	},
	{
		id: "responsabilidad",
		title: "6. Limitación de responsabilidad",
		content: (
			<>
				<p>
					El Prode Mundial 2026 es un juego de pronósticos sin apuestas
					económicas. El organizador no se responsabiliza por:
				</p>
				<ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary mt-2">
					<li>
						Errores técnicos, caídas del servidor o pérdida de datos ocasionada
						por los servicios de hosting o infraestructura utilizados (Vercel,
						Neon PostgreSQL, Auth.js).
					</li>
					<li>
						Decisiones de los participantes basadas en la información mostrada
						en la plataforma.
					</li>
					<li>Daños o perjuicios derivados del uso de la plataforma.</li>
					<li>
						La exactitud, integridad o actualidad de los datos de partidos,
						resultados y estadísticas, que se obtienen de fuentes externas.
					</li>
				</ul>
			</>
		),
	},
	{
		id: "modificaciones",
		title: "7. Modificaciones",
		content: (
			<>
				<p>
					El organizador se reserva el derecho de modificar estas bases y
					condiciones en cualquier momento. Los cambios serán comunicados a
					través de la plataforma. El uso continuado del sitio posterior a
					dichas modificaciones constituye la aceptación de las mismas.
				</p>
			</>
		),
	},
	{
		id: "termino",
		title: "8. Vigencia",
		content: (
			<>
				<p>
					Estas bases y condiciones están vigentes desde el{" "}
					<strong>11 de junio de 2026</strong> hasta que el organizador decida
					dar por finalizada la plataforma. Una vez finalizado el Mundial 2026,
					la plataforma podrá mantenerse con fines estadísticos y de
					visualización de resultados.
				</p>
			</>
		),
	},
	{
		id: "contacto",
		title: "9. Contacto",
		content: (
			<>
				<p>
					Para consultas, solicitudes de baja o cualquier otra comunicación
					relacionada con estas bases y condiciones, el participante puede
					contactar al organizador a través de los canales habilitados en la
					plataforma o mediante el correo electrónico asociado a la cuenta del
					organizador.
				</p>
			</>
		),
	},
];

export default function BasesPage() {
	return (
		<>
			{/* Background subtle glow */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
			</div>

			<div className="max-w-3xl mx-auto px-4 py-10 sm:py-16 relative z-10">
				{/* Header */}
				<div className="mb-10">
					<span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest mb-4">
						Legal
					</span>
					<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
						Bases y <span className="text-accent">Condiciones</span>
					</h1>
					<p className="text-text-muted text-sm mt-2">
						Prode Mundial 2026 · Última actualización: junio 2026
					</p>
				</div>

				{/* Content */}
				<div className="space-y-8">
					{sections.map((section) => (
						<section key={section.id} id={section.id}>
							<h2 className="text-lg sm:text-xl font-bold text-text-primary mb-3">
								{section.title}
							</h2>
							<div className="prose prose-sm max-w-none text-text-secondary space-y-2 leading-relaxed">
								{section.content}
							</div>
						</section>
					))}
				</div>

				{/* Footer back link */}
				<div className="mt-12 pt-6 border-t border-border text-center">
					<Link
						href="/"
						className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors duration-200"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Volver al inicio
					</Link>
				</div>
			</div>
		</>
	);
}
