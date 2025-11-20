import { useState, useEffect } from 'react'
import { loginWithKey, getSession, logout } from '../utils/authApi'
import { GHOST_USER_ID } from '../utils/keyValidator'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      setLoading(true)
      
      const session = await getSession()
      
      if (session.valid) {
        setUser({
          id: GHOST_USER_ID,
          isAdmin: session.isAdmin,
          expiresAt: session.expiresAt
        })
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (accessKey) => {
    try {
      const result = await loginWithKey(accessKey)
      
      if (!result.success) {
        return { 
          data: null, 
          error: { message: result.error || 'Chave de acesso inválida' } 
        }
      }

      const userData = {
        id: GHOST_USER_ID,
        isAdmin: result.isAdmin,
        expiresAt: result.expiresAt
      }
      
      setUser(userData)
      
      return { data: userData, error: null }
    } catch (err) {
      console.error('Erro no login:', err)
      return { 
        data: null, 
        error: { message: 'Erro ao fazer login. Tente novamente.' } 
      }
    }
  }

  const signOut = async () => {
    await logout()
    setUser(null)
    return { error: null }
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}
