import { Folder, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

export function FolderCard({ folder, onClick, onDelete, isActive }) {
  return (
    <div
      className={clsx(
        'bg-card border border-border rounded-xl p-6 cursor-pointer',
        'transition-all duration-200 hover:shadow-lg hover:scale-105 animate-in',
        'group relative',
        isActive && 'ring-2 ring-primary shadow-glow'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <Folder className="w-6 h-6 text-primary" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(folder.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
      <h3 className="text-lg font-semibold mb-2">{folder.name}</h3>
      <p className="text-sm text-muted-foreground">
        {folder.prompt_count || 0} prompts
      </p>
      {folder.created_at && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {new Date(folder.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
    </div>
  )
}
