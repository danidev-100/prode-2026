import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Prode Mundial 2026 | Pronosticá los resultados",
	description:
		"Prode del Mundial FIFA 2026. Pronosticá resultados, competí con amigos, subí en el ranking. 2pts por acierto de resultado + 1pt por marcador exacto. Canadá, México, EE.UU.",
	robots: "index, follow",
	openGraph: {
		title: "Prode Mundial 2026 🏆",
		description:
			"Pronosticá los resultados del Mundial 2026. Competí con amigos y subí al ranking.",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="es"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
			suppressHydrationWarning
			data-scroll-behavior="smooth"
		>
			<body className="min-h-full flex flex-col bg-bg-primary text-text-primary relative">
				<SessionProvider>
					<Navbar />
					<main className="flex-1 relative z-10">{children}</main>
					{/* Footer */}
					<footer className="relative z-10 border-t border-border/50 bg-bg-primary/80 backdrop-blur-sm mt-auto">
						<div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between text-[10px] sm:text-xs text-text-muted">
							<span>Creada por Daniel Fernandez</span>
							<div className="flex items-center gap-3">
								<Link
									href="/bases"
									className="text-danger bg-danger/10 border border-danger/30 rounded-lg px-2.5 py-1 font-semibold
										hover:bg-danger/20 hover:border-danger/50 transition-all duration-200 animate-blink-link"
								>
									Bases y condiciones
								</Link>
								<span aria-hidden>·</span>
								<span>11 Jun – 19 Jul · 🇨🇦 🇲🇽 🇺🇸</span>
							</div>
						</div>
					</footer>
				</SessionProvider>
			</body>
		</html>
	);
}
