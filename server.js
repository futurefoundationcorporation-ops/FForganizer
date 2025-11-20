import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: true,
  credentials: true
}))
app.use(express.json())

const activeSessions = new Map()
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

function hashKeyWithSalt(key, salt) {
  return crypto.createHash('sha256').update(key + salt).digest('hex')
}

function generateSessionToken() {
  return crypto.randomBytes(48).toString('hex')
}

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

app.post('/api/auth/validate-master', (req, res) => {
  const { key } = req.body
  
  if (!key) {
    return res.status(400).json({ valid: false, error: 'Chave não fornecida' })
  }
  
  const masterKey = process.env.MASTER_KEY
  
  if (!masterKey) {
    console.warn('⚠️  MASTER_KEY não configurada! Configure nos Secrets do Replit.')
    return res.status(500).json({ 
      valid: false, 
      error: 'MASTER_KEY não configurada no servidor' 
    })
  }
  
  const isValid = key === masterKey
  
  if (isValid) {
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    activeSessions.set(sessionToken, {
      is_admin: true,
      created_at: new Date(),
      expires_at: expiresAt
    })
    
    console.log(`✅ Admin autenticado - Sessão: ${sessionToken.substring(0, 16)}...`)
    
    return res.json({
      valid: true,
      is_admin: true,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    })
  }
  
  console.log('❌ Tentativa de login com MASTER_KEY inválida')
  return res.json({ valid: false })
})

app.post('/api/auth/hash-key', (req, res) => {
  const { sessionToken, plainKey } = req.body
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Sessão de admin necessária' })
  }
  
  const session = activeSessions.get(sessionToken)
  
  if (!session || !session.is_admin) {
    return res.status(403).json({ error: 'Sessão inválida ou expirada' })
  }
  
  if (new Date() > new Date(session.expires_at)) {
    activeSessions.delete(sessionToken)
    return res.status(401).json({ error: 'Sessão expirada' })
  }
  
  if (!plainKey) {
    return res.status(400).json({ error: 'Chave não fornecida' })
  }
  
  const salt = generateSalt()
  const hash = hashKeyWithSalt(plainKey, salt)
  
  return res.json({
    success: true,
    hash,
    salt
  })
})

app.post('/api/auth/verify-session', (req, res) => {
  const { sessionToken } = req.body
  
  if (!sessionToken) {
    return res.json({ valid: false })
  }
  
  const session = activeSessions.get(sessionToken)
  
  if (!session) {
    return res.json({ valid: false })
  }
  
  if (new Date() > new Date(session.expires_at)) {
    activeSessions.delete(sessionToken)
    return res.json({ valid: false, expired: true })
  }
  
  return res.json({
    valid: true,
    is_admin: session.is_admin,
    expires_at: session.expires_at
  })
})

app.post('/api/auth/logout', (req, res) => {
  const { sessionToken } = req.body
  
  if (sessionToken) {
    activeSessions.delete(sessionToken)
  }
  
  return res.json({ success: true })
})

// ===== NOVOS ENDPOINTS COMPATÍVEIS COM VERCEL =====

