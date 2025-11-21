import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Componente para criar uma nova chave de acesso.
// Gera um UUIDv4 e o insere na tabela 'access_keys'.
const CreateAccessKey = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const newKey = uuidv4();
      const { data, error } = await supabase
        .from('access_keys')
        .insert([{ key: newKey, is_revoked: false }])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalida a query de chaves de acesso para forçar um refetch e atualizar a lista.
      queryClient.invalidateQueries({ queryKey: ['accessKeys'] });
    },
  });

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold">Gerar Nova Chave</h2>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isLoading}
        className="mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark disabled:bg-gray-400"
      >
        {mutation.isLoading ? 'Gerando...' : 'Gerar Nova Chave de Acesso'}
      </button>
      {mutation.isError && (
        <div className="mt-2 text-red-500">Erro ao gerar chave: {mutation.error.message}</div>
      )}
    </div>
  );
};

export default CreateAccessKey;
