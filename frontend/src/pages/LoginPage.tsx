import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient';

// Página de autenticação. Os campos vêm pré-preenchidos com uma conta de teste
// (coordenador) só para facilitar o desenvolvimento/demonstração — não há aqui
// nenhuma validação de credenciais no frontend, isso é feito pelo backend.
export default function LoginPage() {
  const [email, setEmail] = useState('coordenador.teste@ulsba.invalid');
  const [password, setPassword] = useState('Teste@1234');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Submete as credenciais ao endpoint de login; se a API devolver um token,
  // guarda-o no localStorage (é lido pelo apiClient em pedidos seguintes) e
  // navega para a página principal. Em caso de erro mostra a mensagem da API.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const data = await apiFetch<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        navigate('/');
      }
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao efetuar login. Verifique as credenciais.';
      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm border-0 p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <h4 className="fw-bold text-success">Cuidados Domiciliários</h4>
          <p className="text-muted small">ULSBA - Autenticação na Plataforma</p>
        </div>

        {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-medium text-muted">E-mail</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-medium text-muted">Palavra-passe</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-success w-100 py-2 shadow-sm" disabled={loading}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}