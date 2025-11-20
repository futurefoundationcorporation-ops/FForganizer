const admin = require('firebase-admin')
const functions = require('firebase-functions')
const crypto = require('crypto')

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

function json(res, status, body, cookie) {
  res.setHeader('Content-Type', 'application/json')
  if (cookie) {
    res.setHeader('Set-Cookie', cookie)
  }
  res.status(status).send(JSON.stringify(body))
}

function buildCookie(name, value, maxAgeSeconds) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `${name}=${value}`,
    'HttpOnly',
    isProd ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ].filter(Boolean)
  return parts.join('; ')
}

async function validateAccessKey(key) {
  const masterKey = functions.config().app?.master_key || ''
  const candidate = (key || '').trim()
  if (masterKey && candidate === masterKey) {
    return { valid: true, isAdmin: true, source: 'master' }
  }
  const snap = await db.collection('access_keys').get()
  for (const doc of snap.docs) {
    const data = doc.data()
    const salt = data.salt
    const hash = crypto.createHash('sha256').update(candidate + salt).digest('hex')
    if (hash === data.key_hash) {
      return { valid: true, isAdmin: !!data.is_admin, source: 'access_key', keyId: doc.id }
    }
  }
  return { valid: false }
}

exports.login = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Método não permitido' })
    const { key } = req.body || {}
    if (!key || typeof key !== 'string') return json(res, 400, { ok: false, error: 'Chave inválida' })

    const result = await validateAccessKey(key)
    if (!result.valid) return json(res, 403, { ok: false, error: 'Acesso negado' })

    const isAdmin = !!result.isAdmin
    const sessionToken = crypto.randomBytes(32).toString('hex')

    await db.collection('sessions').doc(sessionToken).set({
      is_admin: isAdmin,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_used: admin.firestore.FieldValue.serverTimestamp(),
    })

    const cookie = buildCookie('session_token', sessionToken, 10 * 365 * 24 * 60 * 60)

    const uid = result.source === 'master' ? 'master-admin' : `key-${result.keyId}`
    const customToken = await admin.auth().createCustomToken(uid, { admin: isAdmin })
    return json(res, 200, { ok: true, isAdmin, customToken }, cookie)
  } catch (err) {
    console.error('login error', err)
    return json(res, 500, { ok: false, error: 'Erro interno' })
  }
})

exports.session = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'GET') return json(res, 405, { valid: false, error: 'Método não permitido' })
    const cookieHeader = req.headers.cookie || ''
    const match = cookieHeader.match(/(?:^|; )session_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return json(res, 200, { valid: false })

    const doc = await db.collection('sessions').doc(token).get()
    if (!doc.exists) return json(res, 200, { valid: false })
    const data = doc.data()
    await db.collection('sessions').doc(token).update({ last_used: admin.firestore.FieldValue.serverTimestamp() })
    return json(res, 200, { valid: true, isAdmin: !!data.is_admin })
  } catch (err) {
    console.error('session error', err)
    return json(res, 500, { valid: false, error: 'Erro interno' })
  }
})

exports.logout = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Método não permitido' })
    const cookieHeader = req.headers.cookie || ''
    const match = cookieHeader.match(/(?:^|; )session_token=([^;]+)/)
    const token = match ? match[1] : null
    if (token) await db.collection('sessions').doc(token).delete().catch(() => {})
    const expired = 'session_token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
    return json(res, 200, { success: true }, expired)
  } catch (err) {
    console.error('logout error', err)
    return json(res, 500, { success: false, error: 'Erro interno' })
  }
})

async function requireAdmin(req) {
  const cookieHeader = req.headers.cookie || ''
  const match = cookieHeader.match(/(?:^|; )session_token=([^;]+)/)
  const token = match ? match[1] : null
  if (!token) return { ok: false, error: 'Sessão ausente' }
  const doc = await db.collection('sessions').doc(token).get()
  if (!doc.exists) return { ok: false, error: 'Sessão inválida' }
  const data = doc.data()
  if (!data.is_admin) return { ok: false, error: 'Acesso negado' }
  return { ok: true }
}

exports.generateAccessKey = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Método não permitido' })
    const gate = await requireAdmin(req)
    if (!gate.ok) return json(res, 403, { success: false, error: gate.error })

    const { label = '', isAdmin = false } = req.body || {}
    const salt = crypto.randomBytes(16).toString('hex')
    const raw = crypto.randomBytes(32).toString('hex')
    const plainKey = `ACCESS-${raw}`
    const keyHash = crypto.createHash('sha256').update(plainKey + salt).digest('hex')

    const docRef = await db.collection('access_keys').add({
      key_hash: keyHash,
      salt,
      label,
      is_admin: !!isAdmin,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_used_at: null,
    })

    return json(res, 200, { success: true, key: plainKey, keyId: docRef.id, label, isAdmin: !!isAdmin })
  } catch (err) {
    console.error('generateAccessKey error', err)
    return json(res, 500, { success: false, error: 'Erro interno' })
  }
})

exports.listAccessKeys = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'GET') return json(res, 405, { success: false, error: 'Método não permitido' })
    const gate = await requireAdmin(req)
    if (!gate.ok) return json(res, 403, { success: false, error: gate.error })

    const snap = await db.collection('access_keys').orderBy('created_at', 'desc').get()
    const keys = snap.docs.map(d => ({ id: d.id, ...d.data(), key_hash: undefined, salt: undefined }))
    return json(res, 200, { success: true, keys })
  } catch (err) {
    console.error('listAccessKeys error', err)
    return json(res, 500, { success: false, error: 'Erro interno' })
  }
})

exports.deleteAccessKey = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Método não permitido' })
    const gate = await requireAdmin(req)
    if (!gate.ok) return json(res, 403, { success: false, error: gate.error })

    const { keyId } = req.body || {}
    if (!keyId) return json(res, 400, { success: false, error: 'keyId requerido' })
    await db.collection('access_keys').doc(keyId).delete()
    return json(res, 200, { success: true })
  } catch (err) {
    console.error('deleteAccessKey error', err)
    return json(res, 500, { success: false, error: 'Erro interno' })
  }
})

exports.getShared = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'GET') return json(res, 405, { success: false, error: 'Método não permitido' })
    const id = (req.query?.id || '').toString()
    if (!id) return json(res, 400, { success: false, error: 'id requerido' })
  const link = await db.collection('shared_links').doc(id).get()
  if (!link.exists) return json(res, 404, { success: false, error: 'Link não encontrado' })
  const data = link.data()
  const prompt = await db.collection('prompts').doc(data.prompt_id).get()
  if (!prompt.exists) return json(res, 404, { success: false, error: 'Prompt não encontrado' })
  return json(res, 200, { success: true, prompt: prompt.data() })
  } catch (err) {
    console.error('getShared error', err)
    return json(res, 500, { success: false, error: 'Erro interno' })
  }
})
