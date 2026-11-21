export type TipoLocalCodigo =
  | 'DOMICILIO'
  | 'LAR'
  | 'UNIDADE_CUIDADOS_CONTINUADOS'
  | 'UNIDADE_CUIDADOS_PALIATIVOS'
  | 'BASE';

export interface Local {
  id: number;
  tipo: string;
  nome: string | null;
  morada: string;
  localidade: string;
  concelho: string;
}

export interface Concelho {
  id: number;
  nome: string;
}

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
