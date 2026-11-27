import React, { useMemo } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import type { Utente } from '../types/utente';
import { NIVEIS_PRIORIDADE, NIVEIS_COMPLEXIDADE } from '@/config/niveis';
import { filtrosVazios, type FiltrosUtentes } from '../utils/filtrosUtentes';

interface Props {
  // Lista completa de utentes (não filtrada) — usada só para derivar as
  // opções disponíveis nos selects (localidades, equipas), não para filtrar.
  utentes: Utente[];
  // Estado atual dos filtros, controlado pelo componente pai.
  filtros: FiltrosUtentes;
  // Chamado com o novo objeto de filtros sempre que algum campo muda; o
  // componente pai é que aplica os filtros à lista de utentes.
  onChange: (filtros: FiltrosUtentes) => void;
}

// Painel de filtros da lista/mapa de utentes (prioridade, complexidade,
// estado, equipa, localidade e intervalo de datas da última visita). É um
// componente controlado: não guarda o estado dos filtros, só o reporta via
// `onChange` — quem decide o que fazer com eles é o componente pai.
const FiltrosUtentesPainel: React.FC<Props> = ({ utentes, filtros, onChange }) => {
  // Atualiza um único campo do objeto de filtros, mantendo os restantes.
  const atualizar = (campo: keyof FiltrosUtentes, valor: string | null) => {
    onChange({ ...filtros, [campo]: valor });
  };

  // Lista de localidades únicas presentes nos utentes, ordenada
  // alfabeticamente (locale 'pt' para respeitar acentos/ordem portuguesa).
  // Recalculada só quando `utentes` muda, para não reordenar a cada render.
  // Opções de localidade ficam restringidas aos concelhos já selecionados
  // (se houver) — selecionar um concelho estreita logo as localidades
  // mostradas às que pertencem a esse concelho, em vez de continuar a
  // mostrar todas as localidades do sistema.
  const localidadesDisponiveis = useMemo(() => {
    const base = filtros.concelhos.length > 0
      ? utentes.filter((u) => filtros.concelhos.includes(u.concelho))
      : utentes;
    return Array.from(new Set(base.map((u) => u.localidade).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'pt'),
    );
  }, [utentes, filtros.concelhos]);

  // Simétrico ao de cima: selecionar uma ou mais localidades estreita as
  // opções de concelho às que essas localidades realmente têm.
  const concelhosDisponiveis = useMemo(() => {
    const base = filtros.localidades.length > 0
      ? utentes.filter((u) => filtros.localidades.includes(u.localidade))
      : utentes;
    return Array.from(new Set(base.map((u) => u.concelho).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'pt'),
    );
  }, [utentes, filtros.localidades]);

  // Filtro de localidade é multi-seleção (checkboxes), por isso adiciona/
  // remove da lista em vez de substituir um único valor como os outros filtros.
  const alternarLocalidade = (localidade: string) => {
    const atuais = filtros.localidades;
    onChange({
      ...filtros,
      localidades: atuais.includes(localidade)
        ? atuais.filter((item) => item !== localidade)
        : [...atuais, localidade],
    });
  };

  // Equivalente a alternarLocalidade, mas para o filtro de concelho.
  const alternarConcelho = (concelho: string) => {
    const atuais = filtros.concelhos;
    onChange({
      ...filtros,
      concelhos: atuais.includes(concelho)
        ? atuais.filter((item) => item !== concelho)
        : [...atuais, concelho],
    });
  };

  return (
    <div className="card-header bg-white border-bottom p-3">
      <div className="d-flex gap-3 flex-wrap align-items-end">
        <div>
          <label className="form-label text-muted small fw-medium mb-1">Prioridade</label>
          <select
            className="form-select form-select-sm"
            value={filtros.prioridade ?? ''}
            onChange={(e) => atualizar('prioridade', e.target.value || null)}
          >
            <option value="">Todas</option>
            {NIVEIS_PRIORIDADE.map((n) => (
              <option key={n.valor} value={n.valor}>{n.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label text-muted small fw-medium mb-1">Complexidade</label>
          <select
            className="form-select form-select-sm"
            value={filtros.complexidade ?? ''}
            onChange={(e) => atualizar('complexidade', e.target.value || null)}
          >
            <option value="">Todas</option>
            {NIVEIS_COMPLEXIDADE.map((n) => (
              <option key={n.valor} value={n.valor}>{n.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label text-muted small fw-medium mb-1">Estado</label>
          <select
            className="form-select form-select-sm"
            value={filtros.estado ?? ''}
            onChange={(e) => atualizar('estado', e.target.value || null)}
          >
            <option value="">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Referenciado">Referenciado</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        <div>
          <label className="form-label text-muted small fw-medium mb-1">Equipa</label>
          <select
            className="form-select form-select-sm"
            value={filtros.equipa ?? ''}
            onChange={(e) => atualizar('equipa', e.target.value || null)}
          >
            <option value="">Todas</option>
            {[...new Set(utentes.map((u) => u.equipaResponsavel))].map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label text-muted small fw-medium mb-1 d-block">Localidade</label>
          <Dropdown autoClose="outside">
            <Dropdown.Toggle variant="outline-secondary" size="sm" aria-label="Filtrar por localidade">
              {filtros.localidades.length === 0
                ? 'Todas'
                : `${filtros.localidades.length} selecionada(s)`}
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <Form.Check
                id="filtro-utentes-todas-localidades"
                type="checkbox"
                label="Todas"
                checked={filtros.localidades.length === 0}
                onChange={() => onChange({ ...filtros, localidades: [] })}
              />
              <hr className="my-2" />
              {localidadesDisponiveis.map((localidade) => (
                <Form.Check
                  key={localidade}
                  id={`filtro-utentes-localidade-${localidade}`}
                  type="checkbox"
                  label={localidade}
                  checked={filtros.localidades.includes(localidade)}
                  onChange={() => alternarLocalidade(localidade)}
                />
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div>
          <label className="form-label text-muted small fw-medium mb-1 d-block">Concelho</label>
          <Dropdown autoClose="outside">
            <Dropdown.Toggle variant="outline-secondary" size="sm" aria-label="Filtrar por concelho">
              {filtros.concelhos.length === 0
                ? 'Todos'
                : `${filtros.concelhos.length} selecionado(s)`}
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <Form.Check
                id="filtro-utentes-todos-concelhos"
                type="checkbox"
                label="Todos"
                checked={filtros.concelhos.length === 0}
                onChange={() => onChange({ ...filtros, concelhos: [] })}
              />
              <hr className="my-2" />
              {concelhosDisponiveis.map((concelho) => (
                <Form.Check
                  key={concelho}
                  id={`filtro-utentes-concelho-${concelho}`}
                  type="checkbox"
                  label={concelho}
                  checked={filtros.concelhos.includes(concelho)}
                  onChange={() => alternarConcelho(concelho)}
                />
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div>
          <label className="form-label text-muted small fw-medium mb-1">Última visita (de)</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={filtros.dataDe}
            onChange={(e) => atualizar('dataDe', e.target.value)}
          />
        </div>

        <div>
          <label className="form-label text-muted small fw-medium mb-1">Última visita (até)</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={filtros.dataAte}
            onChange={(e) => atualizar('dataAte', e.target.value)}
          />
        </div>

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onChange(filtrosVazios)}
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
};

export default FiltrosUtentesPainel;
