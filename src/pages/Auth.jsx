import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Sparkles, Key, Sun, Moon } from 'lucide-react'

export function Auth() {
  const [accessKey, setAccessKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(accessKey.trim())   // <--- chave pura
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl gradient-primary">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Prompt Manager Ultra</h1>
          </div>
          <p className="text-muted-foreground">
            Sistema Premium de Prompts
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Acesso Restrito</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chave de Acesso</label>

              <Input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}   // <--- REMOVIDO .toUpperCase()
                placeholder="Digite sua chave de acesso"
                required
              />

              <p className="text-xs text-muted-foreground mt-2">
                Entre em contato com o administrador para obter sua chave
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Acessar Sistema'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
