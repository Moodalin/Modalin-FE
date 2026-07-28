import { createContext } from 'react'
import type { AuthSession, SignInInput, SignUpInput } from '@/types/auth'

export type AuthContextValue = {
  session: AuthSession | null
  loading: boolean
  refreshSession: () => Promise<void>
  signIn: (input: SignInInput) => Promise<void>
  signUp: (input: SignUpInput) => Promise<void>
  signInWithGoogle: (callbackURL: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
