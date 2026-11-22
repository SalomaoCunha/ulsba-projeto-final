// Formata uma data ISO (ou null) para o formato de exibição português (DD/MM/AAAA).
// Quando não há data (ex.: utente ainda sem visitas), devolve um texto explicativo em vez de vazio.
export function formatarData(data: string | null) {
  return data ? new Date(data).toLocaleDateString('pt-PT') : 'Sem visitas';
}
