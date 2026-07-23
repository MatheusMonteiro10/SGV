import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { usuario, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper p-8 font-body text-ink">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-dim">SGV</span>
            <h1 className="mt-2 font-display text-2xl">Olá, {usuario?.nome}</h1>
            <p className="mt-1 text-sm text-ink-soft">{usuario?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-danger hover:text-danger"
          >
            Sair
          </button>
        </div>
        <p className="mt-10 text-sm text-ink-soft">
          Painel em construção — calendário, histórico e financeiro chegam nas próximas etapas do roadmap.
        </p>
      </div>
    </div>
  )
}