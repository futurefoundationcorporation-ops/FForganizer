const { createClient } = require('@supabase/supabase-js')

// Suporte para ambas as variáveis de ambiente (VITE_* para dev, sem prefixo para Vercel)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function parseCookies(cookieHeader) {
  const cookies = {}
  if (!cookieHeader) return cookies
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  
  return cookies
}

module.exports = async function handler(req, res) {
  // Configurar headers CORS e Content-Type
  res.setHeader('Content-Type', 'application/json')
  
  // CORS seguro: aceitar apenas origins confiáveis
  const origin = req.headers.origin
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.PRODUCTION_URL || null,
    process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : null
  ].filter(Boolean)
  
  const isReplit = origin && (origin.includes('replit.dev') || origin.includes('repl.co'))
  
  if (origin && (allowedOrigins.includes(origin) || isReplit)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Tratar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Aceita GET e POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.session_token

    if (!sessionToken) {
      return res.status(403).json({ success: false, error: 'Acesso negado - sessão necessária' })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Supabase não configurado' })
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // Validar sessão
      const { data: sessionData, error: sessionError } = await supabase.rpc('validate_admin_session', {
        session_token: sessionToken
      })

      if (sessionError || !sessionData?.valid || !sessionData?.is_admin) {
        return res.status(403).json({ success: false, error: 'Sessão inválida ou sem permissão' })
      }

      // Verificar MASTER_KEY
      const masterKey = process.env.MASTER_KEY
      
      if (!masterKey) {
        return res.status(500).json({ success: false, error: 'MASTER_KEY não configurada no servidor' })
      }
      
      const { data: keysData, error: keysError } = await supabase.rpc('list_access_keys_with_validated_admin')

      if (keysError || !keysData?.success) {
        console.error('Erro ao listar chaves:', keysError, keysData)
        return res.status(500).json({ 
          success: false, 
          error: keysData?.error || 'Erro ao listar chaves' 
        })
      }

      return res.status(200).json({
        success: true,
        keys: keysData.keys || []
      })
    } catch (error) {
      console.error('Erro ao listar chaves:', error)
      return res.status(500).json({ success: false, error: 'Erro ao listar chaves' })
    }
  } catch (error) {
    console.error('Erro inesperado ao listar chaves:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}
