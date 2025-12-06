import axios from 'axios'

// Use environment variable for API URL, fallback to relative path for local dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token from storage on every request
api.interceptors.request.use(
  (config) => {
    // Skip adding token for auth endpoints (login/signup)
    const url = config.url || ''
    if (url.includes('/auth/login') || url.includes('/auth/signup')) {
      delete config.headers.Authorization
      // For login, ensure Content-Type is form-urlencoded (not JSON)
      if (url.includes('/auth/login')) {
        // Remove default JSON Content-Type and set form-urlencoded
        delete config.headers['Content-Type']
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      }
      return config
    }
    
    // Get token from localStorage on each request
    // This ensures we always have the latest token even after page refresh
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        const token = parsed.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          // Debug: log token for admin endpoints
          if (url.includes('/admin/')) {
            console.log('Setting Authorization header for admin request:', token.substring(0, 30) + '...')
          }
        } else {
          // If no token in storage, remove Authorization header
          delete config.headers.Authorization
          if (url.includes('/admin/')) {
            console.warn('No token found in auth storage for admin request')
          }
        }
      } else {
        // If no auth storage, remove Authorization header
        delete config.headers.Authorization
        if (url.includes('/admin/')) {
          console.warn('No auth storage found for admin request')
        }
      }
    } catch (e) {
      console.error('Error reading auth token:', e)
      delete config.headers.Authorization
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't clear auth on login/signup endpoints (they might return 401 for invalid credentials)
      const url = error.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/signup')) {
        // Log the error for debugging
        console.error('401 Unauthorized:', {
          url: error.config?.url,
          hasToken: !!error.config?.headers?.Authorization,
          tokenPreview: error.config?.headers?.Authorization?.substring(0, 30) + '...',
        })
        
        // Only clear and redirect if we're sure the token is invalid
        // Don't clear immediately - let the component handle it
        // This prevents redirect loops
        const currentPath = window.location.pathname
        if (currentPath === '/admin') {
          // If we're on admin page and getting 401, the token might be invalid
          // But don't redirect immediately - let the AdminRoute handle it
          console.warn('401 on admin endpoint - token may be invalid')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

