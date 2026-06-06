"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    setDevLink("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al enviar la solicitud")
        return
      }

      setSent(true)
      if (data.devLink) {
        setDevLink(data.devLink)
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <span className="text-5xl drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">🔐</span>
          <h1 className="text-2xl font-bold text-text-primary mt-3">
            Recuperar <span className="text-accent">contraseña</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Te enviamos un link para resetearla
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <div className="bg-accent/10 border border-accent/20 text-sm rounded-lg px-4 py-3 text-text-primary">
              <p className="font-medium text-accent mb-1">✅ Revisá tu email</p>
              <p className="text-text-secondary text-xs leading-relaxed">
                Si existe una cuenta con ese email, vas a recibir un link para
                restablecer tu contraseña en los próximos minutos.
              </p>
            </div>

            {devLink && (
              <div className="bg-gold/10 border border-gold/20 text-sm rounded-lg px-4 py-3">
                <p className="font-medium text-gold text-xs mb-1.5">🔧 Modo desarrollo</p>
                <a
                  href={devLink}
                  className="text-accent hover:text-accent-glow text-xs break-all underline underline-offset-2"
                >
                  {devLink}
                </a>
              </div>
            )}

            <Link
              href="/login"
              className="text-sm text-center text-accent hover:underline font-medium mt-2"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                  text-text-primary placeholder:text-text-muted/40
                  focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200"
                placeholder="tu@email.com"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/30 text-danger text-sm rounded-lg px-3 py-2 flex items-center gap-2">
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
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>

            <p className="text-sm text-center text-text-muted mt-4">
              <Link href="/login" className="text-accent hover:underline font-medium transition-colors">
                ← Volver
              </Link>
            </p>
          </form>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-[11px] text-text-muted/40">
          <span>⚽</span>
          <span>FIFA World Cup 2026</span>
          <span>🏟️</span>
        </div>
      </div>
    </div>
  )
}
