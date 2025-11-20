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
  
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Tratar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.session_token

    // Limpar cookie sempre
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const isReplitEnv = process.env.REPL_ID || process.env.REPL_SLUG
    const sameSite = isReplitEnv ? 'Lax' : 'Strict'
    const clearCookieOptions = [
      'session_token=',
      'HttpOnly',
      isProduction ? 'Secure' : '',
      `SameSite=${sameSite}`,
      'Path=/',
      'Max-Age=0'
    ].filter(Boolean).join('; ')
    
    res.setHeader('Set-Cookie', clearCookieOptions)

    if (!sessionToken) {
      return res.status(200).json({ success: true })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(200).json({ success: true })
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      await supabase.rpc('delete_admin_session', {
        session_token: sessionToken
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
      return res.status(200).json({ success: true })
    }
  } catch (error) {
    console.error('Erro inesperado no logout:', error)
    return res.status(200).json({ success: true })
  }
}
