export function formatarHora(hora: string | null) {
  return hora ? new Date(hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—';
}
