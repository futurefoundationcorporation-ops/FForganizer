import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '../components/Button'

export function SharedPrompt() {
  const { token } = useParams()
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSharedPrompt()
  }, [token])

  const loadSharedPrompt = async () => {
    const { data, error } = await supabase
      .rpc('get_shared_prompt', { share_token: token })

    if (!error && data && data.length > 0) {
      setPrompt(data[0])
    }
    setLoading(false)
  }

  const copyContent = () => {
    navigator.clipboard.writeText(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Prompt não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl gradient-primary">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Prompt Compartilhado</h1>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">{prompt.title}</h2>
          
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {prompt.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm rounded-lg bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="bg-muted/30 rounded-lg p-6 mb-6">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {prompt.content}
            </pre>
          </div>

          <Button onClick={copyContent} className="w-full">
            {copied ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                Copiar Conteúdo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
