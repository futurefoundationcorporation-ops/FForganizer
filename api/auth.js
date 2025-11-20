import express from 'express'
import crypto from 'crypto'

const router = express.Router()

function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

function hashKeyWithSalt(key, salt) {
  return crypto.createHash('sha256').update(key + salt).digest('hex')
}

router.post('/validate-master', (req, res) => {
  const { key } = req.body
  
  if (!key) {
    return res.status(400).json({ valid: false, error: 'Chave não fornecida' })
  }
  
  const masterKey = process.env.MASTER_KEY
  
  if (!masterKey) {
    return res.status(500).json({ valid: false, error: 'MASTER_KEY não configurada no servidor' })
  }
  
  const isValid = key === masterKey
  
  if (isValid) {
    const sessionToken = crypto.randomBytes(32).toString('hex')
    
    return res.json({
      valid: true,
      is_admin: true,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return res.json({ valid: false })
})

router.post('/hash-key', (req, res) => {
  const { adminSessionToken, plainKey } = req.body
  
  if (!adminSessionToken) {
    return res.status(401).json({ error: 'Sessão de admin necessária' })
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

export default router
