"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const email = form.get("email") as string
    const password = form.get("password") as string

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al registrar")
        setLoading(false)
        return
      }

      await signIn("credentials", { email, password, redirect: false })
      router.push("/")
      router.refresh()
    } catch {
      setError("Error al conectar. Intentá de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <span className="text-5xl drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">🏆</span>
          <h1 className="text-2xl font-bold text-text-primary mt-3">
            Prode <span className="text-accent">Mundial 2026</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Creá tu cuenta y empezá a pronosticar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                text-text-primary placeholder:text-text-muted/40
                focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                text-text-primary placeholder:text-text-muted/40
                focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                text-text-primary placeholder:text-text-muted/40
                focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200"
              placeholder="Mínimo 6 caracteres"
            />
            <p className="text-[11px] text-text-muted mt-1">Mínimo 6 caracteres</p>
          </div>

          {error && (
            <div className="bg-danger-muted border border-danger/20 text-danger text-sm rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-accent to-accent-hover hover:from-accent-glow hover:to-accent text-black font-semibold text-sm rounded-lg
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2 shadow-sm shadow-accent/20"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-sm text-center text-text-muted mt-4">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-accent hover:underline font-medium transition-colors">
              Ingresá
            </Link>
          </p>
        </form>

        {/* Footer decoration */}
        <div className="mt-10 flex items-center justify-center gap-2 text-[11px] text-text-muted/40">
          <span>⚽</span>
          <span>FIFA World Cup 2026</span>
          <span>🏟️</span>
        </div>
      </div>
    </div>
  )
}
