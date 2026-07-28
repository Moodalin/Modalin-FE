export interface AuthUser {
  id: string
  name: string
  email: string
  image?: string | null
}

export interface AuthSession {
  user: AuthUser
}

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput extends SignInInput {
  name: string
}
