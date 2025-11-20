import { createClient } from '@supabase/supabase-js'

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

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.session_token

    if (!sessionToken) {
      return res.status(200).json({
        valid: false,
        logged: false,
        error: 'Nenhuma sessão ativa'
      })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        valid: false,
        logged: false,
        error: 'Supabase não configurado'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase.rpc('validate_admin_session', {
      sessiontoken: sessionToken   // ← ALTERADO AQUI
    })

    if (error) {
      console.error('Erro ao validar sessão:', error)
      return res.status(500).json({
        valid: false,
        logged: false,
        error: 'Erro ao validar sessão'
      })
    }

    if (!data || !data.valid) {
      // limpar cookie
      const cookie = [
        'session_token=',
        'HttpOnly',
        'Path=/',
        'SameSite=Strict',
        'Max-Age=0'
      ].join('; ')

      res.setHeader('Set-Cookie', cookie)

      return res.status(200).json({
        valid: false,
        logged: false,
        error: 'Sessão inválida'
      })
    }

    return res.status(200).json({
      valid: true,
      logged: true,
      isAdmin: data.is_admin,
      sessionId: data.session_id,
      expiresAt: data.expires_at
    })
  } catch (error) {
    console.error('Erro inesperado na validação de sessão:', error)
    return res.status(500).json({
      valid: false,
      logged: false,
      error: 'Erro interno do servidor'
    })
  }
}
