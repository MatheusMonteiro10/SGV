import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { AuthLayout } from './AuthLayout'
import { esqueciSenha } from '../../api/auth'
import type { ApiErrorResponse } from '../../types/auth'

export function EsqueciSenhaPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      await esqueciSenha({ email })
      // O backend sempre responde 200 aqui (não revela se o e-mail existe),
      // então seguimos direto pra tela de confirmação do código.
      navigate('/redefinir-senha', {
        state: { email, mensagem: 'Se o e-mail existir, um código foi enviado.' },
      })
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setFormError(err.response.data.message ?? 'Não foi possível enviar o código.')
      } else {
        setFormError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-2xl text-ink">Esqueceu sua senha?</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Informe seu e-mail e enviaremos um código para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-[320px] space-y-5" noValidate>
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
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar código'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Lembrou a senha?{' '}
        <Link to="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </AuthLayout>
  )
}