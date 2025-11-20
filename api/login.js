const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// Suporte para ambas as variáveis de ambiente (VITE_* para dev, sem prefixo para Vercel)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
    const { key } = req.body

    if (!key) {
      return res.status(400).json({ ok: false, error: 'Chave não fornecida' })
    }

    // Verificar MASTER_KEY
    const masterKey = process.env.MASTER_KEY

    if (!masterKey) {
      console.error('⚠️  MASTER_KEY não configurada!')
      return res.status(500).json({ ok: false, error: 'MASTER_KEY não configurada no servidor' })
    }

    // Verificar se é MASTER_KEY
    const isMasterKey = key.trim() === masterKey.trim()
    let isAdmin = false
    let isValidAccessKey = false

    if (isMasterKey) {
      isAdmin = true
    } else {
      // Verificar se é Access Key válida via Supabase RPC
      // IMPORTANTE: Access Keys só funcionam se Supabase estiver configurado
      if (!supabaseUrl || !supabaseServiceKey) {
        // Se Supabase não está configurado, apenas MASTER_KEY funciona
        return res.status(401).json({ ok: false, error: 'Chave inválida' })
      }

      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data, error } = await supabase.rpc('validate_access_key', {
          plain_key: key
        })

        if (error) {
          console.error('Erro ao validar access key:', error)
          return res.status(401).json({ ok: false, error: 'Chave inválida' })
        }

        if (data && data.valid) {
          isValidAccessKey = true
          isAdmin = data.is_admin || false
        }
      } catch (error) {
        console.error('Erro ao conectar com Supabase:', error)
        return res.status(401).json({ ok: false, error: 'Chave inválida' })
      }
    }

    // Se não é nem MASTER_KEY nem Access Key válida
    if (!isMasterKey && !isValidAccessKey) {
      return res.status(401).json({ ok: false, error: 'Chave inválida' })
    }

    // Criar sessão
    // Se Supabase está configurado, usar Supabase; caso contrário, apenas cookie
    const sessionToken = crypto.randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session', {
          session_token: sessionToken,
          user_is_admin: isAdmin
        })

        if (sessionError || !sessionData?.success) {
          console.error('Erro ao criar sessão no Supabase:', sessionError)
          // Continuar mesmo se Supabase falhar, apenas com cookie
        } else if (sessionData?.expires_at) {
          // Usar data de expiração do Supabase se disponível
          expiresAt = sessionData.expires_at
        }
      } catch (error) {
        console.error('Erro ao criar sessão no Supabase:', error)
        // Continuar mesmo se Supabase falhar, apenas com cookie
      }
    }

    // Definir cookie HTTP-only session_token
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const isReplitEnv = process.env.REPL_ID || process.env.REPL_SLUG
    const sameSite = isReplitEnv ? 'Lax' : 'Strict'
    const cookieOptions = [
      `session_token=${sessionToken}`,
      'HttpOnly',
      isProduction ? 'Secure' : '',
      `SameSite=${sameSite}`,
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`
    ].filter(Boolean).join('; ')
    
    res.setHeader('Set-Cookie', cookieOptions)

    return res.status(200).json({
      ok: true,
      isAdmin,
      expiresAt
    })
  } catch (error) {
    console.error('Erro inesperado no login:', error)
    return res.status(500).json({ ok: false, error: 'Erro interno do servidor' })
  }
}
