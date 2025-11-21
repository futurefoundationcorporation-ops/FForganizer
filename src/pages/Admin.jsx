import React from 'react';
import { useAdmin } from '../hooks/useAdmin';
import AccessKeysList from '../components/AccessKeysList';
import CreateAccessKey from '../components/CreateAccessKey'; // Importa o componente de criação

// Página de Administração com funcionalidades de visualização e criação de chaves.
const Admin = () => {
  const { isAdmin, isLoading, error } = useAdmin();

  if (isLoading) {
    return <div>Verificando permissões...</div>;
  }

  if (error) {
    return <div>Erro ao verificar permissões: {error.message}</div>;
  }

  if (!isAdmin) {
    return <div>Acesso negado. Você não tem permissão para acessar esta página.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Painel de Administração</h1>
      <p className="mt-2">Gere e gerencie as chaves de acesso para a sua aplicação.</p>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <CreateAccessKey />
        </div>
        <div>
          <AccessKeysList />
        </div>
      </div>
    </div>
  );
};

export default Admin;
