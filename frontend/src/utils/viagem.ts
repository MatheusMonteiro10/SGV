/*
 Remove os segundos do horário retornado pelo backend (LocalTime serializa
 como "HH:mm:ss"). 
*/
export function formatarHorario(horario: string): string {
  return horario.slice(0, 5)
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor)
}

// Converte yyyy-MM-dd (local, sem passar por UTC) em Date — evita off-by-one por fuso. 
export function parseDataIso(dataIso: string): Date {
  const [y, m, d] = dataIso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Formato extenso, ex: "Quinta-feira, 12 de março de 2026" 
export function formatarDataExtensa(dataIso: string): string {
  const data = parseDataIso(dataIso)
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Formato curto pra listas/cards, ex: "12 mar 2026" 
export function formatarDataCurta(dataIso: string): string {
  const data = parseDataIso(dataIso)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(data)
    .replace('.', '')
}