// POST /api/login - Login com MASTER_KEY ou Access Key
app.post('/api/login', async (req, res) => {
  try {
    const { key } = req.body

    if (!key) {
      return res.status(400).json({ ok: false, error: 'Chave não fornecida' })
    }

    const masterKey = process.env.MASTER_KEY
    
    if (!masterKey) {
      return res.status(500).json({ ok: false, error: 'MASTER_KEY não configurada no servidor' })
    }
    
    const isMasterKey = key.trim() === masterKey.trim()
    let isAdmin = false
    let isValidAccessKey = false

    if (isMasterKey) {
      isAdmin = true
    } else {
      // Validar via Supabase (apenas para Access Keys)
      if (!supabaseUrl || !supabaseServiceKey) {
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

    if (!isMasterKey && !isValidAccessKey) {
      return res.status(401).json({ ok: false, error: 'Chave inválida' })
    }

    // Criar sessão
    const sessionToken = crypto.randomBytes(64).toString('hex')
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    // Tentar criar sessão no Supabase se disponível
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session', {
          session_token: sessionToken,
          user_is_admin: isAdmin
        })

        if (sessionData?.success && sessionData?.expires_at) {
          expiresAt = sessionData.expires_at
        }
      } catch (error) {
        console.error('Aviso: Não foi possível criar sessão no Supabase:', error)
      }
    }
    
    // Armazenar sessão localmente
    activeSessions.set(sessionToken, {
      is_admin: isAdmin,
      created_at: new Date(),
      expires_at: new Date(expiresAt)
    })

    res.setHeader('Set-Cookie', 
      `session_token=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    )

    return res.status(200).json({
      ok: true,
      isAdmin,
      expiresAt
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return res.status(500).json({ ok: false, error: 'Erro interno do servidor' })
  }
})

// GET /api/session - Validar sessão ativa
app.get('/api/session', async (req, res) => {
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

    // Verificar sessão local primeiro
    const localSession = activeSessions.get(sessionToken)
    
    if (localSession) {
      // Verificar se expirou
      if (new Date() > new Date(localSession.expires_at)) {
        activeSessions.delete(sessionToken)
        res.setHeader('Set-Cookie', 
          'session_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        )
        return res.status(200).json({ 
          valid: false, 
          logged: false,
          error: 'Sessão expirada' 
        })
      }
      
      return res.status(200).json({
        valid: true,
        logged: true,
        isAdmin: localSession.is_admin,
        expiresAt: localSession.expires_at
      })
    }

    // Se não está em memória, tentar validar no Supabase
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data, error } = await supabase.rpc('validate_admin_session', {
          session_token: sessionToken
        })

        if (!error && data && data.valid) {
          return res.status(200).json({
            valid: true,
            logged: true,
            isAdmin: data.is_admin,
            sessionId: data.session_id,
            expiresAt: data.expires_at
          })
        }
      } catch (error) {
        console.error('Erro ao validar sessão no Supabase:', error)
      }
    }
    
    // Sessão não encontrada
    res.setHeader('Set-Cookie', 
      'session_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    )
    return res.status(200).json({ 
      valid: false, 
      logged: false,
      error: 'Sessão inválida' 
    })
  } catch (error) {
    console.error('Erro na validação:', error)
    return res.status(500).json({ 
      valid: false, 
      logged: false,
      error: 'Erro interno do servidor' 
    })
  }
})

// POST /api/logout - Logout e limpar sessão
app.post('/api/logout', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.session_token

    res.setHeader('Set-Cookie', 
      'session_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    )

    if (sessionToken) {
      activeSessions.delete(sessionToken)

      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          await supabase.rpc('delete_admin_session', {
            session_token: sessionToken
          })
        } catch (error) {
          console.error('Erro ao deletar sessão no Supabase:', error)
        }
      }
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro no logout:', error)
    return res.status(200).json({ success: true })
  }
})

// POST /api/generate-key - Gerar nova Access Key (apenas admin)
app.post('/api/generate-key', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.session_token

    if (!sessionToken) {
      return res.status(403).json({ success: false, error: 'Acesso negado - sessão necessária' })
    }

    const localSession = activeSessions.get(sessionToken)
    if (!localSession || !localSession.is_admin) {
      return res.status(403).json({ success: false, error: 'Sessão inválida ou sem permissão' })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Supabase não configurado' })
    }

    const { label, isAdmin } = req.body
    const newKey = crypto.randomBytes(32).toString('hex')
    const salt = generateSalt()
    const hash = hashKeyWithSalt(newKey, salt)

    const masterKey = process.env.MASTER_KEY
    if (!masterKey) {
      return res.status(500).json({ success: false, error: 'MASTER_KEY não configurada no servidor' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: keyData, error: keyError } = await supabase.rpc('create_access_key_with_validated_admin', {
      new_key_hash: hash,
      new_salt: salt,
      key_label: label || null,
      is_admin_key: isAdmin || false
    })

    if (keyError || !keyData?.success) {
      console.error('Erro ao criar chave:', keyError, keyData)
      return res.status(500).json({ 
        success: false, 
        error: keyData?.error || 'Erro ao criar chave' 
      })
    }

    return res.status(200).json({
      success: true,
      key: newKey,
      keyId: keyData.key_id,
      label: keyData.label,
      isAdmin: keyData.is_admin
    })
  } catch (error) {
    console.error('Erro ao gerar chave:', error)
    return res.status(500).json({ success: false, error: 'Erro ao gerar chave' })
  }
})

// GET /api/list-keys - Listar Access Keys (apenas admin)
app.get('/api/list-keys', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.session_token

    if (!sessionToken) {
      return res.status(403).json({ success: false, error: 'Acesso negado - sessão necessária' })
    }

    const localSession = activeSessions.get(sessionToken)
    if (!localSession || !localSession.is_admin) {
      return res.status(403).json({ success: false, error: 'Sessão inválida ou sem permissão' })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Supabase não configurado' })
    }

    const masterKey = process.env.MASTER_KEY
    if (!masterKey) {
      return res.status(500).json({ success: false, error: 'MASTER_KEY não configurada no servidor' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
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
})

// POST /api/delete-key - Deletar Access Key (apenas admin)
app.post('/api/delete-key', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const sessionToken = cookies.session_token

    if (!sessionToken) {
      return res.status(403).json({ success: false, error: 'Acesso negado - sessão necessária' })
    }

    const localSession = activeSessions.get(sessionToken)
    if (!localSession || !localSession.is_admin) {
      return res.status(403).json({ success: false, error: 'Sessão inválida ou sem permissão' })
    }

    const { keyId } = req.body
    if (!keyId) {
      return res.status(400).json({ success: false, error: 'ID da chave não fornecido' })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Supabase não configurado' })
    }

    const masterKey = process.env.MASTER_KEY
    if (!masterKey) {
      return res.status(500).json({ success: false, error: 'MASTER_KEY não configurada no servidor' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: deleteData, error: deleteError } = await supabase.rpc('delete_access_key_with_validated_admin', {
      key_id_to_delete: keyId
    })

    if (deleteError || !deleteData?.success) {
      console.error('Erro ao deletar chave:', deleteError, deleteData)
      return res.status(500).json({ 
        success: false, 
        error: deleteData?.error || 'Erro ao deletar chave' 
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar chave:', error)
    return res.status(500).json({ success: false, error: 'Erro ao deletar chave' })
  }
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    sessions: activeSessions.size
  })
})

const isReplit = process.env.REPL_ID || process.env.REPL_SLUG
const distPath = join(__dirname, 'dist')

if (isReplit) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next()
    }
    res.sendFile(join(distPath, 'index.html'))
  })
} else {
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    app.use(express.static(distPath))
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next()
      }
      res.sendFile(join(distPath, 'index.html'))
    })
  } else {
    app.get('/', (req, res) => {
      res.send('API Server running. Use Vite dev server on port 5173 for development.')
    })
  }
}

setInterval(() => {
  const now = new Date()
  for (const [token, session] of activeSessions.entries()) {
    if (now > new Date(session.expires_at)) {
      activeSessions.delete(token)
    }
  }
}, 60 * 1000)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 Auth API Server running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  
  if (!process.env.MASTER_KEY) {
    console.warn('⚠️  ATENÇÃO: MASTER_KEY não configurada!')
    console.warn('   Configure nos Secrets do Replit para habilitar login de admin')
  }
})

export default app
