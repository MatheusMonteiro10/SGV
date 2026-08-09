import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../../hooks/useAuth'
import { AuthLayout } from './AuthLayout'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton'
import type { ApiErrorResponse } from '../../types/auth'

interface LocationState {
  from?: { pathname: string }
  mensagem?: string
}

export function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [googleError, setGoogleError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to={state?.from?.pathname ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    try {
      await login(email, senha)
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

  async function handleGoogleCredential(idToken: string) {
    setGoogleError(null)
    setFormError(null)
    try {
      await loginWithGoogle(idToken)
      navigate(state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setGoogleError(err.response.data.message ?? 'Não foi possível entrar com o Google.')
      } else {
        setGoogleError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-2xl text-ink">Entre ou cadastre-se</h2>
      <p className="mt-1 text-sm text-ink-soft">Acesse sua conta ou crie uma nova para gerenciar suas viagens.</p>

      {state?.mensagem && (
        <div role="status" className="mx-auto mt-6 max-w-[320px] rounded-md border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
          {state.mensagem}
        </div>
      )}

      <div className="mt-8">
        {googleError && <p className="mb-3 text-center text-sm text-danger">{googleError}</p>}
        <GoogleSignInButton onCredential={handleGoogleCredential} text="continue_with" />
      </div>

      <div className="mx-auto mt-6 flex max-w-[320px] items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-widest text-ink-soft">ou</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-[320px] space-y-5" noValidate>
        {formError && (
          <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="email" className="sr-only">
            Endereço de e-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Endereço de e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-amber focus:ring-2 focus:ring-amber/30"
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="senha" className="sr-only">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1.5 w-full rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
          />
          {fieldErrors.senha && <p className="mt-1 text-xs text-danger">{fieldErrors.senha}</p>}
        </div>

        <div className="text-center">
          <Link to="/esqueci-senha" className="text-xs text-ink-soft underline-offset-4 hover:underline">
            Esqueceu sua senha?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-medium text-ink underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}