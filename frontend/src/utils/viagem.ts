/*
 Remove os segundos do horário retornado pelo backend (LocalTime serializa
 como "HH:mm:ss"). 
*/
export function formatarHorario(horario: string): string {
  return horario.slice(0, 5)
}