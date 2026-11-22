// Formata uma data/hora ISO (ou null) para "HH:mm" no formato português.
// Como new Date interpreta o ISO completo, a conversão para a hora local do browser é automática.
export function formatarHora(hora: string | null) {
  return hora ? new Date(hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—';
}
