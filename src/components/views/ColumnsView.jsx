import React from 'react';
import { Folder as FolderIcon, FileText } from 'lucide-react';

// Componente para a visualização em Colunas (Miller Columns)
export function ColumnsView({ allFolders, selection, selectFolder, selectSubfolder, prompts }) {
  // Deriva as listas de pastas da lista principal com base na seleção.
  const rootFolders = allFolders.filter(f => f.parent_id === null);
  const subfolders = allFolders.filter(f => f.parent_id === selection.folderId);

  // Função para renderizar uma lista de pastas em uma coluna.
  const renderFolderList = (folders, onSelect, selectedId) => (
    <ul>
      {folders.map(folder => (
        <li
          key={folder.id}
          onClick={() => onSelect(folder.id)}
          className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm mb-1 ${selectedId === folder.id ? 'bg-primary/20 text-primary-foreground' : 'hover:bg-primary/10'}`}
        >
          <FolderIcon className="w-4 h-4" />
          <span>{folder.name}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: '65vh' }}>
      {/* Coluna 1: Pastas Raiz */}
      <div className="border border-border rounded-lg p-4 overflow-y-auto">
        <h3 className="font-bold mb-4 text-lg">Pastas Raiz</h3>
        {renderFolderList(rootFolders, selectFolder, selection.folderId)}
      </div>

      {/* Coluna 2: Subpastas */}
      <div className="border border-border rounded-lg p-4 overflow-y-auto">
        <h3 className="font-bold mb-4 text-lg">Subpastas</h3>
        {selection.folderId ? (
          renderFolderList(subfolders, selectSubfolder, selection.subfolderId)
        ) : (
          <p className="text-sm text-muted-foreground mt-4">Selecione uma pasta para ver as subpastas.</p>
        )}
      </div>

      {/* Coluna 3: Prompts */}
      <div className="border border-border rounded-lg p-4 overflow-y-auto">
        <h3 className="font-bold mb-4 text-lg">Prompts</h3>
        {selection.subfolderId ? (
          <ul>
            {prompts.map(prompt => (
              <li key={prompt.id} className="flex items-center gap-2 p-2 rounded cursor-pointer text-sm hover:bg-primary/10">
                <FileText className="w-4 h-4" />
                <span>{prompt.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">Selecione uma subpasta para ver os prompts.</p>
        )}
      </div>
    </div>
  );
}
