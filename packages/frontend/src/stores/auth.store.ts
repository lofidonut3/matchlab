import { create } from 'zustand'
import type { User } from '@matchlab/shared'
import { authService } from '../services'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { token, user } = await authService.login({ email, password })
      localStorage.setItem('token', token)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  register: async (email, password, nickname) => {
    set({ isLoading: true, error: null })
    try {
      const { token, user } = await authService.register({ email, password, nickname })
      localStorage.setItem('token', token)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, isAuthenticated: false, error: null })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const user = await authService.getMe()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      localStorage.removeItem('token')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),
}))
