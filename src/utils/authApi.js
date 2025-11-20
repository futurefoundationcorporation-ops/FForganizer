const isReplit = window.location.hostname.includes('replit.dev') || window.location.hostname.includes('repl.co')
const API_BASE = '/api'
import { auth } from '../lib/firebase'
import { signInWithCustomToken } from 'firebase/auth'

export async function loginWithKey(key) {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ key })
    })

    const data = await response.json()
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Erro ao fazer login')
    }

    if (data.customToken) {
      await signInWithCustomToken(auth, data.customToken)
    }

    return { success: true, isAdmin: data.isAdmin, expiresAt: data.expiresAt }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error.message || 'Erro ao fazer login'
    }
  }
}

export async function getSession() {
  try {
    const response = await fetch(`${API_BASE}/session`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok || !data.valid) {
      return {
        valid: false,
        error: data.error
      }
    }

    return {
      valid: true,
      isAdmin: data.isAdmin
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      valid: false,
      error: error.message || 'Erro ao validar sessão'
    }
  }
}

export async function logout() {
  try {
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()
    return { success: data.success }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }
}

export async function generateAccessKey(label, isAdmin = false) {
  try {
    const response = await fetch(`${API_BASE}/generate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ label, isAdmin })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao gerar chave')
    }

    return {
      success: true,
      key: data.key,
      keyId: data.keyId,
      label: data.label,
      isAdmin: data.isAdmin
    }
  } catch (error) {
    console.error('Generate key error:', error)
    return {
      success: false,
      error: error.message || 'Erro ao gerar chave'
    }
  }
}

export async function listAccessKeys() {
  try {
    const response = await fetch(`${API_BASE}/list-keys`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao listar chaves')
    }

    return {
      success: true,
      keys: data.keys || []
    }
  } catch (error) {
    console.error('List keys error:', error)
    return {
      success: false,
      error: error.message || 'Erro ao listar chaves',
      keys: []
    }
  }
}

export async function deleteAccessKey(keyId) {
  try {
    const response = await fetch(`${API_BASE}/delete-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ keyId })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao deletar chave')
    }

    return { success: true }
  } catch (error) {
    console.error('Delete key error:', error)
    return {
      success: false,
      error: error.message || 'Erro ao deletar chave'
    }
  }
}
