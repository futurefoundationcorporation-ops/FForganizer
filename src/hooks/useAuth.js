import { useState, useEffect } from 'react'
import authApi from '../utils/supabaseApi' // MUDANÇA AQUI
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    handleCheckSession()
  }, [])

  async function handleCheckSession() {
    try {
      setLoading(true)
      
      const session = await authApi.checkSession()
      
      if (session && session.valid) {
        setUser({
          id: auth.currentUser?.uid || 'ghost',
          isAdmin: !!session.isAdmin,
          expiresAt: null
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
      const result = await authApi.login(accessKey)

      const succeeded = !!(result && (result.ok === true || result.success === true))

      if (!succeeded) {
        const message = result?.error || result?.message || 'Chave de acesso inválida'
        return { 
          data: null, 
          error: { message } 
        }
      }

      const session = await authApi.checkSession()
      if (!session || !session.valid) {
        return {
          data: null,
          error: { message: 'Falha ao validar sessão após login' }
        }
      }

      const userData = {
        id: auth.currentUser?.uid || 'ghost',
        isAdmin: !!session.isAdmin,
        expiresAt: null
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
    await authApi.logout()
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
