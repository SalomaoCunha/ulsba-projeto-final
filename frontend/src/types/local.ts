// Códigos de tipo de local aceites pela API (ex.: domicílio do utente, lar, unidade de
// cuidados, ou "BASE" para a sede/garagem de onde partem as voltas).
export type TipoLocalCodigo =
  | 'DOMICILIO'
  | 'LAR'
  | 'UNIDADE_CUIDADOS_CONTINUADOS'
  | 'UNIDADE_CUIDADOS_PALIATIVOS'
  | 'BASE';

// Local físico (morada) onde pode ocorrer uma visita — pode ser o domicílio de
// um utente, uma instituição, ou a base de partida das voltas.
export interface Local {
  id: number;
  tipo: string;
  nome: string | null;
  morada: string;
  localidade: string;
  concelho: string;
}

// Concelho de Portugal usado para localizar um local (ver coordenadasPortugal.ts).
export interface Concelho {
  id: number;
  nome: string;
}

// Dados recolhidos no formulário de criação de um novo local.
export interface NovoLocalPayload {
  tipo: TipoLocalCodigo;
  nome?: string | null;
  morada: string;
  codigoPostal?: string | null;
  localidade: string;
  concelhoId: number;
  contactoTelefonico?: string | null;
  lat: number;
  lng: number;
}
