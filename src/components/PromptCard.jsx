import { FileText, Trash2, Share2, Clock } from 'lucide-react'
import { clsx } from 'clsx'

export function PromptCard({ prompt, onClick, onDelete, onShare, onViewVersions }) {
  return (
    <div
      className={clsx(
        'bg-card border border-border rounded-xl p-6 cursor-pointer',
        'transition-all duration-200 hover:shadow-lg hover:scale-105 animate-in',
        'group relative'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-3 rounded-lg bg-secondary/10">
          <FileText className="w-6 h-6 text-secondary" />
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewVersions?.(prompt)
            }}
            className="p-2 rounded-lg hover:bg-muted transition-all"
            title="Ver versões"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onShare?.(prompt)
            }}
            className="p-2 rounded-lg hover:bg-muted transition-all"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(prompt.id)
            }}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-all"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2 line-clamp-1">{prompt.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {prompt.content}
      </p>
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {prompt.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      )}
      {prompt.created_at && (
        <div className="pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {new Date(prompt.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
    </div>
  )
}
