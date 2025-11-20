import { useEffect } from 'react'

export function useKeyboard(handlers) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        handlers.onNewFolder?.()
      } else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        handlers.onNewPrompt?.()
      } else if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        handlers.onSearch?.()
      } else if (e.key === 'Delete' && !e.target.matches('input, textarea')) {
        e.preventDefault()
        handlers.onDelete?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
