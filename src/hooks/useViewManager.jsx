import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// O cérebro do nosso sistema de visualização.
export function useViewManager() {
  // Estado para o modo de visualização preferido. Padrão: 'columns'.
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'columns';
  });

  // Estado para armazenar TODAS as pastas, carregadas de uma só vez.
  const [allFolders, setAllFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New state to capture errors

  // Estado para a seleção atual do usuário.
  const [selection, setSelection] = useState({
    folderId: null,
    subfolderId: null,
  });

  // Efeito para buscar todos os dados de pastas na montagem.
  useEffect(() => {
    console.log("useViewManager: Iniciando fetchAllFolders.");
    const fetchAllFolders = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        console.log("useViewManager: Consultando coleção 'folders'...");
        const q = query(collection(db, 'folders'), orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        const foldersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("useViewManager: Pastas carregadas com sucesso:", foldersData);
        setAllFolders(foldersData);
      } catch (err) {
        console.error("useViewManager: Erro ao buscar pastas:", err);
        setError(err); // Set error state
      } finally {
        setLoading(false);
        console.log("useViewManager: fetchAllFolders finalizado. Loading: ", false);
      }
    };

    fetchAllFolders();
  }, []);

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
    allFolders,
    loading,
    error, // Expose error state
    selection,
    selectFolder,
    selectSubfolder,
  };
}
