import axios from 'axios'

// Use environment variable for API URL, fallback to relative path for local dev
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Check if we're running on HTTPS (production)
const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:'
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// Ensure the URL has a protocol if it's not a relative path
if (API_BASE_URL !== '/api' && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  // If it's a domain without protocol, add https://
  API_BASE_URL = `https://${API_BASE_URL}`
}

// CRITICAL: Force HTTPS for production URLs (mixed content security)
// If the page is served over HTTPS, the API must also use HTTPS
if (isHTTPS && !isLocalhost) {
  // If we're on HTTPS (production), force API to use HTTPS
  if (API_BASE_URL.startsWith('http://')) {
    API_BASE_URL = API_BASE_URL.replace('http://', 'https://')
  }
  // Also ensure any URL without protocol uses HTTPS
  if (API_BASE_URL !== '/api' && !API_BASE_URL.startsWith('https://')) {
    API_BASE_URL = `https://${API_BASE_URL}`
  }
} else if (API_BASE_URL.startsWith('http://') && !API_BASE_URL.includes('localhost') && !isLocalhost) {
  // For non-localhost URLs, always prefer HTTPS
  API_BASE_URL = API_BASE_URL.replace('http://', 'https://')
}

// Ensure the URL ends with /api if it's an absolute URL
if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
  if (!API_BASE_URL.endsWith('/api')) {
    // Remove trailing slash if present, then add /api
    API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api'
  }
}

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('API Base URL configured:', API_BASE_URL)
  console.log('Page protocol:', typeof window !== 'undefined' ? window.location.protocol : 'N/A')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token from storage on every request
api.interceptors.request.use(
  (config) => {
    // CRITICAL: Prevent mixed content (HTTP requests from HTTPS pages)
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      const fullUrl = config.baseURL || API_BASE_URL
      const requestUrl = typeof config.url === 'string' ? config.url : ''
      const combinedUrl = fullUrl + requestUrl
      
      // If we detect an HTTP URL when on HTTPS, force it to HTTPS
      if (combinedUrl.startsWith('http://') && !combinedUrl.includes('localhost')) {
        console.error('⚠️ Mixed content detected! Converting HTTP to HTTPS:', combinedUrl)
        config.baseURL = config.baseURL?.replace('http://', 'https://') || API_BASE_URL.replace('http://', 'https://')
      }
    }
    
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

