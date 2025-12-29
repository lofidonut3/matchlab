import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Unwrap API response wrapper { success, data }
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    const message = error.response?.data?.error || error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.'
    return Promise.reject(new Error(message))
  }
)

export default api
