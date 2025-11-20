import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useKeyboard } from '../hooks/useKeyboard'
import { useTheme } from '../hooks/useTheme'
import { useAdmin } from '../hooks/useAdmin'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { FolderCard } from '../components/FolderCard'
import { PromptCard } from '../components/PromptCard'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { exportData, parseImportData } from '../utils/export'
import { generateShareToken, getShareUrl, copyToClipboard } from '../utils/sharing'
import { 
  Plus, LogOut, Sun, Moon, Download, Upload, 
  Sparkles, Star, FileText, Folder as FolderIcon, AlertCircle, Shield
} from 'lucide-react'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()
  const [folders, setFolders] = useState([])
  const [prompts, setPrompts] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ totalFolders: 0, totalPrompts: 0, recentDays: 0 })
  
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [showNewPromptModal, setShowNewPromptModal] = useState(false)
  const [showEditPromptModal, setShowEditPromptModal] = useState(false)
  const [showVersionsModal, setShowVersionsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  
  const [newFolderName, setNewFolderName] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [promptTitle, setPromptTitle] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [promptTags, setPromptTags] = useState('')
  const [versions, setVersions] = useState([])
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (isSupabaseConfigured) {
      loadFolders()
      loadPrompts()
    } else {
      loadLocalData()
    }
  }, [user])

  useKeyboard({
    onNewFolder: () => setShowNewFolderModal(true),
    onNewPrompt: () => setShowNewPromptModal(true),
    onSearch: () => document.querySelector('input[type="text"]')?.focus(),
    onDelete: () => {
      if (selectedFolder) deleteFolder(selectedFolder)
    },
  })

  const loadLocalData = () => {
    const localFolders = JSON.parse(localStorage.getItem('folders') || '[]')
    const localPrompts = JSON.parse(localStorage.getItem('prompts') || '[]')
    setFolders(localFolders)
    setPrompts(localPrompts)
    setStats({ 
      totalFolders: localFolders.length, 
      totalPrompts: localPrompts.length,
      recentDays: localPrompts.filter(p => {
        const date = new Date(p.created_at)
        const now = new Date()
        const diff = now - date
        return diff < 7 * 24 * 60 * 60 * 1000
      }).length
    })
  }

  const saveLocalData = (newFolders, newPrompts) => {
    localStorage.setItem('folders', JSON.stringify(newFolders))
    localStorage.setItem('prompts', JSON.stringify(newPrompts))
  }

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*, prompts(count)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const foldersWithCount = data.map(folder => ({
        ...folder,
        prompt_count: folder.prompts?.[0]?.count || 0
      }))
      setFolders(foldersWithCount)
      setStats(prev => ({ ...prev, totalFolders: data.length }))
    }
  }

  const loadPrompts = async (folderId = null) => {
    let query = supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data, error } = await query

    if (!error && data) {
      setPrompts(data)
      const recent = data.filter(p => {
        const date = new Date(p.created_at)
        const now = new Date()
        const diff = now - date
        return diff < 7 * 24 * 60 * 60 * 1000
      })
      setStats(prev => ({ ...prev, totalPrompts: data.length, recentDays: recent.length }))
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      user_id: user.id,
      created_at: new Date().toISOString(),
      prompt_count: 0
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName, user_id: user.id }])

      if (!error) {
        setNewFolderName('')
        setShowNewFolderModal(false)
        loadFolders()
      }
    } else {
      const newFolders = [...folders, newFolder]
      setFolders(newFolders)
      saveLocalData(newFolders, prompts)
      setNewFolderName('')
      setShowNewFolderModal(false)
    }
  }

  const deleteFolder = async (folderId) => {
    if (!confirm('Excluir esta pasta e todos os prompts dentro dela?')) return

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)

      if (!error) {
        loadFolders()
        if (selectedFolder === folderId) {
          setSelectedFolder(null)
          loadPrompts()
        }
      }
    } else {
      const newFolders = folders.filter(f => f.id !== folderId)
      const newPrompts = prompts.filter(p => p.folder_id !== folderId)
      setFolders(newFolders)
      setPrompts(newPrompts)
      saveLocalData(newFolders, newPrompts)
      if (selectedFolder === folderId) {
        setSelectedFolder(null)
      }
    }
  }

  const createPrompt = async () => {
    if (!promptTitle.trim() || !promptContent.trim()) return

    const tags = promptTags.split(',').map(t => t.trim()).filter(Boolean)

    const newPrompt = {
      id: Date.now().toString(),
      title: promptTitle,
      content: promptContent,
      tags,
      folder_id: selectedFolder,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('prompts')
        .insert([{
          title: promptTitle,
          content: promptContent,
          tags,
          folder_id: selectedFolder,
          user_id: user.id
        }])
        .select()

      if (!error && data) {
        await supabase
          .from('prompt_versions')
          .insert([{
            prompt_id: data[0].id,
            content: promptContent
          }])

        setPromptTitle('')
        setPromptContent('')
        setPromptTags('')
        setShowNewPromptModal(false)
        loadPrompts(selectedFolder)
      }
    } else {
      const newPrompts = [...prompts, newPrompt]
      setPrompts(newPrompts)
      saveLocalData(folders, newPrompts)
      setPromptTitle('')
      setPromptContent('')
      setPromptTags('')
      setShowNewPromptModal(false)
    }
  }

  const updatePrompt = async () => {
    if (!currentPrompt || !promptTitle.trim() || !promptContent.trim()) return

    const tags = promptTags.split(',').map(t => t.trim()).filter(Boolean)

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('prompts')
        .update({
          title: promptTitle,
          content: promptContent,
          tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPrompt.id)

      if (!error) {
        if (promptContent !== currentPrompt.content) {
          await supabase
            .from('prompt_versions')
            .insert([{
              prompt_id: currentPrompt.id,
              content: promptContent
            }])
        }

        setCurrentPrompt(null)
        setPromptTitle('')
        setPromptContent('')
        setPromptTags('')
        setShowEditPromptModal(false)
        loadPrompts(selectedFolder)
      }
    } else {
      const newPrompts = prompts.map(p => 
        p.id === currentPrompt.id 
          ? { ...p, title: promptTitle, content: promptContent, tags, updated_at: new Date().toISOString() }
          : p
      )
      setPrompts(newPrompts)
      saveLocalData(folders, newPrompts)
      setCurrentPrompt(null)
      setPromptTitle('')
      setPromptContent('')
      setPromptTags('')
      setShowEditPromptModal(false)
    }
  }

  const deletePrompt = async (promptId) => {
    if (!confirm('Excluir este prompt?')) return

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)

      if (!error) {
        loadPrompts(selectedFolder)
      }
    } else {
      const newPrompts = prompts.filter(p => p.id !== promptId)
      setPrompts(newPrompts)
      saveLocalData(folders, newPrompts)
    }
  }

  const openEditPrompt = (prompt) => {
    setCurrentPrompt(prompt)
    setPromptTitle(prompt.title)
    setPromptContent(prompt.content)
    setPromptTags(prompt.tags?.join(', ') || '')
    setShowEditPromptModal(true)
  }

  const viewVersions = async (prompt) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', prompt.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setVersions(data)
        setCurrentPrompt(prompt)
        setShowVersionsModal(true)
      }
    } else {
      alert('Versionamento disponível apenas com Supabase configurado')
    }
  }

  const restoreVersion = async (version) => {
    if (!confirm('Restaurar esta versão?')) return

    const { error } = await supabase
      .from('prompts')
      .update({ content: version.content, updated_at: new Date().toISOString() })
      .eq('id', currentPrompt.id)

    if (!error) {
      await supabase
        .from('prompt_versions')
        .insert([{
          prompt_id: currentPrompt.id,
          content: version.content
        }])

      setShowVersionsModal(false)
      loadPrompts(selectedFolder)
    }
  }

  const sharePrompt = async (prompt) => {
    if (isSupabaseConfigured) {
      const token = generateShareToken()
      const { error } = await supabase
        .from('share_tokens')
        .insert([{
          prompt_id: prompt.id,
          token
        }])

      if (!error) {
        const url = getShareUrl(token)
        setShareUrl(url)
        setShowShareModal(true)
      }
    } else {
      alert('Compartilhamento disponível apenas com Supabase configurado')
    }
  }

  const handleExport = async () => {
    await exportData(folders, prompts)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const text = await file.text()
    const { data, error } = parseImportData(text)

    if (error) {
      alert(error)
      return
    }

    if (isSupabaseConfigured) {
      for (const folder of data.folders) {
        await supabase
          .from('folders')
          .insert([{ name: folder.name, user_id: user.id }])
      }

      for (const prompt of data.prompts) {
        await supabase
          .from('prompts')
          .insert([{ ...prompt, user_id: user.id }])
      }

      loadFolders()
      loadPrompts()
    } else {
      const newFolders = [...folders, ...data.folders.map(f => ({ ...f, id: Date.now().toString() + Math.random(), user_id: user.id }))]
      const newPrompts = [...prompts, ...data.prompts.map(p => ({ ...p, id: Date.now().toString() + Math.random(), user_id: user.id }))]
      setFolders(newFolders)
      setPrompts(newPrompts)
      saveLocalData(newFolders, newPrompts)
    }
  }

  const filteredPrompts = prompts.filter(prompt => {
    const query = searchQuery.toLowerCase()
    return (
      prompt.title.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query) ||
      prompt.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Prompt Manager Ultra</h1>
                <p className="text-xs text-muted-foreground">Chave: {user?.accessKey}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                  className="text-primary hover:text-primary"
                >
                  <Shield className="w-5 h-5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="w-5 h-5" />
              </Button>
              <label>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                <Button variant="ghost" size="sm" as="span">
                  <Upload className="w-5 h-5" />
                </Button>
              </label>
              <Button variant="secondary" size="sm" onClick={signOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning">Modo Local Ativo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os dados estão sendo salvos localmente no navegador. Configure o Supabase para sincronização em nuvem, versionamento e compartilhamento.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-primary/20 rounded-xl p-6 shadow-glow">
            <div className="flex items-center gap-3 mb-2">
              <FolderIcon className="w-6 h-6 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">Total de Pastas</h3>
            </div>
            <p className="text-4xl font-bold">{stats.totalFolders}</p>
          </div>
          <div className="bg-card border border-secondary/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-secondary" />
              <h3 className="text-sm font-medium text-muted-foreground">Total de Prompts</h3>
            </div>
            <p className="text-4xl font-bold">{stats.totalPrompts}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-warning" />
              <h3 className="text-sm font-medium text-muted-foreground">Novos (7 dias)</h3>
            </div>
            <p className="text-4xl font-bold">{stats.recentDays}</p>
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Minhas Pastas</h2>
            <Button onClick={() => setShowNewFolderModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Nova Pasta
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map(folder => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onClick={() => {
                  setSelectedFolder(folder.id)
                  if (isSupabaseConfigured) {
                    loadPrompts(folder.id)
                  } else {
                    setSearchQuery('')
                  }
                }}
                onDelete={deleteFolder}
                isActive={selectedFolder === folder.id}
              />
            ))}
          </div>
          {folders.length === 0 && (
            <div className="text-center py-12">
              <FolderIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma pasta criada ainda</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">
              {selectedFolder ? 'Prompts da Pasta' : 'Todos os Prompts'}
            </h2>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <Button onClick={() => setShowNewPromptModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Prompt
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts
              .filter(p => !selectedFolder || p.folder_id === selectedFolder)
              .map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onClick={() => openEditPrompt(prompt)}
                  onDelete={deletePrompt}
                  onShare={sharePrompt}
                  onViewVersions={viewVersions}
                />
              ))}
          </div>
          {filteredPrompts.filter(p => !selectedFolder || p.folder_id === selectedFolder).length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum prompt encontrado</p>
            </div>
          )}
        </section>
      </main>

      <Modal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        title="Nova Pasta"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome da Pasta</label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: Geração de Vídeo"
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            />
          </div>
          <Button onClick={createFolder} className="w-full">
            Criar Pasta
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showNewPromptModal}
        onClose={() => setShowNewPromptModal(false)}
        title="Novo Prompt"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <Input
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder="Ex: Script de vídeo comercial"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Conteúdo</label>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              className="w-full h-40 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Escreva seu prompt aqui..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tags (separadas por vírgula)</label>
            <Input
              value={promptTags}
              onChange={(e) => setPromptTags(e.target.value)}
              placeholder="vídeo, comercial, marketing"
            />
          </div>
          <Button onClick={createPrompt} className="w-full">
            Criar Prompt
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showEditPromptModal}
        onClose={() => setShowEditPromptModal(false)}
        title="Editar Prompt"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <Input
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Conteúdo</label>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              className="w-full h-40 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tags (separadas por vírgula)</label>
            <Input
              value={promptTags}
              onChange={(e) => setPromptTags(e.target.value)}
            />
          </div>
          <Button onClick={updatePrompt} className="w-full">
            Salvar Alterações
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        title="Versões do Prompt"
      >
        <div className="space-y-3">
          {versions.map((version, idx) => (
            <div key={version.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Versão {versions.length - idx}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(version.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {version.content}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => restoreVersion(version)}
              >
                Restaurar
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Compartilhar Prompt"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copie o link abaixo para compartilhar este prompt:
          </p>
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly />
            <Button
              onClick={() => {
                copyToClipboard(shareUrl)
                alert('Link copiado!')
              }}
            >
              Copiar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
