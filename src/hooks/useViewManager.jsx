import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// O cérebro do nosso sistema de visualização.
export function useViewManager() {
  // Estado para o modo de visualização preferido. Padrão: 'columns'.
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'columns';
  });

  // Estado para a seleção atual do usuário.
  const [selection, setSelection] = useState({
    folderId: null,
    subfolderId: null,
  });

  // Função para buscar as pastas do novo endpoint da Supabase Edge Function
  const fetchFolders = async () => {
    const startTime = performance.now();
    // console.log("useViewManager: Iniciando fetchFolders da Supabase Edge Function.");
    try {
      // É CRÍTICO que VITE_SUPABASE_FUNCTIONS_URL esteja configurada no seu ambiente
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/fetch-folders`);

      const endTime = performance.now();
      const latency = endTime - startTime;

      if (latency > 500) {
        console.warn(`[FRONTEND PERFORMANCE WARNING] fetchFolders demorou ${latency.toFixed(2)}ms`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const foldersData = await response.json();
      // console.log("useViewManager: Pastas carregadas com sucesso da Edge Function:", foldersData);
      return foldersData;
    } catch (err) {
      // console.error("useViewManager: Erro ao buscar pastas da Edge Function:", err);
      throw err; // Re-lança o erro para o React Query lidar
    }
  };

  // Usando useQuery para gerenciar o estado de carregamento, cache e erros
  const { data: allFolders, isLoading, error } = useQuery({
    queryKey: ['allFolders'],
    queryFn: fetchFolders,
    staleTime: 60 * 1000, // Dados considerados "frescos" por 1 minuto (SWR)
    gcTime: 10 * 60 * 1000, // Dados permanecem no cache por 10 minutos (antigo cacheTime)
    retry: 3, // Tenta 3 vezes antes de falhar
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Efeito para salvar a preferência de visualização no localStorage.
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Funções para manipular a seleção, encapsuladas com useCallback para performance.
  const selectFolder = useCallback((folderId) => {
    setSelection(prev => ({ ...prev, folderId: folderId, subfolderId: null }));
  }, []);

  const selectSubfolder = useCallback((subfolderId) => {
    setSelection(prev => ({ ...prev, subfolderId: subfolderId }));
  }, []);

  // Retorna tudo o que os componentes da UI precisarão.
  return {
    viewMode,
    setViewMode,
    allFolders: allFolders || [], // Garante que seja um array vazio quando undefined/loading
    isLoading, // O loading state será tratado de forma otimista/silenciosa na UI se houver dados em cache
    error,
    selection,
    selectFolder,
    selectSubfolder,
  };
}
