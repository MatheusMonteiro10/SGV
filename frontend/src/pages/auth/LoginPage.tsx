import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../../hooks/useAuth'
import type { ApiErrorResponse } from '../../types/auth'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (isAuthenticated) {
    const state = location.state as LocationState | null
    return <Navigate to={state?.from?.pathname ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    try {
      await login(email, senha)
      const state = location.state as LocationState | null
      navigate(state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        const { data, status } = err.response
        if (data.campos) setFieldErrors(data.campos)
        setFormError(
          data.message ?? (status === 401 ? 'E-mail ou senha inválidos.' : 'Não foi possível entrar. Tente novamente.'),
        )
      } else {
        setFormError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-paper font-body text-ink">
      {/* Painel de rota */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-14 py-12 text-paper lg:flex lg:w-1/2">
        <RoutePath />
        <div className="relative z-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber">SGV</span>
          <h1 className="mt-6 max-w-md font-display text-4xl leading-tight text-paper">
            Cada corrida registrada.
            <br />
            Cada real contabilizado.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-ink-soft">
            O painel do motorista autônomo para organizar viagens, agenda e faturamento em um só lugar.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-6 font-mono text-xs text-ink-soft">
          <span>calendário</span>
          <span className="h-1 w-1 rounded-full bg-amber" />
          <span>histórico</span>
          <span className="h-1 w-1 rounded-full bg-amber" />
          <span>financeiro</span>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-dim">SGV</span>
          </div>

          <h2 className="font-display text-2xl text-ink">Entrar</h2>
          <p className="mt-1 text-sm text-ink-soft">Acesse sua conta para gerenciar suas viagens.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {formError && (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-ink">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
              />
              {fieldErrors.senha && <p className="mt-1 text-xs text-danger">{fieldErrors.senha}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">Cadastro em breve.</p>
        </div>
      </main>
    </div>
  )
}

function RoutePath() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-70" viewBox="0 0 600 700" fill="none" aria-hidden="true">
      <path
        d="M40,620 C160,560 120,380 260,340 S 420,180 380,60"
        className="stroke-line"
        strokeWidth="2"
        strokeDasharray="2 10"
        strokeLinecap="round"
        fill="none"
      />
      <circle r="5" className="route-dot fill-amber" />
      <circle cx="40" cy="620" r="4" className="fill-ink-soft" />
      <circle cx="380" cy="60" r="4" className="fill-ink-soft" />
    </svg>
  )
}