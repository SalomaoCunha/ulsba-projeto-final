import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NovoUtentePage: React.FC = () => {
  const navigate = useNavigate();

  // Estado para guardar os dados do formulário (preparado para ser enviado para o backend)
  const [formData, setFormData] = useState({
    numeroUtente: '',
    nome: '',
    contacto: '',
  });

  // Função que atualiza o estado à medida que o utilizador escreve
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Função disparada ao clicar no botão Guardar
  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que a página recarregue ao submeter o formulário

    // =========================================================================
    // ⚠️ [ÁREA PREPARADA PARA INTEGRAÇÃO COM BACKEND / BASE DE DADOS]
    // =========================================================================
    // Colega que for fazer o Backend: Aqui é onde o sistema vai comunicar 
    // com a nossa base de dados (ex: Supabase, Firebase ou API própria).
    // O objeto "formData" já tem a informação toda estruturada em JSON.
    //
    // Exemplo de implementação futura:
    /*
      try {
        const response = await fetch('https://nossa-api.com/api/utentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          alert('Utente criado com sucesso na Base de Dados!');
          navigate('/utentes'); // Volta para a lista de utentes
        }
      } catch (erro) {
        console.error("Falha ao comunicar com a BD:", erro);
      }
    */
    // =========================================================================

    // Comportamento provisório (Frontend Mock) para testarmos agora:
    console.log("Dados empacotados e prontos para enviar para a BD:", formData);
    alert(`Simulação: Utente ${formData.nome} gravado com sucesso!\n(Vê a consola do browser para confirmar a estrutura JSON)`);
    navigate('/utentes');
  };

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4">
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

      <div className="card shadow-sm border-0 flex-grow-1 bg-white p-4">
        {/* Formulário ligado à função handleGuardar */}
        <form onSubmit={handleGuardar}>
          <h5 className="fw-bold text-dark mb-4"><i className="bi bi-person-lines-fill me-2"></i>Dados do Paciente</h5>
          
          <div className="row g-4 mb-4" style={{ maxWidth: '800px' }}>
            <div className="col-md-4">
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
            <div className="col-md-8">
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
            <div className="col-md-4">
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
          </div>

          <hr className="text-muted opacity-25 mb-4" />

          {/* Botões de Ação */}
          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              className="btn btn-light border text-dark"
              onClick={() => navigate('/utentes')}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-success px-4 shadow-sm">
              <i className="bi bi-save me-2"></i> Guardar Utente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoUtentePage;