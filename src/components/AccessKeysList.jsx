import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

// Componente para listar e gerenciar as chaves de acesso.
const AccessKeysList = () => {
  const queryClient = useQueryClient();

  const { data: keys, isLoading, error } = useQuery({
    queryKey: ['accessKeys'],
    queryFn: async () => {
      const { data, error } = await supabase.from('access_keys').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (keyId) => {
      const { data, error } = await supabase
        .from('access_keys')
        .update({ is_revoked: true })
        .eq('id', keyId);

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKeys'] });
    },
  });

  if (isLoading) return <div>Carregando chaves...</div>;
  if (error) return <div>Erro ao carregar chaves: {error.message}</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold">Chaves de Acesso Existentes</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b text-left">Chave</th>
              <th className="px-4 py-2 border-b text-left">Status</th>
              <th className="px-4 py-2 border-b text-left">Criada em</th>
              <th className="px-4 py-2 border-b text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td className="px-4 py-2 border-b font-mono text-sm">{key.key}</td>
                <td className="px-4 py-2 border-b">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${key.is_revoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {key.is_revoked ? 'Revogada' : 'Ativa'}
                  </span>
                </td>
                <td className="px-4 py-2 border-b text-sm">{new Date(key.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 border-b">
                  {!key.is_revoked && (
                    <button
                      onClick={() => mutation.mutate(key.id)}
                      disabled={mutation.isLoading}
                      className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400"
                    >
                      Revogar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mutation.isError && (
        <div className="mt-2 text-red-500">Erro ao revogar chave: {mutation.error.message}</div>
      )}
      </div>
    </div>
  );
};

export default AccessKeysList;
