import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useAdmin } from '../hooks/useAdmin'
import { useViewManager } from '../hooks/useViewManager'
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

// Import Components
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { PromptCard } from '../components/PromptCard'
import { FolderSkeletonLoader } from '../components/Skeleton'

// Import Views
import { ColumnsView } from '../views/ColumnsView'

// Import Icons
import {
  Plus, LogOut, Sun, Moon, Download, Upload,
  Sparkles, Star, FileText, Folder as FolderIcon, Shield, Settings, Columns, ListTree, SquareStack
} from 'lucide-react'

// Placeholder view components for future implementation
const TreeView = () => (
  <div className="p-8 bg-card rounded-lg border border-dashed border-secondary/50">
    <h2 className="text-xl font-bold text-secondary mb-4">Visualização em Árvore (Em Breve)</h2>
    <p className="text-muted-foreground">Esta área irá conter a visualização de pastas e subpastas em formato de árvore expansível.</p>
  </div>
);
const SimpleView = () => (
  <div className="p-8 bg-card rounded-lg border border-dashed border-border">
    <h2 className="text-xl font-bold mb-4">Visualização Simples (Em Breve)</h2>
    <p className="text-muted-foreground">Esta área irá conter a navegação original, passo a passo, focada na simplicidade.</p>
  </div>
);




export function Dashboard() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()

  const {
    viewMode,
    setViewMode,
    allFolders,
    isLoading,
    selection,
    selectFolder,
    selectSubfolder
  } = useViewManager()

  const [prompts, setPrompts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ totalFolders: 0, totalPrompts: 0, recentDays: 0 })

  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [showNewPromptModal, setShowNewPromptModal] = useState(false)
  const [showEditPromptModal, setShowEditPromptModal] = useState(false)

  const [newFolderName, setNewFolderName] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [promptTitle, setPromptTitle] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [promptTags, setPromptTags] = useState('')

  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (selection.subfolderId) {
      loadPrompts(selection.subfolderId)
    } else {
      setPrompts([])
    }
  }, [selection.subfolderId])

  useEffect(() => {
    const totalFolders = allFolders.length
    // This will be improved to count all prompts in the future
    const totalPromptsCount = allFolders.reduce((acc, folder) => acc + (folder.promptCount || 0), 0);

    setStats({ totalFolders, totalPrompts: totalPromptsCount, recentDays: 0 })
  }, [allFolders])

  const loadPrompts = async (folderId) => {
    const q = fsQuery(collection(db, 'prompts'), where('folder_id', '==', folderId), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setPrompts(data)
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    await addDoc(collection(db, 'folders'), {
      name: newFolderName,
      description: '',
      parent_id: selection.folderId || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    setNewFolderName('')
    setShowNewFolderModal(false)
    window.location.reload() // Temp refresh
  }

  const createPrompt = async () => {
    if (!promptTitle.trim() || !promptContent.trim()) return
    const tags = promptTags.split(',').map(t => t.trim()).filter(Boolean)
    await addDoc(collection(db, 'prompts'), {
      title: promptTitle,
      content: promptContent,
      tags,
      folder_id: selection.subfolderId,
      version: 1,
      versions: [{ content: promptContent, created_at: new Date().toISOString() }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setPromptTitle(''); setPromptContent(''); setPromptTags('');
    setShowNewPromptModal(false)
    loadPrompts(selection.subfolderId)
  }

  const filteredPrompts = prompts.filter(prompt => {
    const query = searchQuery.toLowerCase()
    return (
      prompt.title.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query) ||
      prompt.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const renderCurrentView = () => {
    const props = { allFolders, selection, selectFolder, selectSubfolder };
    switch (viewMode) {
      case 'columns':
        return <ColumnsView {...props} />;
      case 'tree':
        return <TreeView {...props} />;
      case 'simple':
        return <SimpleView {...props} />;
      default:
        return <ColumnsView {...props} />;
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary"><Sparkles className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-2xl font-bold">Prompt Manager Ultra</h1></div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-primary hover:text-primary">
                  <Shield className="w-5 h-5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="w-5 h-5" />
                </Button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">Modo de Exibição</p>
                      <button onClick={() => { setViewMode('columns'); setShowSettings(false); }} className={`w-full flex items-center gap-2 text-left text-sm p-2 rounded-md hover:bg-muted ${viewMode === 'columns' ? 'text-primary' : ''}`}>
                        <Columns className="w-4 h-4" /> Colunas
                      </button>
                      <button onClick={() => { setViewMode('tree'); setShowSettings(false); }} className={`w-full flex items-center gap-2 text-left text-sm p-2 rounded-md hover:bg-muted ${viewMode === 'tree' ? 'text-primary' : ''}`}>
                        <ListTree className="w-4 h-4" /> Árvore
                      </button>
                      <button onClick={() => { setViewMode('simple'); setShowSettings(false); }} className={`w-full flex items-center gap-2 text-left text-sm p-2 rounded-md hover:bg-muted ${viewMode === 'simple' ? 'text-primary' : ''}`}>
                        <SquareStack className="w-4 h-4" /> Simples
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={signOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Navegação</h2>
          <div className="flex gap-3">
            <Button onClick={() => setShowNewFolderModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              {selection.folderId ? 'Nova Subpasta' : 'Nova Pasta'}
            </Button>
          </div>
        </div>

        {isLoading ? <FolderSkeletonLoader /> : renderCurrentView()}

        {selection.subfolderId && (
          <section className="mt-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Prompts</h2>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                {selection.subfolderId && (
                  <Button onClick={() => setShowNewPromptModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Prompt
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map(prompt => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
            {prompts.length === 0 && !isLoading && (
              <div className="text-center py-12 col-span-full">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum prompt nesta subpasta.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      <Modal isOpen={showNewFolderModal} onClose={() => setShowNewFolderModal(false)} title={selection.folderId ? "Nova Subpasta" : "Nova Pasta"}>
        <div className="space-y-4">
          <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createFolder()} placeholder="Nome da pasta..." />
          <Button onClick={createFolder} className="w-full">Criar</Button>
        </div>
      </Modal>

      <Modal isOpen={showNewPromptModal} onClose={() => setShowNewPromptModal(false)} title="Novo Prompt">
        <div className="space-y-4">
          <Input value={promptTitle} onChange={(e) => setPromptTitle(e.target.value)} placeholder="Título do prompt..." />
          <textarea value={promptContent} onChange={(e) => setPromptContent(e.target.value)} className="w-full h-40 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none" placeholder="Conteúdo do prompt..." />
          <Input value={promptTags} onChange={(e) => setPromptTags(e.target.value)} placeholder="Tags separadas por vírgula..." />
          <Button onClick={createPrompt} className="w-full">Criar Prompt</Button>
        </div>
      </Modal>
    </div>
  )
}
