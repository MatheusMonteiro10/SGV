import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { AuthLayout } from './AuthLayout'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton'
import { registrar } from '../../api/auth'
import { useAuth } from '../../hooks/useAuth'
import type { ApiErrorResponse } from '../../types/auth'

export function RegistroPage() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    if (senha !== confirmacaoSenha) {
      setFieldErrors({ confirmacaoSenha: 'As senhas não conferem' })
      return
    }

    setIsSubmitting(true)
    try {
      await registrar({ nome, email, senha, confirmacaoSenha })
      navigate('/verificar-email', { state: { email } })
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        const { data, status } = err.response

        // Cadastro existente mas não verificado: o AuthService já reenvia
        // um novo código automaticamente, então seguimos direto pra verificação.
        if (status === 403) {
          navigate('/verificar-email', { state: { email, mensagem: data.message } })
          return
        }

        if (data.campos) setFieldErrors(data.campos)
        setFormError(data.message ?? 'Não foi possível concluir o cadastro. Tente novamente.')
      } else {
        setFormError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setGoogleError(null)
    setFormError(null)
    try {
      await loginWithGoogle(idToken)
      navigate('/', { replace: true })
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setGoogleError(err.response.data.message ?? 'Não foi possível continuar com o Google.')
      } else {
        setGoogleError('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-2xl text-ink">Criar conta</h2>
      <p className="mt-1 text-sm text-ink-soft">Cadastre-se para começar a organizar suas viagens.</p>

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
          <label htmlFor="nome" className="sr-only">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            required
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1.5 w-full rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
          />
          {fieldErrors.nome && <p className="mt-1 text-xs text-danger">{fieldErrors.nome}</p>}
        </div>

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
            autoComplete="new-password"
            required
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1.5 w-full rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
          />
          {fieldErrors.senha && <p className="mt-1 text-xs text-danger">{fieldErrors.senha}</p>}
        </div>

        <div>
          <label htmlFor="confirmacaoSenha" className="sr-only">
            Confirmar senha
          </label>
          <input
            id="confirmacaoSenha"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Confirmar senha"
            value={confirmacaoSenha}
            onChange={(e) => setConfirmacaoSenha(e.target.value)}
            className="mt-1.5 w-full rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
          />
          {fieldErrors.confirmacaoSenha && <p className="mt-1 text-xs text-danger">{fieldErrors.confirmacaoSenha}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Já tem uma conta?{' '}
        <Link to="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}