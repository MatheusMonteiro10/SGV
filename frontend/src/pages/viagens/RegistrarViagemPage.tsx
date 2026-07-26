import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useRegistrarViagem } from '../../hooks/useRegistrarViagem'
import type { ApiErrorResponse } from '../../types/auth'

export function RegistrarViagemPage() {
  const navigate = useNavigate()
  const { mutate, isPending } = useRegistrarViagem()

  const [nomeCliente, setNomeCliente] = useState('')
  const [destino, setDestino] = useState('')
  const [localPartida, setLocalPartida] = useState('')
  const [dataPartida, setDataPartida] = useState('')
  const [horarioPartida, setHorarioPartida] = useState('')
  const [valorCobrado, setValorCobrado] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    mutate(
      {
        nomeCliente,
        destino,
        localPartida,
        dataPartida,
        horarioPartida,
        valorCobrado: Number(valorCobrado),
        observacoes: observacoes || undefined,
      },
      {
        onSuccess: () => {
          navigate('/', { replace: true })
        },
        onError: (err) => {
          if (isAxiosError<ApiErrorResponse>(err) && err.response) {
            const { data } = err.response
            if (data.campos) setFieldErrors(data.campos)
            setFormError(data.message ?? 'Não foi possível registrar a viagem.')
          } else {
            setFormError('Não foi possível conectar ao servidor. Verifique sua conexão.')
          }
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-paper p-8 font-body text-ink">
      <div className="mx-auto max-w-xl">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-dim">SGV</span>
        <h1 className="mt-2 font-display text-2xl">Registrar viagem</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {formError && (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <Campo label="Nome do cliente" erro={fieldErrors.nomeCliente}>
            <input
              type="text"
              required
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              className={inputClass}
            />
          </Campo>

          <Campo label="Destino" erro={fieldErrors.destino}>
            <input
              type="text"
              required
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className={inputClass}
            />
          </Campo>

          <Campo label="Local de partida" erro={fieldErrors.localPartida}>
            <input
              type="text"
              required
              value={localPartida}
              onChange={(e) => setLocalPartida(e.target.value)}
              className={inputClass}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Data de partida" erro={fieldErrors.dataPartida}>
              <input
                type="date"
                required
                value={dataPartida}
                onChange={(e) => setDataPartida(e.target.value)}
                className={inputClass}
              />
            </Campo>

            <Campo label="Horário de partida" erro={fieldErrors.horarioPartida}>
              <input
                type="time"
                required
                value={horarioPartida}
                onChange={(e) => setHorarioPartida(e.target.value)}
                className={inputClass}
              />
            </Campo>
          </div>

          <Campo label="Valor cobrado (R$)" erro={fieldErrors.valorCobrado}>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={valorCobrado}
              onChange={(e) => setValorCobrado(e.target.value)}
              className={inputClass}
            />
          </Campo>

          <Campo label="Observações" erro={fieldErrors.observacoes}>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className={inputClass}
            />
          </Campo>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-medium text-ink transition hover:border-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Registrando...' : 'Registrar viagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'mt-1.5 w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30'

function Campo({
  label,
  erro,
  children,
}: {
  label: string
  erro?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink">{label}</label>
      {children}
      {erro && <p className="mt-1 text-xs text-danger">{erro}</p>}
    </div>
  )
}