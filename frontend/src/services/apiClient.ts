// URL base do backend. Pode ser configurada por variável de ambiente (ex.: em produção);
// por defeito assume-se que a API corre localmente durante o desenvolvimento.
const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Remove barras finais repetidas antes de acrescentar o prefixo da versão da API.
const API_BASE_URL = `${API_ORIGIN.replace(/\/+$/, '')}/api/v1`;

// Wrapper único para todos os pedidos à API: junta o token de autenticação,
// normaliza erros HTTP (incluindo os de validação do FastAPI) e trata sessões expiradas.
// Todos os services (equipaService, utenteService, etc.) passam por aqui em vez de usar fetch diretamente.
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
    // fetch lança TypeError quando não consegue sequer estabelecer a ligação
    // (backend em baixo, URL errada, CORS, etc.) — distingue-se de um erro de negócio.
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
    // Tenta extrair a mensagem de erro do corpo da resposta; se o corpo não for
    // JSON válido (ou estiver vazio), cai-se na mensagem genérica com o código HTTP.
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
