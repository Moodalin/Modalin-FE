import { useEffect, useState, type ReactNode } from 'react'
import { authClient } from '@/config/auth-client'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import type { AuthSession } from '@/types/auth'

function throwAuthError(error: { message?: string } | null | undefined) {
  if (error) throw { data: error }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    const result = await authClient.getSession()
    throwAuthError(result.error)
    setSession(result.data ? { user: result.data.user } : null)
  }

  useEffect(() => {
    refreshSession().catch(() => setSession(null)).finally(() => setLoading(false))
  }, [])

  const value: AuthContextValue = {
    session,
    loading,
    refreshSession,
    signIn: async (input) => {
      const result = await authClient.signIn.email(input)
      throwAuthError(result.error)
      await refreshSession()
    },
    signUp: async (input) => {
      const result = await authClient.signUp.email(input)
      throwAuthError(result.error)
      await refreshSession()
    },
    signInWithGoogle: async (callbackURL) => {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL })
      throwAuthError(result.error)
    },
    signOut: async () => {
      const result = await authClient.signOut()
      throwAuthError(result.error)
      setSession(null)
    },
  }

  return <AuthContext value={value}>{children}</AuthContext>
}
