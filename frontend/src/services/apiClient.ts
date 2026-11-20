const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${API_ORIGIN.replace(/\/+$/, '')}/api/v1`;

export async function apiFetch<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opcoes.headers,
      },
    });
  } catch (erro) {
    if (erro instanceof TypeError) {
      throw new Error(`Não foi possível contactar a API em ${API_ORIGIN}. Confirme se o backend está ativo e se a URL está correta.`, { cause: erro });
    }
    throw erro;
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.detail ?? `Erro ${resposta.status}`);
  }

  return resposta.json();
}
