// Mock de sessão — não há autenticação real ainda (ponto 8.14 em aberto).
// Serve para preencher "autor" nos históricos e decidir permissões simples.
export const UTILIZADOR_ATUAL = {
  nome: 'Enf. Ana Silva',
  papel: 'Coordenador' as const,
};
