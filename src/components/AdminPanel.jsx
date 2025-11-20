import { useState, useEffect } from 'react';
import authApi from '../utils/supabaseApi';
import { Button } from './Button'; // CORREÇÃO AQUI
import { Input } from './Input'; // CORREÇÃO AQUI

const AdminPanel = () => {
  const [keys, setKeys] = useState([]);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyIsAdmin, setNewKeyIsAdmin] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await authApi.listAccessKeys();
      if (response.success) {
        setKeys(response.keys || []);
      } else {
        setError(response.error || 'Falha ao buscar chaves');
      }
    } catch (err) {
      setError('Erro de rede ao buscar chaves');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!newKeyLabel) {
      setError('O rótulo da chave não pode estar vazio');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setGeneratedKey(null);
      const response = await authApi.generateAccessKey(newKeyLabel, newKeyIsAdmin);
      if (response.success) {
        setGeneratedKey(response.key);
        setNewKeyLabel('');
        setNewKeyIsAdmin(false);
        fetchKeys(); // Refresh the list
      } else {
        setError(response.error || 'Falha ao gerar chave');
      }
    } catch (err) {
      setError('Erro de rede ao gerar chave');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Tem certeza que deseja deletar esta chave?')) return;
    try {
      setLoading(true);
      const response = await authApi.deleteAccessKey(keyId);
      if (response.success) {
        fetchKeys(); // Refresh the list
      } else {
        setError(response.error || 'Falha ao deletar chave');
      }
    } catch (err) {
      setError('Erro de rede ao deletar chave');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Chave copiada para a área de transferência!');
    }, (err) => {
      alert('Falha ao copiar a chave.');
    });
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-white mb-6">Painel de Administração</h2>
      
      {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-md mb-4">{error}</p>}

      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <h3 className="text-xl text-white font-semibold mb-3">Gerar Nova Chave de Acesso</h3>
        <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-grow w-full">
            <label htmlFor="keyLabel" className="block text-sm font-medium text-gray-300 mb-1">Rótulo</label>
            <Input
              id="keyLabel"
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="Ex: Chave do Marketing"
              className="w-full bg-gray-800"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              id="isAdmin"
              type="checkbox"
              checked={newKeyIsAdmin}
              onChange={(e) => setNewKeyIsAdmin(e.target.checked)}
              className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-600"
            />
            <label htmlFor="isAdmin" className="text-gray-300">É Administrador?</label>
          </div>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Gerando...' : 'Gerar Chave'}
          </Button>
        </form>
        {generatedKey && (
          <div className="mt-4 p-3 bg-green-900/30 rounded-md flex justify-between items-center">
            <div>
              <p className="text-green-300">Chave gerada com sucesso!</p>
              <p className="text-lg font-mono text-white break-all">{generatedKey}</p>
            </div>
            <Button onClick={() => copyToClipboard(generatedKey)} variant="secondary">Copiar</Button>
          </div>
        )}
      </div>

      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-xl text-white font-semibold mb-3">Chaves de Acesso Existentes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rótulo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Admin</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Criada em</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-700 divide-y divide-gray-600">
              {keys.length > 0 ? keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{key.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{key.is_admin ? 'Sim' : 'Não'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(key.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button onClick={() => handleDeleteKey(key.id)} variant="danger" size="sm" disabled={loading}>
                      Deletar
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-400">Nenhuma chave encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
