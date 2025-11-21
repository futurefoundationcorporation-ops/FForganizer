import React from 'react';
import { Folder } from 'lucide-react';

// A reusable component for items in a column
const ColumnItem = ({ item, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-lg border transition-colors ${
      isActive
        ? 'bg-primary/10 border-primary text-primary font-semibold'
        : 'border-transparent hover:bg-muted'
    }`}
  >
    <div className="flex items-center gap-3">
      <Folder className="w-5 h-5" />
      <span className="truncate">{item.name}</span>
    </div>
  </button>
);

// The main view component
export function ColumnsView({ allFolders, selection, selectFolder, selectSubfolder }) {
  // 1. Filter data for columns
  const rootFolders = allFolders.filter(f => !f.parent_id);
  const subfolders = selection.folderId
    ? allFolders.filter(f => f.parent_id === selection.folderId)
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Column 1: Root Folders */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-lg font-bold px-2 pb-2">Pastas Raiz</h2>
        <div className="space-y-1">
          {rootFolders.length > 0 ? (
            rootFolders.map(folder => (
              <ColumnItem
                key={folder.id}
                item={folder}
                onClick={() => selectFolder(folder.id)}
                isActive={selection.folderId === folder.id}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-2">Crie uma nova pasta para começar.</p>
          )}
        </div>
      </div>

      {/* Column 2: Subfolders */}
      <div className="bg-card border border-border rounded-xl p-4 md:col-span-1">
         <h2 className="text-lg font-bold px-2 pb-2">Subpastas</h2>
         <div className="space-y-1">
            {selection.folderId ? (
                subfolders.length > 0 ? (
                    subfolders.map(subfolder => (
                        <ColumnItem
                            key={subfolder.id}
                            item={subfolder}
                            onClick={() => selectSubfolder(subfolder.id)}
                            isActive={selection.subfolderId === subfolder.id}
                        />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground p-2">Crie uma nova subpasta.</p>
                )
            ) : (
                <p className="text-sm text-muted-foreground p-2">Selecione uma pasta raiz.</p>
            )}
        </div>
      </div>

       {/* Column 3: Prompts (Info) */}
      <div className="bg-card border border-border rounded-xl p-4 md:col-span-1">
        <h2 className="text-lg font-bold px-2 pb-2">Prompts</h2>
        <div className="p-2 text-sm text-muted-foreground">
            {selection.subfolderId 
                ? "Os prompts estão listados na seção abaixo."
                : "Selecione uma subpasta para ver seus prompts."
            }
        </div>
      </div>
    </div>
  );
}
