import { NavLink } from 'react-router-dom'

interface IconProps {
  active: boolean
}

function HistoricoIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7" stroke={active ? 'var(--color-amber)' : 'currentColor'} strokeWidth="1.5" />
      <path
        d="M10 6.5V10L12.5 11.5"
        stroke={active ? 'var(--color-amber)' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarioIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="3.5"
        y="4.5"
        width="13"
        height="12"
        rx="2"
        stroke={active ? 'var(--color-amber)' : 'currentColor'}
        strokeWidth="1.5"
      />
      <path
        d="M3.5 8.5H16.5"
        stroke={active ? 'var(--color-amber)' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 3V6M13 3V6"
        stroke={active ? 'var(--color-amber)' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FinanceiroIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 3.5V16.5"
        stroke={active ? 'var(--color-amber)' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.5 6.5C13.5 5.39543 12.1569 4.5 10.5 4.5H9.25C7.87 4.5 6.75 5.34 6.75 6.375C6.75 7.41 7.87 8.25 9.25 8.25H10.75C12.13 8.25 13.25 9.09 13.25 10.125C13.25 11.16 12.13 12 10.75 12H9.25C7.59 12 6.25 12.9 6.25 14"
        stroke={active ? 'var(--color-amber)' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ITEMS: Array<{
  to: string
  label: string
  icon: (props: IconProps) => React.JSX.Element
  end?: boolean
}> = [
  { to: '/historico', label: 'Histórico', icon: HistoricoIcon },
  { to: '/', label: 'Calendário', icon: CalendarioIcon, end: true },
  { to: '/financeiro', label: 'Financeiro', icon: FinanceiroIcon },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide transition"
          >
            {({ isActive }) => (
              <span
                className={`flex flex-col items-center gap-1 ${isActive ? 'text-amber-dim' : 'text-ink-soft hover:text-ink'}`}
              >
                <item.icon active={isActive} />
                <span className="relative pb-1">
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-amber" />
                  )}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}