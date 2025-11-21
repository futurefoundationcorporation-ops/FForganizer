import { useState, useEffect, createContext, useContext } from 'react'
import authApi from '../utils/supabaseApi'

// Cria o Contexto de Autenticação
const AuthContext = createContext();

// Hook customizado para usar o contexto de autenticação
export function useAuth() {
  return useContext(AuthContext);
}

// Provedor de autenticação que envolve o aplicativo
export function AuthProvider({ children }) {
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
          id: session.user_id || 'ghost', // Use a real ID from your session
          isAdmin: !!session.isAdmin,
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

      const userData = {
        id: result.user_id || 'ghost', // Use a real ID from your session
        isAdmin: !!result.isAdmin,
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

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
