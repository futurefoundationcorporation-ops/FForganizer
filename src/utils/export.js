export async function exportData(folders, prompts) {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    folders,
    prompts,
  }
  
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
    if (!data.folders || !data.prompts) {
      throw new Error('Invalid format')
    }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: 'Invalid JSON format' }
  }
}
