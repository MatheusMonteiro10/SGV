import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { AuthLayout } from './AuthLayout'
import { reenviarCodigoRegistro, verificarEmail } from '../../api/auth'
import type { ApiErrorResponse } from '../../types/auth'

interface LocationState {
  email?: string
  mensagem?: string
}

const REENVIO_COOLDOWN_SEGUNDOS = 30

export function VerificarEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  const [email, setEmail] = useState(state?.email ?? '')
  const [codigo, setCodigo] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(state?.mensagem ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setInfoMessage(null)
    setIsSubmitting(true)
    try {
      await verificarEmail({ email, codigo })
      navigate('/login', {
        state: { mensagem: 'E-mail verificado com sucesso. Faça login para continuar.' },
      })
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setFormError(err.response.data.message ?? 'Não foi possível verificar o código.')
      } else {
        setFormError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReenviar() {
    if (!email) {
      setFormError('Informe o e-mail para reenviar o código.')
      return
    }
    setFormError(null)
    setInfoMessage(null)
    setIsResending(true)
    try {
      await reenviarCodigoRegistro({ email })
      setInfoMessage('Novo código enviado para seu e-mail.')
      setCooldown(REENVIO_COOLDOWN_SEGUNDOS)
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setFormError(err.response.data.message ?? 'Não foi possível reenviar o código.')
      } else {
        setFormError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-2xl text-ink">Confirme seu e-mail</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Enviamos um código de 6 dígitos{state?.email ? <> para <strong>{state.email}</strong></> : ''}. Ele expira em 10
        minutos.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-[320px] space-y-5" noValidate>
        {formError && (
          <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {formError}
          </div>
        )}
        {infoMessage && (
          <div role="status" className="rounded-md border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
            {infoMessage}
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
        </div>

        <div>
          <label htmlFor="codigo" className="sr-only">
            Código de verificação
          </label>
          <input
            id="codigo"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            required
            placeholder="Código de 6 dígitos"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-full border border-line bg-white px-5 py-2.5 text-center text-sm tracking-[0.5em] text-ink outline-none transition placeholder:text-center placeholder:text-sm placeholder:tracking-normal placeholder:text-ink-soft focus:border-amber focus:ring-2 focus:ring-amber/30"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || codigo.length !== 6}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Verificando...' : 'Confirmar e-mail'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Não recebeu o código?{' '}
        <button
          type="button"
          onClick={handleReenviar}
          disabled={isResending || cooldown > 0}
          className="font-medium text-ink underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-ink-soft disabled:no-underline"
        >
          {cooldown > 0 ? `Reenviar (${cooldown}s)` : isResending ? 'Enviando...' : 'Reenviar código'}
        </button>
      </p>

      <p className="mt-2 text-center text-sm text-ink-soft">
        <Link to="/login" className="underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </AuthLayout>
  )
}