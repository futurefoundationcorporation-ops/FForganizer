import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function useAdmin() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  function checkAdminStatus() {
    setLoading(true)
    
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    setIsAdmin(user.isAdmin === true)
    setLoading(false)
  }

  return { 
    isAdmin, 
    loading: loading || authLoading, 
    user, 
    refetch: checkAdminStatus 
  }
}
