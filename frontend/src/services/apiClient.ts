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

  if (resposta.status === 401) {
    // Token expirado/inválido: sem isto a app fica "presa" a repetir pedidos
    // que nunca mais vão ter sucesso, em vez de pedir novo login.
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Inicie sessão novamente.');
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(formatarDetailErro(erro?.detail) ?? `Erro ${resposta.status}`);
  }

  return resposta.json();
}

// O FastAPI devolve "detail" como string nos HTTPException normais, mas como
// lista de objetos {msg, loc, ...} nos erros de validação 422 — sem isto,
// a mensagem de erro aparecia como "[object Object]".
function formatarDetailErro(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : JSON.stringify(item)))
      .join('; ');
  }

  return null;
}
