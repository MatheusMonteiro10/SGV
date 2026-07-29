import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { BottomNav } from './BottomNav'

export function AppLayout({ children }: { children: ReactNode }) {
  const { usuario, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-dim">SGV</span>
          {usuario && <p className="mt-0.5 text-sm text-ink-soft">Olá, {usuario.nome}</p>}
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink transition hover:border-danger hover:text-danger"
        >
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-md px-4 pb-28 pt-6">{children}</main>

      <BottomNav />
    </div>
  )
}