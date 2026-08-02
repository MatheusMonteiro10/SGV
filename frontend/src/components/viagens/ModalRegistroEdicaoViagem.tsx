import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Modal } from '../ui/Modal'
import { useRegistrarViagem } from '../../hooks/useRegistrarViagem'
import { useAtualizarViagem } from '../../hooks/useAtualizarViagem'
import { formatarHorario } from '../../utils/viagem'
import type { ApiErrorResponse } from '../../types/auth'
import type { ViagemResponse } from '../../types/viagem'

interface ModalRegistroEdicaoViagemProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  modo: 'criar' | 'editar'
  viagem?: ViagemResponse | null // obrigatório quando modo === 'editar'
  dataInicial?: string // yyyy-MM-dd, usado quando modo === 'criar'
}

export function ModalRegistroEdicaoViagem({
  isOpen,
  onClose,
  onSuccess,
  modo,
  viagem,
  dataInicial,
}: ModalRegistroEdicaoViagemProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modo === 'criar' ? 'Agendar nova viagem' : 'Alterar viagem'}
      size="md"
    >
      <FormularioViagem
        key={modo === 'editar' ? `editar-${viagem?.id}` : `criar-${dataInicial}`}
        modo={modo}
        viagem={viagem ?? null}
        dataInicial={dataInicial}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  )
}

interface FormularioViagemProps {
  modo: 'criar' | 'editar'
  viagem: ViagemResponse | null
  dataInicial?: string
  onClose: () => void
  onSuccess: () => void
}

interface FormState {
  nomeCliente: string
  destino: string
  localPartida: string
  dataPartida: string
  horarioPartida: string
  valorCobrado: string
  observacoes: string
}

function estadoInicial(modo: 'criar' | 'editar', viagem: ViagemResponse | null, dataInicial?: string): FormState {
  if (modo === 'editar' && viagem) {
    return {
      nomeCliente: viagem.nomeCliente,
      destino: viagem.destino,
      localPartida: viagem.localPartida,
      dataPartida: viagem.dataPartida,
      horarioPartida: formatarHorario(viagem.horarioPartida),
      valorCobrado: String(viagem.valorCobrado),
      observacoes: viagem.observacoes ?? '',
    }
  }
  return {
    nomeCliente: '',
    destino: '',
    localPartida: '',
    dataPartida: dataInicial ?? '',
    horarioPartida: '',
    valorCobrado: '',
    observacoes: '',
  }
}

function FormularioViagem({ modo, viagem, dataInicial, onClose, onSuccess }: FormularioViagemProps) {
  const [form, setForm] = useState<FormState>(() => estadoInicial(modo, viagem, dataInicial))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const { mutate: registrar, isPending: isRegistrando } = useRegistrarViagem()
  const { mutate: atualizar, isPending: isAtualizando } = useAtualizarViagem(viagem?.id ?? '')
  const isPending = modo === 'criar' ? isRegistrando : isAtualizando

  function handleChange<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const dados = {
      nomeCliente: form.nomeCliente,
      destino: form.destino,
      localPartida: form.localPartida,
      dataPartida: form.dataPartida,
      horarioPartida: form.horarioPartida,
      valorCobrado: Number(form.valorCobrado),
      observacoes: form.observacoes || undefined,
    }

    const callbacks = {
      onSuccess: () => onSuccess(),
      onError: (err: unknown) => {
        if (isAxiosError<ApiErrorResponse>(err) && err.response) {
          const { data } = err.response
          if (data.campos) setFieldErrors(data.campos)
          setFormError(data.message ?? 'Não foi possível salvar a viagem.')
        } else {
          setFormError('Não foi possível conectar ao servidor. Verifique sua conexão.')
        }
      },
    }

    if (modo === 'criar') {
      registrar(dados, callbacks)
    } else {
      atualizar(dados, callbacks)
    }
  }

  return (
    <>
      <form id="form-registro-edicao-viagem" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && (
          <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {formError}
          </div>
        )}

        <Campo label="Nome do cliente" erro={fieldErrors.nomeCliente}>
          <input
            type="text"
            required
            value={form.nomeCliente}
            onChange={(e) => handleChange('nomeCliente', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo label="Destino" erro={fieldErrors.destino}>
          <input
            type="text"
            required
            value={form.destino}
            onChange={(e) => handleChange('destino', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo label="Local de partida" erro={fieldErrors.localPartida}>
          <input
            type="text"
            required
            value={form.localPartida}
            onChange={(e) => handleChange('localPartida', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Data de partida" erro={fieldErrors.dataPartida}>
            <input
              type="date"
              required
              value={form.dataPartida}
              onChange={(e) => handleChange('dataPartida', e.target.value)}
              className={inputClass}
            />
          </Campo>

          <Campo label="Horário de partida" erro={fieldErrors.horarioPartida}>
            <input
              type="time"
              required
              value={form.horarioPartida}
              onChange={(e) => handleChange('horarioPartida', e.target.value)}
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
            value={form.valorCobrado}
            onChange={(e) => handleChange('valorCobrado', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <Campo label="Observações" erro={fieldErrors.observacoes}>
          <textarea
            rows={3}
            value={form.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            className={inputClass}
          />
        </Campo>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-full border border-line py-2.5 text-sm font-medium text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Salvando...' : modo === 'criar' ? 'Agendar' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </>
  )
}

const inputClass =
  'mt-1.5 w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30'

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink">{label}</label>
      {children}
      {erro && <p className="mt-1 text-xs text-danger">{erro}</p>}
    </div>
  )
}