import { useState, useEffect } from 'react'
import { generateAccessKey, listAccessKeys, deleteAccessKey } from '../utils/authApi'
import { copyToClipboard } from '../utils/sharing'
import { Key, Copy, Trash2, Plus, Check, AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'
import { useAuth } from '../hooks/useAuth'

export function AdminPanel() {
  const { user } = useAuth()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [generatedKey, setGeneratedKey] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadKeys()
  }, [user])

  function formatDate(dateValue) {
    const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue?.toDate?.() || new Date()
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function loadKeys() {
    if (!user || !user.isAdmin) {
      setError('Você precisa estar autenticado como admin')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      const result = await listAccessKeys()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar chaves')
      }

      setKeys(result.keys || [])
    } catch (err) {
      console.error('Error loading keys:', err)
      setError(err.message || 'Erro ao carregar chaves. Verifique se você é administrador.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateKey() {
    if (!user || !user.isAdmin) {
      setError('Você precisa estar autenticado como admin')
      return
    }
    
    try {
      setError(null)
      
      const result = await generateAccessKey(newKeyLabel || null, false)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar chave')
      }

      setGeneratedKey(result.key)
      setNewKeyLabel('')
      await loadKeys()
    } catch (err) {
      console.error('Error generating key:', err)
      setError(err.message || 'Erro ao gerar chave. Verifique suas permissões.')
    }
  }

  async function handleDeleteKey(keyId) {
    if (!confirm('Tem certeza que deseja excluir esta chave?')) return
    
    if (!user || !user.isAdmin) {
      setError('Você precisa estar autenticado como admin')
      return
    }

    try {
      const result = await deleteAccessKey(keyId)

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar chave')
      }

      await loadKeys()
    } catch (err) {
      console.error('Error deleting key:', err)
      setError(err.message || 'Erro ao excluir chave.')
    }
  }

  async function handleCopyKey(key) {
    try {
      await copyToClipboard(key)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error('Error copying key:', err)
    }
  }

  function closeNewKeyModal() {
    setShowNewKeyModal(false)
    setNewKeyLabel('')
    setGeneratedKey(null)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel de Administração</h1>
              <p className="text-muted-foreground">Gerenciamento de chaves de acesso</p>
            </div>
          </div>
          <Button onClick={() => setShowNewKeyModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Gerar Nova Chave
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-4">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Carregando chaves...</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma chave criada</h3>
          <p className="text-muted-foreground mb-6">
            Comece gerando sua primeira chave de acesso
          </p>
          <Button onClick={() => setShowNewKeyModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Gerar Primeira Chave
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((keyItem) => (
            <div
              key={keyItem.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Key className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {keyItem.label && (
                      <p className="font-medium mb-1">{keyItem.label}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {keyItem.is_admin ? 'Chave Administrativa' : 'Chave de Acesso'} (hash protegido)
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Criada em {formatDate(keyItem.created_at)}</span>
                  {keyItem.last_used_at && (
                    <span>Último uso: {formatDate(keyItem.last_used_at)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleDeleteKey(keyItem.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  title="Excluir chave"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewKeyModal && (
        <Modal onClose={closeNewKeyModal}>
          <div className="p-6">
            {!generatedKey ? (
              <>
                <h2 className="text-xl font-bold mb-4">Gerar Nova Chave de Acesso</h2>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Rótulo (opcional)
                  </label>
                  <Input
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    placeholder="Ex: Produção, Desenvolvimento, Cliente X..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use um rótulo descritivo para identificar esta chave
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={closeNewKeyModal} variant="secondary" className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleGenerateKey} className="flex-1">
                    <Key className="w-4 h-4 mr-2" />
                    Gerar Chave
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Chave Gerada com Sucesso!</h2>
                  <p className="text-muted-foreground">
                    Copie e guarde esta chave em um local seguro
                  </p>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-destructive font-semibold mb-2">
                    ⚠️ ATENÇÃO: Esta chave só será exibida uma vez!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Por segurança, chaves são armazenadas em formato hash com salt. Se você perder esta chave, 
                    precisará gerar uma nova.
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <p className="text-xs text-muted-foreground mb-2">Sua nova chave:</p>
                  <code className="block text-sm font-mono break-all bg-background p-3 rounded border border-border">
                    {generatedKey}
                  </code>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleCopyKey(generatedKey)} 
                    variant="secondary" 
                    className="flex-1"
                  >
                    {copiedKey === generatedKey ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Chave
                      </>
                    )}
                  </Button>
                  <Button onClick={closeNewKeyModal} className="flex-1">
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
