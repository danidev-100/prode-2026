"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al resetear la contraseña")
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-5xl">❌</span>
          <h1 className="text-xl font-bold text-text-primary mt-3">Link inválido</h1>
          <p className="text-text-muted text-sm mt-2">
            Este enlace no es válido. Solicitá uno nuevo.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block mt-4 text-accent hover:underline text-sm font-medium"
          >
            Solicitar nuevo link
          </Link>
        </div>
      </div>
    )
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
            Nueva <span className="text-accent">contraseña</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Elegí una nueva contraseña para tu cuenta
          </p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="bg-accent/10 border border-accent/20 text-sm rounded-lg px-4 py-3 w-full">
              <p className="font-medium text-accent">✅ Contraseña actualizada</p>
              <p className="text-text-secondary text-xs mt-1">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm text-accent hover:underline font-medium"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
              >
                Nueva contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                  text-text-primary placeholder:text-text-muted/40
                  focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full h-11 bg-bg-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm
                  text-text-primary placeholder:text-text-muted/40
                  focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all duration-200"
                placeholder="Repetí la contraseña"
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
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </button>
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
