// Nível de urgência/prioridade tal como configurado na base de dados (ver nivelService).
// O "id" é o que é necessário enviar ao alterar a prioridade de um utente.
export interface NivelUrgenciaDTO {
  id: number;
  codigo: string;
  designacao: string;
  cor_hex: string;
  ordem: number;
}

// Nível de complexidade tal como configurado na base de dados.
// O "id" é o que é necessário enviar ao alterar a complexidade de um utente.
export interface NivelComplexidadeDTO {
  id: number;
  codigo: string;
  designacao: string;
  ordem: number;
}
