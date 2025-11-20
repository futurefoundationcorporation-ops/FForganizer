import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useKeyboard } from '../hooks/useKeyboard'
import { useTheme } from '../hooks/useTheme'
import { useAdmin } from '../hooks/useAdmin'
import { db } from '../lib/firebase'
import {
  collection,
  query as fsQuery,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
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
  const [subfolders, setSubfolders] = useState([])
  const [prompts, setPrompts] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedSubfolder, setSelectedSubfolder] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Início' }])
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
    loadRootFolders()
  }, [user])

  useKeyboard({
    onNewFolder: () => setShowNewFolderModal(true),
    onNewPrompt: () => setShowNewPromptModal(true),
    onSearch: () => document.querySelector('input[type="text"]')?.focus(),
    onDelete: () => {
      if (selectedFolder) deleteFolder(selectedFolder)
    },
  })

  const loadLocalData = () => {}

  const saveLocalData = () => {}

  const loadRootFolders = async () => {
    const q = fsQuery(collection(db, 'folders'), where('parent_id', '==', null), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setFolders(items)
    setSubfolders([])
    setPrompts([])
    setSelectedFolder(null)
    setSelectedSubfolder(null)
    setBreadcrumbs([{ id: null, name: 'Início' }])
    setStats(prev => ({ ...prev, totalFolders: items.length }))
  }

  const loadSubfolders = async (parentId) => {
    const q = fsQuery(collection(db, 'folders'), where('parent_id', '==', parentId), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setSubfolders(items)
    setPrompts([])
    setStats(prev => ({ ...prev }))
  }

  const enterFolder = async (folder) => {
    const q = fsQuery(collection(db, 'folders'), where('parent_id', '==', folder.id), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const children = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }])
    if (children.length > 0) {
      setSelectedFolder(folder.id)
      setSelectedSubfolder(null)
      setSubfolders(children)
      setPrompts([])
    } else {
      setSelectedSubfolder(folder.id)
      setSelectedFolder(folder.parent_id || null)
      await loadPrompts(folder.id)
    }
  }

  const goToCrumb = async (index) => {
    const path = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(path)
    const target = path[path.length - 1]
    if (!target.id) {
      await loadRootFolders()
      return
    }
    const parentId = path.length >= 2 ? path[path.length - 2].id : null
    setSelectedFolder(parentId)
    const q = fsQuery(collection(db, 'folders'), where('parent_id', '==', target.id), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const children = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if (children.length > 0) {
      setSubfolders(children)
      setSelectedSubfolder(null)
      setPrompts([])
    } else {
      setSelectedSubfolder(target.id)
      await loadPrompts(target.id)
    }
  }

  const loadPrompts = async (folderId) => {
    const q = fsQuery(collection(db, 'prompts'), where('folder_id', '==', folderId), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setPrompts(data)
    const recent = data.filter(p => {
      const date = new Date(p.created_at)
      const now = new Date()
      return now - date < 7 * 24 * 60 * 60 * 1000
    })
    setStats(prev => ({ ...prev, totalPrompts: data.length, recentDays: recent.length }))
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    await addDoc(collection(db, 'folders'), {
      name: newFolderName,
      description: '',
      parent_id: selectedFolder || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    setNewFolderName('')
    setShowNewFolderModal(false)
    if (selectedFolder) {
      await loadSubfolders(selectedFolder)
    } else {
      await loadRootFolders()
    }
  }

  const deleteFolder = async (folderId) => {
    if (!confirm('Excluir esta pasta e todos os prompts dentro dela?')) return
    await deleteDoc(doc(db, 'folders', folderId))
    const ps = await getDocs(fsQuery(collection(db, 'prompts'), where('folder_id', '==', folderId)))
    await Promise.all(ps.docs.map(d => deleteDoc(doc(db, 'prompts', d.id))))
    if (selectedFolder === folderId) {
      setSelectedFolder(null)
      setSelectedSubfolder(null)
      await loadRootFolders()
    } else {
      if (selectedFolder) await loadSubfolders(selectedFolder)
      else await loadRootFolders()
    }
  }

  const createPrompt = async () => {
    if (!promptTitle.trim() || !promptContent.trim()) return

    const tags = promptTags.split(',').map(t => t.trim()).filter(Boolean)

    await addDoc(collection(db, 'prompts'), {
      title: promptTitle,
      content: promptContent,
      tags,
      folder_id: selectedSubfolder,
      version: 1,
      versions: [{ content: promptContent, created_at: new Date().toISOString() }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setPromptTitle('')
    setPromptContent('')
    setPromptTags('')
    setShowNewPromptModal(false)
    loadPrompts(selectedSubfolder)
  }

  const updatePrompt = async () => {
    if (!currentPrompt || !promptTitle.trim() || !promptContent.trim()) return

    const tags = promptTags.split(',').map(t => t.trim()).filter(Boolean)

    const pRef = doc(db, 'prompts', currentPrompt.id)
    const changedContent = promptContent !== currentPrompt.content
    const newVersions = changedContent
      ? [...(currentPrompt.versions || []), { content: promptContent, created_at: new Date().toISOString() }]
      : currentPrompt.versions || []
    await updateDoc(pRef, {
      title: promptTitle,
      content: promptContent,
      tags,
      updated_at: new Date().toISOString(),
      version: changedContent ? (Number(currentPrompt.version || 1) + 1) : currentPrompt.version || 1,
      versions: newVersions,
    })
    setCurrentPrompt(null)
    setPromptTitle('')
    setPromptContent('')
    setPromptTags('')
    setShowEditPromptModal(false)
    loadPrompts(selectedSubfolder)
  }

  const deletePrompt = async (promptId) => {
    if (!confirm('Excluir este prompt?')) return

    await deleteDoc(doc(db, 'prompts', promptId))
    loadPrompts(selectedSubfolder)
  }

  const openEditPrompt = (prompt) => {
    setCurrentPrompt(prompt)
    setPromptTitle(prompt.title)
    setPromptContent(prompt.content)
    setPromptTags(prompt.tags?.join(', ') || '')
    setShowEditPromptModal(true)
  }

  const viewVersions = async (prompt) => {
    setVersions([...prompt.versions || []].reverse())
    setCurrentPrompt(prompt)
    setShowVersionsModal(true)
  }

  const restoreVersion = async (version) => {
    if (!confirm('Restaurar esta versão?')) return

    const pRef = doc(db, 'prompts', currentPrompt.id)
    const nextVersions = [...(currentPrompt.versions || []), { content: version.content, created_at: new Date().toISOString() }]
    await updateDoc(pRef, {
      content: version.content,
      updated_at: new Date().toISOString(),
      version: Number(currentPrompt.version || 1) + 1,
      versions: nextVersions,
    })
    setShowVersionsModal(false)
    loadPrompts(selectedSubfolder)
  }

  const sharePrompt = async (prompt) => {
    const created = await addDoc(collection(db, 'shared_links'), {
      prompt_id: currentPrompt?.id || prompt.id,
      created_at: serverTimestamp(),
      expires_at: null,
    })
    const url = `${window.location.origin}/share/${created.id}`
    setShareUrl(url)
    setShowShareModal(true)
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

    for (const folder of data.folders) {
      await importFolderAndPrompts(folder)
    }

    await loadRootFolders()
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
            <h2 className="text-2xl font-bold">
              {selectedFolder ? 'Subpastas' : 'Pastas Raiz'}
            </h2>
            <div className="flex gap-3">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                {breadcrumbs.map((bc, idx) => (
                  <button
                    key={bc.id ?? 'root'}
                    onClick={() => goToCrumb(idx)}
                    className="hover:text-primary"
                  >
                    {bc.name}
                  </button>
                )).reduce((acc, el, i) => acc.concat(i ? [<span key={`sep-${i}`}>/</span>, el] : [el]), [])}
              </nav>
              <Button onClick={() => setShowNewFolderModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              {selectedFolder ? 'Nova Subpasta' : 'Nova Pasta'}
            </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(selectedFolder ? subfolders : folders).map(folder => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onClick={() => enterFolder(folder)}
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
              {selectedSubfolder ? 'Prompts da Subpasta' : 'Selecione uma subpasta para ver os prompts'}
            </h2>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              {selectedSubfolder && (
              <Button onClick={() => setShowNewPromptModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Prompt
              </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts
              .filter(p => !selectedSubfolder || p.folder_id === selectedSubfolder)
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
          {selectedSubfolder && filteredPrompts.filter(p => p.folder_id === selectedSubfolder).length === 0 && (
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
  async function importFolderAndPrompts(folder) {
    const folderDoc = doc(db, 'folders', folder.id)
    await updateDoc(folderDoc, {}).catch(async () => {})
    await updateDoc(folderDoc, {
      name: folder.name,
      description: folder.description || '',
      parent_id: folder.parent_id ?? null,
      created_at: folder.createdAt ? new Date(folder.createdAt).toISOString() : new Date().toISOString(),
      updated_at: folder.updatedAt ? new Date(folder.updatedAt).toISOString() : new Date().toISOString(),
    }).catch(async () => {
      await setDoc(folderDoc, {
        name: folder.name,
        description: folder.description || '',
        parent_id: folder.parent_id ?? null,
        created_at: folder.createdAt ? new Date(folder.createdAt).toISOString() : new Date().toISOString(),
        updated_at: folder.updatedAt ? new Date(folder.updatedAt).toISOString() : new Date().toISOString(),
      })
    })

    if (folder.prompts && Array.isArray(folder.prompts)) {
      for (const prompt of folder.prompts) {
        const promptDoc = doc(db, 'prompts', prompt.id)
        await setDoc(promptDoc, {
          title: prompt.title,
          content: prompt.content,
          tags: prompt.tags || [],
          folder_id: folder.id,
          version: 1,
          versions: [{ content: prompt.content, created_at: prompt.createdAt || new Date().toISOString() }],
          created_at: prompt.createdAt || new Date().toISOString(),
          updated_at: prompt.updatedAt || new Date().toISOString(),
        })
      }
    }
  }
