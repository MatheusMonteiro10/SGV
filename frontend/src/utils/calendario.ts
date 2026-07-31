export interface DiaCalendario {
  data: Date
  dataIso: string // yyyy-MM-dd, mesmo formato do dataPartida
  diaDoMes: number
  noMesAtual: boolean
  isHoje: boolean
}

/**
 * Gera a grade completa de um mês (semanas fechadas de domingo a sábado),
 * @param ano 
 * @param mes mês 0-indexed (0 = Janeiro, 11 = Dezembro)
 */
export function gerarGradeMensal(ano: number, mes: number): DiaCalendario[] {
  const primeiroDiaMes = new Date(ano, mes, 1)
  const ultimoDiaMes = new Date(ano, mes + 1, 0)

  const diaSemanaInicio = primeiroDiaMes.getDay() // 0 (dom) .. 6 (sáb)
  const totalDiasMes = ultimoDiaMes.getDate()

  const dias: DiaCalendario[] = []

  // Últimos dias do mês anterior
  for (let i = diaSemanaInicio; i > 0; i--) {
    dias.push(criarDia(new Date(ano, mes, 1 - i), false))
  }

  // Dias do mês atual
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    dias.push(criarDia(new Date(ano, mes, dia), true))
  }

  // Completa a última semana até múltiplo de 7
  while (dias.length % 7 !== 0) {
    const ultimaData = dias[dias.length - 1].data
    const proximaData = new Date(ultimaData)
    proximaData.setDate(proximaData.getDate() + 1)
    dias.push(criarDia(proximaData, false))
  }

  return dias
}

function criarDia(data: Date, noMesAtual: boolean): DiaCalendario {
  return {
    data,
    dataIso: formatarDataIso(data),
    diaDoMes: data.getDate(),
    noMesAtual,
    isHoje: mesmaData(data, new Date()),
  }
}

/** Formata como yyyy-MM-dd em horário local, sem passar por UTC (evita off-by-one). */
export function formatarDataIso(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function mesmaData(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const NOMES_DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']