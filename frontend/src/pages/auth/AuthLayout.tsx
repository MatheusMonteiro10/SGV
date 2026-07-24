import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper font-body text-ink">
      {/* Painel de rota */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-14 py-12 text-paper lg:flex lg:w-1/2">
        <RoutePath />
        <div className="relative z-10">
          <span className="font-mono text-sm uppercase tracking-[0.3em] text-amber">SGV</span>
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

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-mono text-sm uppercase tracking-[0.3em] text-amber-dim">SGV</span>
          </div>
          {children}
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