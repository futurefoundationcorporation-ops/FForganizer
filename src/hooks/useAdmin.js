import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { useState, useEffect } from 'react';

// Hook para verificar se o usuário logado é um administrador.
// Ele busca o usuário atual e verifica sua existência na tabela 'admins'.
export const useAdmin = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  const { data: isAdmin, isLoading, error } = useQuery({
    queryKey: ['adminCheck', user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
        throw new Error(error.message);
      }

      return !!data;
    },
    enabled: !!user, // A query só é executada se houver um usuário.
  });

  return { isAdmin: isAdmin ?? false, isLoading, error };
};