"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
	const { data: session } = useSession();
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		function onResize() {
			if (window.innerWidth >= 640) setMenuOpen(false);
		}
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const linkClass = (path: string) =>
		`px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
			pathname === path
				? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(34,197,94,0.2)]"
				: "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
		}`;

	const mobileLinkClass = (path: string) =>
		`block px-4 py-3 text-base font-medium transition-colors duration-200 border-b border-border/30 last:border-0 ${
			pathname === path
				? "bg-accent/10 text-accent"
				: "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
		}`;

	return (
		<nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur-xl supports-[backdrop-filter]:bg-bg-primary/80">
			{/* Subtle top gradient line */}
			<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

			<div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
				{/* Logo */}
				<Link
					href="/"
					className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0 group"
				>
					<span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 group-hover:border-accent/40 transition-all duration-300 overflow-hidden">
						<img
							src="/logo.jpg"
							alt="Prode 2026"
							className="w-full h-full object-cover"
						/>
					</span>
					<div className="flex flex-col leading-none">
						<span className="text-text-primary group-hover:text-accent transition-colors duration-200 text-sm">
							Prode
						</span>
						<span className="text-[10px] text-accent font-semibold tracking-widest uppercase">
							Mundial 2026
						</span>
					</div>
				</Link>

				{/* Desktop nav */}
				<div className="hidden sm:flex items-center gap-1">
					<Link href="/" className={linkClass("/")}>
						⚽ Partidos
					</Link>
					<Link href="/posiciones" className={linkClass("/posiciones")}>
						📊 Posiciones
					</Link>
					<Link href="/ranking" className={linkClass("/ranking")}>
						🏆 Ranking
					</Link>

					{session?.user ? (
						<div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
							{session.user.role === "ADMIN" && (
								<Link
									href="/admin"
									className="text-accent text-xs font-semibold hover:text-accent-glow transition-colors duration-200 bg-accent/5 px-2.5 py-1 rounded-lg border border-accent/10 hover:border-accent/30"
								>
									⚙️ Admin
								</Link>
							)}
							<div className="flex items-center gap-2">
								<div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-gold/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent">
									{session.user.name?.charAt(0).toUpperCase() || "?"}
								</div>
								<span className="text-text-secondary text-sm truncate max-w-[100px]">
									{session.user.name}
								</span>
							</div>
							<button
								onClick={() => signOut({ callbackUrl: "/login" })}
								className="text-text-muted hover:text-danger text-xs transition-colors duration-200"
							>
								Salir
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
							<Link
								href="/login"
								className="text-text-secondary hover:text-text-primary text-sm transition-colors duration-200"
							>
								Ingresar
							</Link>
							<Link
								href="/register"
								className="bg-gradient-to-r from-accent to-accent-hover hover:from-accent-glow hover:to-accent text-black font-semibold text-sm px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm shadow-accent/20 hover:shadow-accent/30"
							>
								Registrarse
							</Link>
						</div>
					)}
				</div>

				{/* Mobile hamburger */}
				<button
					onClick={() => setMenuOpen(!menuOpen)}
					className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-bg-tertiary transition-colors duration-200"
					aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
					aria-expanded={menuOpen}
				>
					<div className="flex flex-col gap-1.5 w-5">
						<span
							className={`block h-0.5 bg-text-primary rounded transition-all duration-200 origin-center ${
								menuOpen ? "rotate-45 translate-y-1" : ""
							}`}
						/>
						<span
							className={`block h-0.5 bg-text-primary rounded transition-all duration-200 ${
								menuOpen ? "opacity-0" : ""
							}`}
						/>
						<span
							className={`block h-0.5 bg-text-primary rounded transition-all duration-200 origin-center ${
								menuOpen ? "-rotate-45 -translate-y-1" : ""
							}`}
						/>
					</div>
				</button>
			</div>

			{/* Mobile menu */}
			<div
				className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
					menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="bg-bg-secondary/95 backdrop-blur-lg border-t border-border">
					<Link
						href="/"
						className={mobileLinkClass("/")}
						onClick={() => setMenuOpen(false)}
					>
						⚽ Partidos
					</Link>
					<Link
						href="/posiciones"
						className={mobileLinkClass("/posiciones")}
						onClick={() => setMenuOpen(false)}
					>
						📊 Posiciones
					</Link>
					<Link
						href="/ranking"
						className={mobileLinkClass("/ranking")}
						onClick={() => setMenuOpen(false)}
					>
						🏆 Ranking
					</Link>

					{session?.user ? (
						<>
							{session.user.role === "ADMIN" && (
								<Link
									href="/admin"
									className={mobileLinkClass("/admin")}
									onClick={() => setMenuOpen(false)}
								>
									⚙️ Admin
								</Link>
							)}
							<div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
								<div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-gold/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent">
									{session.user.name?.charAt(0).toUpperCase() || "?"}
								</div>
								<span className="text-text-secondary text-sm">
									{session.user.name}
								</span>
							</div>
							<button
								onClick={() => signOut({ callbackUrl: "/login" })}
								className="w-full text-left px-4 py-3 text-base font-medium text-danger hover:bg-bg-tertiary transition-colors duration-200"
							>
								Salir
							</button>
						</>
					) : (
						<>
							<Link
								href="/login"
								className={mobileLinkClass("/login")}
								onClick={() => setMenuOpen(false)}
							>
								Ingresar
							</Link>
							<div className="p-4">
								<Link
									href="/register"
									className="block w-full text-center bg-gradient-to-r from-accent to-accent-hover text-black font-bold py-3 rounded-lg transition-all duration-200 shadow-sm shadow-accent/20"
									onClick={() => setMenuOpen(false)}
								>
									Registrarse
								</Link>
							</div>
						</>
					)}
				</div>
			</div>
		</nav>
	);
}
