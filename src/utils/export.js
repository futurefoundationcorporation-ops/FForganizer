export async function exportData(folders, prompts) {
  const foldersById = new Map(folders.map(f => [f.id, f]))
  const grouped = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    description: folder.description || '',
    createdAt: folder.created_at || new Date().toISOString(),
    updatedAt: folder.updated_at || new Date().toISOString(),
    prompts: (prompts || []).filter(p => p.folder_id === folder.id).map(p => ({
      id: p.id,
      folderId: p.folder_id,
      title: p.title,
      theme: '',
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
      tags: p.tags || [],
      originalText: null,
      content: p.content,
    }))
  }))

  const data = { version: '2.0', exportDate: new Date().toISOString(), folders: grouped }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prompt-manager-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (!data.folders || !Array.isArray(data.folders)) {
      throw new Error('Invalid format')
    }
    const flatFolders = data.folders.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description || '',
      parent_id: f.parent_id ?? null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      prompts: Array.isArray(f.prompts) ? f.prompts : [],
    }))
    const flatPrompts = flatFolders.flatMap(f => f.prompts.map(p => ({
      id: p.id,
      folder_id: f.id,
      title: p.title,
      content: p.content,
      tags: p.tags || [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })))
    return { data: { folders: flatFolders, prompts: flatPrompts }, error: null }
  } catch (error) {
    return { data: null, error: 'Invalid JSON format' }
  }
}
