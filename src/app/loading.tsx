export default function Loading() {
	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
			<div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
			<p className="text-sm text-text-muted animate-pulse">Cargando...</p>
		</div>
	);
}
