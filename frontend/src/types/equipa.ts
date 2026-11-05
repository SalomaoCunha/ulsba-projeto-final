// types/equipa.ts
export interface Profissional {
  nome: string;
  funcao: string; // "Enfermeira", "Médico", etc.
}

export interface Equipa {
  id: string;
  nome: string;
  zona: string; // "Beja e arredores", "Cuba, Serpa e Vidigueira"
  profissionais: Profissional[];
}
