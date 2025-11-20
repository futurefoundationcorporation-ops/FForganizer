import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export const GHOST_USER_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : `https://${window.location.hostname.replace('-5000', '-3001')}`

export async function hashKey(plainKey) {
  const msgBuffer = new TextEncoder().encode(plainKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

async function validateMasterKey(key) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/validate-master`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key })
    })
    
    if (!response.ok) {
      console.error('Erro ao validar MASTER_KEY:', response.statusText)
      return { valid: false }
    }
    
    const result = await response.json()
    
    if (result.valid) {
      localStorage.setItem('admin_session', result.session_token)
      localStorage.setItem('session_expires', result.expires_at)
      
      return {
        isValid: true,
        isAdmin: true,
        userId: GHOST_USER_ID,
        sessionToken: result.session_token,
        keyData: {
          label: 'MASTER KEY',
          isAdmin: true
        }
      }
    }
    
    return { isValid: false, isAdmin: false, userId: null }
  } catch (error) {
    console.error('Erro ao conectar com servidor de autenticação:', error)
    return { 
      isValid: false, 
      isAdmin: false,
      userId: null,
      error: 'Servidor de autenticação offline. Certifique-se de que o servidor está rodando na porta 3001.' 
    }
  }
}

async function validateAccessKey(key) {
  if (!isSupabaseConfigured) {
    return { isValid: false, isAdmin: false, userId: null, error: 'Supabase não configurado' }
  }
  
  try {
    const { data, error } = await supabase.rpc('validate_access_key', {
      plain_key: key
    })
    
    if (error) {
      console.error('Erro ao validar chave:', error)
      return { isValid: false, isAdmin: false, userId: null }
    }
    
    if (data && data.valid) {
      return {
        isValid: true,
        isAdmin: data.is_admin || false,
        userId: GHOST_USER_ID,
        keyData: {
          key_id: data.key_id,
          label: data.label || 'Access Key',
          isAdmin: data.is_admin || false
        }
      }
    }
    
    return { isValid: false, isAdmin: false, userId: null, error: 'Chave de acesso inválida' }
  } catch (err) {
    console.error('Erro ao validar chave:', err)
    return { isValid: false, isAdmin: false, userId: null, error: 'Erro ao validar chave' }
  }
}

export async function validateKey(key) {
  const masterResult = await validateMasterKey(key)
  
  if (masterResult.isValid) {
    return masterResult
  }
  
  const accessResult = await validateAccessKey(key)
  return accessResult
}

export async function verifySession() {
  const sessionToken = localStorage.getItem('admin_session')
  const expiresAt = localStorage.getItem('session_expires')
  
  if (!sessionToken || !expiresAt) {
    return { valid: false }
  }
  
  if (new Date() > new Date(expiresAt)) {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('session_expires')
    return { valid: false, expired: true }
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionToken })
    })
    
    if (!response.ok) {
      return { valid: false }
    }
    
    const result = await response.json()
    
    if (!result.valid) {
      localStorage.removeItem('admin_session')
      localStorage.removeItem('session_expires')
    }
    
    return result
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return { valid: false }
  }
}

export async function logoutSession() {
  const sessionToken = localStorage.getItem('admin_session')
  
  if (sessionToken) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionToken })
      })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }
  
  localStorage.removeItem('admin_session')
  localStorage.removeItem('session_expires')
}

export async function hashKeyOnServer(plainKey) {
  const sessionToken = localStorage.getItem('admin_session')
  
  if (!sessionToken) {
    throw new Error('Sessão de admin necessária')
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/hash-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionToken, plainKey })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao fazer hash da chave')
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao fazer hash da chave:', error)
    throw error
  }
}

export function getStoredKey() {
  return localStorage.getItem('access_key')
}

export function storeKey(key) {
  localStorage.setItem('access_key', key)
}

export function clearStoredKey() {
  localStorage.removeItem('access_key')
  localStorage.removeItem('admin_session')
  localStorage.removeItem('session_expires')
}

export function isKeyMasterKey() {
  return localStorage.getItem('admin_session') !== null
}
