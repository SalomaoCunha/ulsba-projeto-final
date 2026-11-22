import { Navigate, Outlet } from 'react-router-dom';

// Componente de guarda de rotas (usado como elemento de rota "pai" no router):
// se não houver token de autenticação guardado, redireciona para o login em
// vez de deixar passar para as rotas filhas; caso contrário renderiza o
// <Outlet /> para que as rotas protegidas (filhas desta no router) apareçam.
// Não recebe props — qualquer rota filha é protegida só por estar aninhada
// sob este componente na árvore de rotas.
export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}