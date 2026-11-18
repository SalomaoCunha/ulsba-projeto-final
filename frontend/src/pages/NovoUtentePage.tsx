import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUtente } from '../services/utenteService';
import { getLocais } from '../services/localService';
import type { Local } from '../types/local';

const LABEL_GENERO: Record<string, string> = {
  FEMININO: 'Feminino',
  MASCULINO: 'Masculino',
  OUTRO: 'Outro',
  NAO_INDICADO: 'Prefere não indicar',
};

const NovoUtentePage: React.FC = () => {
  const navigate = useNavigate();
  const [locais, setLocais] = useState<Local[]>([]);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    numeroUtente: '',
    nome: '',
    genero: 'NAO_INDICADO',
    dataNascimento: '',
    localId: '',
    contacto: '',
    situacaoClinica: '',
    notas: '',
  });

  useEffect(() => {
    getLocais().then(setLocais).catch((erro) => console.error('Falha ao carregar locais:', erro));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.localId) {
      setErro('Escolhe o local onde o utente se encontra.');
      return;
    }

    setErro(null);
    setAGuardar(true);
    try {
      await createUtente({
        numeroUtente: formData.numeroUtente,
        nome: formData.nome,
        genero: formData.genero,
        dataNascimento: formData.dataNascimento,
        localId: Number(formData.localId),
        contactoTelefonico: formData.contacto,
        situacaoClinica: formData.situacaoClinica,
        notas: formData.notas,
      });
      navigate('/utentes');
    } catch (erro) {
      console.error('Falha ao criar utente:', erro);
      setErro('Não foi possível criar o utente. Confirma os dados e tenta novamente.');
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Registar Novo Utente</h1>
          <p className="text-muted mb-0 small">Preencha os dados para adicionar um paciente ao sistema</p>
        </div>
        <button
          className="btn btn-outline-secondary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => navigate('/utentes')}
          type="button"
        >
          <i className="bi bi-arrow-left"></i> Voltar à Lista
        </button>
      </div>

      <div className="card shadow-sm border-0 flex-grow-1 bg-white p-4 overflow-auto">
        <form onSubmit={handleGuardar}>
          <h5 className="fw-bold text-dark mb-4"><i className="bi bi-person-lines-fill me-2"></i>Dados do Paciente</h5>

          {erro && <div className="alert alert-danger">{erro}</div>}

          <div className="row g-4 mb-4" style={{ maxWidth: '800px' }}>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">N.º de Utente *</label>
              <input
                type="text"
                className="form-control bg-light"
                name="numeroUtente"
                value={formData.numeroUtente}
                onChange={handleChange}
                placeholder="Ex: 12575"
                required
              />
            </div>
            <div className="col-12 col-md-8">
              <label className="form-label text-muted small fw-medium">Nome Completo *</label>
              <input
                type="text"
                className="form-control bg-light"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Manuel Joaquim..."
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">Género *</label>
              <select
                className="form-select bg-light"
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                required
              >
                {Object.entries(LABEL_GENERO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">Data de Nascimento *</label>
              <input
                type="date"
                className="form-control bg-light"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">Contacto Telefónico</label>
              <input
                type="text"
                className="form-control bg-light"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Ex: 912 345 678"
              />
            </div>

            <div className="col-12">
              <label className="form-label text-muted small fw-medium">Local *</label>
              <select
                className="form-select bg-light"
                name="localId"
                value={formData.localId}
                onChange={handleChange}
                required
              >
                <option value="">Escolhe o local onde o utente se encontra...</option>
                {locais.map((local) => (
                  <option key={local.id} value={local.id}>
                    {local.nome ? `${local.nome} — ` : ''}{local.morada}, {local.localidade}
                  </option>
                ))}
              </select>
              <div className="form-text">
                Não encontras o local? É preciso criá-lo primeiro em Locais.
              </div>
            </div>

            <div className="col-12">
              <label className="form-label text-muted small fw-medium">Situação Clínica</label>
              <textarea
                className="form-control bg-light"
                name="situacaoClinica"
                rows={3}
                value={formData.situacaoClinica}
                onChange={handleChange}
                placeholder="Resumo da situação clínica do utente"
              />
            </div>

            <div className="col-12">
              <label className="form-label text-muted small fw-medium">Notas</label>
              <textarea
                className="form-control bg-light"
                name="notas"
                rows={2}
                value={formData.notas}
                onChange={handleChange}
                placeholder="Notas adicionais"
              />
            </div>
          </div>

          <hr className="text-muted opacity-25 mb-4" />

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light border text-dark"
              onClick={() => navigate('/utentes')}
              disabled={aGuardar}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-success px-4 shadow-sm" disabled={aGuardar}>
              <i className="bi bi-save me-2"></i> {aGuardar ? 'A guardar...' : 'Guardar Utente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoUtentePage;
