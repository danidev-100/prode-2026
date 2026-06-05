"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close menu on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 640) setMenuOpen(false)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const linkClass = (path: string) =>
    `px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      pathname === path
        ? "bg-accent/15 text-accent"
        : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
    }`

  const mobileLinkClass = (path: string) =>
    `block px-4 py-3 text-base font-medium transition-colors duration-200 border-b border-border/30 last:border-0 ${
      pathname === path
        ? "bg-accent/10 text-accent"
        : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
    }`

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/90 backdrop-blur-lg">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg tracking-tight text-text-primary hover:text-accent transition-colors duration-200 shrink-0"
        >
          <span className="text-accent text-xl">⚽</span>
          <span className="hidden xs:inline">Prode 2026</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          <Link href="/" className={linkClass("/")}>
            Partidos
          </Link>
          <Link href="/ranking" className={linkClass("/ranking")}>
            Ranking
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="text-accent text-xs font-medium hover:underline">
                  Admin
                </Link>
              )}
              <span className="text-text-secondary text-sm truncate max-w-[120px]">
                {session.user.name}
              </span>
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
                className="bg-accent hover:bg-accent-hover text-black font-medium text-sm px-3 py-1.5 rounded-lg transition-colors duration-200"
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
        <div className="bg-bg-secondary border-t border-border">
          <Link href="/" className={mobileLinkClass("/")}>
            ⚽ Partidos
          </Link>
          <Link href="/ranking" className={mobileLinkClass("/ranking")}>
            🏆 Ranking
          </Link>

          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className={mobileLinkClass("/admin")}>
                  ⚙️ Admin
                </Link>
              )}
              <div className="px-4 py-3 border-b border-border/30">
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
              <Link href="/login" className={mobileLinkClass("/login")}>
                Ingresar
              </Link>
              <div className="p-4">
                <Link
                  href="/register"
                  className="block w-full text-center bg-accent hover:bg-accent-hover text-black font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Registrarse
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
