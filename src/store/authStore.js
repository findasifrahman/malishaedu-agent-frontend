import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../services/api'
import axios from 'axios'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        try {
          // OAuth2PasswordRequestForm expects form-urlencoded data
          const formData = new URLSearchParams()
          formData.append('username', email)
          formData.append('password', password)
          
          // Use axios directly to avoid default JSON Content-Type header
          // Pass URLSearchParams object directly - axios will handle it correctly
          let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
          
          // Ensure the URL has a protocol if it's not a relative path
          if (apiBaseUrl !== '/api' && !apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
            apiBaseUrl = `https://${apiBaseUrl}`
          }
          
          // Force HTTPS for production URLs (mixed content security)
          if (apiBaseUrl.startsWith('http://') && !apiBaseUrl.includes('localhost')) {
            // Convert http:// to https:// for non-localhost URLs
            apiBaseUrl = apiBaseUrl.replace('http://', 'https://')
          }
          
          // Ensure the URL ends with /api if it's an absolute URL
          if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
            if (!apiBaseUrl.endsWith('/api')) {
              apiBaseUrl = apiBaseUrl.replace(/\/$/, '') + '/api'
            }
          }
          
          const response = await axios.post(`${apiBaseUrl}/auth/login`, formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
          
          const userData = response.data.user
          const accessToken = response.data.access_token
          
          // Store token immediately in localStorage for interceptor to pick up
          // This ensures the token is available even before Zustand persist writes it
          try {
            const currentStorage = localStorage.getItem('auth-storage')
            let authData = { state: {} }
            if (currentStorage) {
              authData = JSON.parse(currentStorage)
            }
            authData.state = {
              ...authData.state,
              user: userData,
              token: accessToken,
              isAuthenticated: true,
            }
            localStorage.setItem('auth-storage', JSON.stringify(authData))
          } catch (e) {
            console.error('Error storing auth in localStorage:', e)
          }
          
          set({
            user: userData,
            token: accessToken,
            isAuthenticated: true,
          })
          
          // Set token in API client defaults (for immediate use)
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return { success: true, user: userData }
        } catch (error) {
          console.error('Login error:', error)
          return { success: false, error: error.response?.data?.detail || 'Login failed' }
        }
      },
      
      signup: async (email, password, name, phone, country) => {
        try {
          const response = await api.post('/auth/signup', {
            email,
            password,
            name,
            phone,
            country,
          })
          
          const userData = response.data.user
          const accessToken = response.data.access_token
          
          set({
            user: userData,
            token: accessToken,
            isAuthenticated: true,
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return { success: true, user: userData }
        } catch (error) {
          console.error('Signup error:', error)
          const errorMessage = error.response?.data?.detail || error.message || 'Signup failed'
          return { success: false, error: errorMessage }
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        delete api.defaults.headers.common['Authorization']
      },
      
      setToken: (token) => {
        set({ token })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

