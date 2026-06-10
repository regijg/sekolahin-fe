import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data
}

export function extractPaginated<T>(response: {
  data: {
    data: T[]
    meta: { current_page: number; last_page: number; per_page: number; total: number }
  }
}): { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } } {
  return { data: response.data.data, meta: response.data.meta }
}
