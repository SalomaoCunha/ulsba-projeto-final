import React, { useMemo } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import type { Utente } from '../types/utente';
import { NIVEIS_PRIORIDADE, NIVEIS_COMPLEXIDADE } from '@/config/niveis';
import { filtrosVazios, type FiltrosUtentes } from '../utils/filtrosUtentes';

interface Props {
  utentes: Utente[];
  filtros: FiltrosUtentes;
  onChange: (filtros: FiltrosUtentes) => void;
}

const FiltrosUtentesPainel: React.FC<Props> = ({ utentes, filtros, onChange }) => {
  const atualizar = (campo: keyof FiltrosUtentes, valor: string | null) => {
    onChange({ ...filtros, [campo]: valor });
  };

  const localidadesDisponiveis = useMemo(
    () =>
      Array.from(new Set(utentes.map((u) => u.localidade).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'pt'),
      ),
    [utentes],
  );

  const alternarLocalidade = (localidade: string) => {
    const atuais = filtros.localidades;
    onChange({
      ...filtros,
      localidades: atuais.includes(localidade)
        ? atuais.filter((item) => item !== localidade)
        : [...atuais, localidade],
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
