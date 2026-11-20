export function formatarData(data: string | null) {
  return data ? new Date(data).toLocaleDateString('pt-PT') : 'Sem visitas';
}
