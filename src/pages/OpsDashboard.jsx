import React, { useState, useEffect, useRef } from 'react'
import { Search, Send, LogOut, MessageSquare, Bot, User, Shield, Pin, Ban } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import ContextMenu from '../components/ContextMenu'

// Constants
const POLL_INTERVAL_MS = 120000 // Poll conversations every 2 minutes (120 seconds)
const MESSAGE_POLL_INTERVAL_MS = 120000 // Poll messages every 2 minutes (120 seconds)
const TYPING_DEBOUNCE_MS = 800

// Simple debounce function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function OpsDashboard() {
  const navigate = useNavigate()
  const { logout, user, isAuthenticated } = useAuthStore()
  
  // State declarations (must be before early return)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // New state for WhatsApp-like features
  const [toast, setToast] = useState({ visible: false, message: '', conversationId: null })
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, type: null, conversation: null, reason: '' })
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, conversation: null })
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [lastSeenMessageAt, setLastSeenMessageAt] = useState(null)
  const [messagePage, setMessagePage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const scrollPositionRef = useRef(0)
  const isOpsUserRef = useRef(false) // Track if user is OPS to prevent stale closures
  
  // Check if user is OPS - update ref immediately
  const isOpsUser = isAuthenticated && user?.role === 'ops'
  isOpsUserRef.current = isOpsUser // Update ref immediately for use in intervals
  
  // Check if user is OPS - redirect if not (double check even though route guard exists)
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ops') {
      isOpsUserRef.current = false // Ensure ref is false
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, user, navigate])
  
  // Early return if not OPS user (prevents polling and rendering)
  // This must be AFTER all hooks and state declarations
  if (!isOpsUser) {
    isOpsUserRef.current = false // Ensure ref is false
    return null
  }

  // Debounced search
  const debouncedSearch = useRef(
    debounce(async (term) => {
      // Only search if user is OPS
      if (isOpsUserRef.current) {
        setPage(1)
        await loadConversations(1, term, true)
      }
    }, 500)
  ).current

  // Debounced typing indicator
  const debouncedTyping = useRef(
    debounce(async (conversationId, isTyping) => {
      // Guard: Don't make API calls if user is not OPS
      if (!isOpsUserRef.current || !conversationId) {
        return
      }
      
      try {
        await api.post(`/ops/conversations/${conversationId}/typing`, { is_typing: isTyping })
      } catch (error) {
        // Silent fail for typing indicator
      }
    }, TYPING_DEBOUNCE_MS)
  ).current

  useEffect(() => {
    // Guard: Don't do anything if user is not OPS
    if (!isOpsUserRef.current) {
      return
    }
    
    // Only search if user is OPS
    if (searchTerm !== undefined) {
      debouncedSearch(searchTerm)
    }
  }, [searchTerm, debouncedSearch, isOpsUserRef.current])

  // Poll conversations periodically - only when page is visible and user is OPS
  useEffect(() => {
    // Guard: Don't start polling if user is not OPS
    if (!isOpsUserRef.current) {
      return
    }
    
    let interval = null
    
    const startPolling = () => {
      // Double check before starting each poll
      if (document.visibilityState === 'visible' && isOpsUserRef.current) {
        // Load immediately when polling starts
        loadConversations(page, searchTerm, false)
        
        interval = setInterval(() => {
          // Check ref before each poll request (avoids stale closure)
          if (isOpsUserRef.current && document.visibilityState === 'visible') {
            loadConversations(page, searchTerm, true)
          } else {
            // Stop polling if user is no longer OPS or page is hidden
            if (interval) {
              clearInterval(interval)
              interval = null
            }
          }
        }, POLL_INTERVAL_MS)
      }
    }
    
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
    
    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOpsUserRef.current) {
        stopPolling() // Stop existing before starting new
        startPolling()
      } else {
        stopPolling()
      }
    }
    
    // Start polling if visible and logged in as OPS
    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [page, searchTerm]) // Remove isOpsUser to prevent infinite re-renders

  // Handle selected conversation - only poll when page is visible and user is OPS
  useEffect(() => {
    // Guard: Don't start polling if user is not OPS
    if (!isOpsUserRef.current) {
      return
    }
    
    let interval = null
    
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id, false)
      markAsRead(selectedConversation.conversation_id)
      
      const startMessagePolling = () => {
        if (document.visibilityState === 'visible' && isOpsUserRef.current) {
          interval = setInterval(() => {
            // Check ref before each poll request (avoids stale closure)
            if (isOpsUserRef.current && document.visibilityState === 'visible' && selectedConversation) {
              loadMessages(selectedConversation.conversation_id, true)
            } else {
              // Stop polling if user is no longer OPS or page is hidden
              if (interval) {
                clearInterval(interval)
                interval = null
              }
            }
          }, MESSAGE_POLL_INTERVAL_MS)
        }
      }
      
      const stopMessagePolling = () => {
        if (interval) {
          clearInterval(interval)
          interval = null
        }
      }
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isOpsUserRef.current) {
          stopMessagePolling() // Stop existing before starting new
          startMessagePolling()
        } else {
          stopMessagePolling()
        }
      }
      
      startMessagePolling()
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        stopMessagePolling()
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [selectedConversation]) // Remove isOpsUser to prevent infinite re-renders

  // Check scroll position
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const atBottom = scrollHeight - scrollTop - clientHeight < 50
      const atTop = scrollTop < 100 // Near top of messages
      setIsAtBottom(atBottom)
      
      // Store scroll position for debugging
      scrollPositionRef.current = scrollTop
      
      // Load more messages when scrolling to top
      if (atTop && hasMore && !loadingMore && messages.length > 0) {
        setMessagePage(prev => prev + 1)
      }
      
      // Auto-scroll to bottom only if user is at bottom and new message arrives
      if (atBottom && lastSeenMessageAt) {
        const latestMessage = messages[messages.length - 1]
        if (latestMessage && new Date(latestMessage.created_at) > lastSeenMessageAt) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [messages, lastSeenMessageAt])

  // Load more messages when page changes
  useEffect(() => {
    if (selectedConversation && messagePage > 1 && hasMore && !loadingMore) {
      loadMessages(selectedConversation.conversation_id, true, true)
    }
  }, [messagePage, selectedConversation, hasMore, loadingMore])

  const loadConversations = async (pageNum = 1, search = '', silent = false) => {
    // Guard: Don't make API calls if user is not OPS
    if (!isOpsUserRef.current) {
      return
    }
    
    if (!silent) setLoading(true)
    try {
      const response = await api.get('/ops/conversations', {
        params: { page: pageNum, page_size: 30, search }
      })
      if (pageNum === 1) {
        setConversations(response.data.items || [])
      } else {
        setConversations(prev => [...prev, ...(response.data.items || [])])
      }
      setHasMore(response.data.page < response.data.total_pages)
      
      // Update selected conversation if it exists
      if (selectedConversation) {
        const updated = response.data.items?.find(c => c.conversation_id === selectedConversation.conversation_id)
        if (updated) {
          setSelectedConversation(updated)
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const loadMessages = async (conversationId, silent = false, loadMore = false) => {
    // Guard: Don't make API calls if user is not OPS
    if (!isOpsUserRef.current) {
      return
    }
    
    if (loadMore) {
      setLoadingMore(true)
    } else if (!silent) {
      setLoading(true)
      setMessagePage(1) // Reset to page 1 for new conversation
      setMessages([]) // Clear messages for new conversation
      
      // Fallback timeout to ensure loading is never stuck
      const loadingTimeout = setTimeout(() => {
        setLoading(false)
      }, 5000) // Clear loading after 5 seconds max
      
      // Store timeout ID to clear it later
      window.loadingTimeout = loadingTimeout
    }
    
    try {
      const response = await api.get(`/ops/conversations/${conversationId}/messages`, {
        params: { page: messagePage, limit: 30 }
      })
      
      // Debug: Log the response structure
      console.log('Messages API Response:', response)
      
      // Handle the correct API response structure
      // API returns response.data as array directly, not wrapped in object
      const newMessages = Array.isArray(response.data) ? response.data : []
      const currentPage = 1 // Default since API doesn't provide pagination
      const totalPages = 1 // Default since API doesn't provide pagination
      const totalCount = newMessages.length
      
      if (loadMore) {
        // Append messages for load more
        setMessages(prev => [...prev, ...newMessages])
        setHasMore(currentPage < totalPages)
        setTotalMessages(totalCount)
      } else {
        // Set messages for initial load
        setMessages(newMessages)
        setHasMore(currentPage < totalPages)
        setTotalMessages(totalCount)
      }
      
      // Update last seen message timestamp
      if (newMessages.length > 0) {
        const latest = newMessages[newMessages.length - 1]
        setLastSeenMessageAt(new Date(latest.created_at))
      }
      
      // Check for new inbound messages (only on initial load)
      if (!loadMore && lastSeenMessageAt && newMessages.length > 0) {
        const latestInbound = newMessages
          .filter(m => m.direction === 'in')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        
        if (latestInbound && new Date(latestInbound.created_at) > lastSeenMessageAt) {
          if (!isAtBottom) {
            const conv = conversations.find(c => c.conversation_id === conversationId)
            setToast({
              visible: true,
              message: `New message from ${conv?.display_name || formatPhone(conv?.external_from || '')}`,
              conversationId
            })
          } else {
            // Auto-scroll and mark read if at bottom
            markAsRead(conversationId)
          }
        }
      }
      
      // Scroll to bottom only for new messages or when at bottom
      if (!loadMore && (isAtBottom || !silent)) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else if (loadMore) {
        // Don't auto-scroll when loading more messages
        setTimeout(() => {
          // Maintain current scroll position
          const container = messagesContainerRef.current
          if (container && scrollPositionRef.current !== null) {
            container.scrollTop = scrollPositionRef.current + 100
          }
        }, 100)
      }
      
    } catch (error) {
      console.error('Error loading messages:', error)
      // Always clear loading state on error
      if (loadMore) {
        setLoadingMore(false)
      } else if (!silent) {
        setLoading(false)
      }
    } finally {
      // Always clear loading state
      if (loadMore) {
        setLoadingMore(false)
      } else if (!silent) {
        setLoading(false)
        // Clear the fallback timeout if it exists
        if (window.loadingTimeout) {
          clearTimeout(window.loadingTimeout)
          window.loadingTimeout = null
        }
      }
    }
  }
  
  const markAsRead = async (conversationId) => {
    // Guard: Don't make API calls if user is not OPS
    if (!isOpsUserRef.current) {
      return
    }
    
    try {
      await api.post(`/ops/conversations/${conversationId}/mark-read`)
      // Update local state
      setConversations(prev => prev.map(c => 
        c.conversation_id === conversationId 
          ? { ...c, unread_count: 0 }
          : c
      ))
      if (selectedConversation?.conversation_id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, unread_count: 0 } : null)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }
    
  const handleTakeover = async () => {
    if (!selectedConversation) return
    try {
      await api.post(`/ops/conversations/${selectedConversation.conversation_id}/takeover`)
      await loadConversations(page, searchTerm, true)
      setSelectedConversation(prev => prev ? { ...prev, mode: 'HUMAN' } : null)
    } catch (error) {
      console.error('Error taking over:', error)
      alert('Failed to take over conversation')
    }
  }

  const handleRelease = async () => {
    if (!selectedConversation) return
    try {
      await api.post(`/ops/conversations/${selectedConversation.conversation_id}/release`)
      await loadConversations(page, searchTerm, true)
      setSelectedConversation(prev => prev ? { ...prev, mode: 'AI' } : null)
    } catch (error) {
      console.error('Error releasing:', error)
      alert('Failed to release conversation')
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return
    
    setSending(true)
    try {
      await api.post(`/ops/conversations/${selectedConversation.conversation_id}/send`, {
        text: messageText.trim()
      })
      setMessageText('')
      
      // Send typing false
      debouncedTyping(selectedConversation.conversation_id, false)
      
      await loadMessages(selectedConversation.conversation_id, false)
      await loadConversations(page, searchTerm, true)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handlePin = async (conversationId) => {
    try {
      await api.post(`/ops/conversations/${conversationId}/pin`, { pinned: true })
      await loadConversations(page, searchTerm, true)
    } catch (error) {
      console.error('Error pinning:', error)
      alert('Failed to pin conversation')
    }
  }

  const handleUnpin = async (conversationId) => {
    try {
      await api.post(`/ops/conversations/${conversationId}/pin`, { pinned: false })
      await loadConversations(page, searchTerm, true)
    } catch (error) {
      console.error('Error unpinning:', error)
      alert('Failed to unpin conversation')
    }
  }

  const handleBlock = async (conversationId, reason = '') => {
    try {
      await api.post(`/ops/conversations/${conversationId}/block`, { blocked: true, reason })
      await loadConversations(page, searchTerm, true)
      if (selectedConversation?.conversation_id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, blocked: true } : null)
      }
    } catch (error) {
      console.error('Error blocking:', error)
      alert('Failed to block conversation')
    }
  }

  const handleUnblock = async (conversationId) => {
    try {
      await api.post(`/ops/conversations/${conversationId}/block`, { blocked: false })
      await loadConversations(page, searchTerm, true)
      if (selectedConversation?.conversation_id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, blocked: false } : null)
      }
    } catch (error) {
      console.error('Error unblocking:', error)
      alert('Failed to unblock conversation')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/ops/conversations/${selectedConversation.conversation_id}/messages/${messageId}`)
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      setTotalMessages(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const handleDeleteConversation = async (conversationId) => {
    try {
      await api.delete(`/ops/conversations/${conversationId}`)
      await loadConversations(page, searchTerm, true)
      if (selectedConversation?.conversation_id === conversationId) {
        setSelectedConversation(null)
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete conversation')
    }
  }

  const handleLogout = () => {
    // Stop all polling before logout
    // The useEffect cleanup will handle intervals, but we ensure it's immediate
    logout()
    navigate('/')
  }
  
  // Cleanup on unmount (when component unmounts, e.g., on logout)
  useEffect(() => {
    return () => {
      // Cleanup function - all intervals will be cleared by their respective useEffect cleanup
      // This is just a safety net
    }
  }, [])

  const formatPhone = (phone) => {
    return phone?.replace('whatsapp:', '') || ''
  }

  // WhatsApp-like time formatting
  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (messageDate.getTime() === today.getTime()) {
      // Today: HH:MM
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (messageDate.getTime() === yesterday.getTime()) {
      // Yesterday
      return 'Yesterday'
    } else {
      // Date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Context menu handlers
  const handleContextMenu = (e, conversation) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX || e.touches?.[0]?.clientX || 0,
      y: e.clientY || e.touches?.[0]?.clientY || 0,
      conversation
    })
  }

  const handleLongPress = (conversation) => {
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({
        visible: true,
        x: 0,
        y: 0,
        conversation
      })
    }, 450)
  }

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Typing indicator
  useEffect(() => {
    // Guard: Don't send typing indicator if user is not OPS
    if (!isOpsUserRef.current) {
      return
    }
    
    if (messageText && selectedConversation) {
      debouncedTyping(selectedConversation.conversation_id, true)
    } else if (selectedConversation) {
      debouncedTyping(selectedConversation.conversation_id, false)
    }
  }, [messageText, selectedConversation])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 hover:bg-green-700 rounded"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">WhatsApp Inbox</h1>
        </div>
        <div className="flex items-center gap-2">
          {messageText && selectedConversation && (
            <span className="text-xs opacity-75">Typing...</span>
          )}
          <span className="text-sm">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-green-700 rounded"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversations */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 absolute lg:static z-20 w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 h-full`}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations found</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  onContextMenu={(e) => handleContextMenu(e, conv, null)}
                  onTouchStart={() => handleLongPress(conv, null)}
                  onTouchEnd={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                >
                  <button
                    onClick={() => {
                      setSelectedConversation(conv)
                      setSidebarOpen(false)
                      markAsRead(conv.conversation_id)
                    }}
                    className={`w-full p-3 border-b border-gray-100 hover:bg-gray-50 text-left relative ${
                      selectedConversation?.conversation_id === conv.conversation_id
                        ? 'bg-green-50 border-l-4 border-l-green-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {conv.pinned && (
                            <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                          {conv.blocked && (
                            <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className={`font-semibold truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {conv.display_name || formatPhone(conv.external_from)}
                          </span>
                          {conv.mode === 'HUMAN' && (
                            <Shield className="w-4 h-4 text-green-600 flex-shrink-0" title="Human Mode" />
                          )}
                          {conv.mode === 'AI' && (
                            <Bot className="w-4 h-4 text-gray-400 flex-shrink-0" title="AI Mode" />
                          )}
                        </div>
                        <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                          {conv.last_message_preview || 'No messages'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">
                          {formatTime(conv.last_message_at)}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="bg-green-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {conv.unread_count > 99 ? '99+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Right Panel - Messages */}
        <main className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    {selectedConversation.pinned && <Pin className="w-4 h-4 text-yellow-500" />}
                    {selectedConversation.blocked && <Ban className="w-4 h-4 text-red-500" />}
                    {selectedConversation.display_name || formatPhone(selectedConversation.external_from)}
                  </h2>
                  <p className="text-sm text-gray-500">{formatPhone(selectedConversation.external_from)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.mode === 'AI' ? (
                    <button
                      onClick={handleTakeover}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      Take Over
                    </button>
                  ) : (
                    <button
                      onClick={handleRelease}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                    >
                      Release to AI
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {loading && messages.length === 0 ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.direction === 'out' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] lg:max-w-[60%] rounded-lg px-4 py-2 ${
                          msg.direction === 'out'
                            ? msg.sender_type === 'ops'
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.sender_type === 'ai' && <Bot className="w-4 h-4 text-blue-500" />}
                          {msg.sender_type === 'ops' && <Shield className="w-4 h-4 text-green-600" />}
                          {msg.sender_type === 'user' && <User className="w-4 h-4 text-gray-600" />}
                          <span className="text-xs opacity-75">
                            {msg.sender_type === 'ops' ? 'Ops' : msg.sender_type === 'ai' ? 'AI' : 'User'}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-gray-800">{msg.body}</p>
                        <span className="text-xs opacity-75 mt-1 block">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 p-3">
                {selectedConversation.blocked ? (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    User is blocked. Unblock to reply.
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        onBlur={() => {
                          if (selectedConversation) {
                            debouncedTyping(selectedConversation.conversation_id, false)
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={sending || selectedConversation.mode === 'AI'}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sending || selectedConversation.mode === 'AI'}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {selectedConversation.mode === 'AI' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Take over the conversation to send messages manually
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        conversationId={toast.conversationId}
        onClose={() => setToast({ visible: false, message: '', conversationId: null })}
        onJumpTo={(conversationId) => {
          const conv = conversations.find(c => c.conversation_id === conversationId)
          if (conv) {
            setSelectedConversation(conv)
            markAsRead(conversationId)
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        visible={confirmDialog.visible}
        title={
          confirmDialog.type === 'delete' ? 'Delete Conversation' :
          confirmDialog.type === 'delete-message' ? 'Delete Message' :
          confirmDialog.type === 'block' ? 'Block User' :
          confirmDialog.type === 'unblock' ? 'Unblock User' : ''
        }
        message={
          confirmDialog.type === 'delete' ? 'Are you sure you want to delete this conversation? This action cannot be undone.' :
          confirmDialog.type === 'delete-message' ? 'Are you sure you want to delete this message? This action cannot be undone.' :
          confirmDialog.type === 'block' ? 'Are you sure you want to block this user? AI will not reply to their messages (cost control).' :
          confirmDialog.type === 'unblock' ? 'Are you sure you want to unblock this user?' : ''
        }
        onConfirm={() => {
          if (confirmDialog.type === 'delete' && confirmDialog.conversation) {
            handleDeleteConversation(confirmDialog.conversation.conversation_id)
          } else if (confirmDialog.type === 'delete-message' && confirmDialog.message) {
            handleDeleteMessage(confirmDialog.message.id)
          } else if (confirmDialog.type === 'block' && confirmDialog.conversation) {
            handleBlock(confirmDialog.conversation.conversation_id, confirmDialog.reason)
          } else if (confirmDialog.type === 'unblock' && confirmDialog.conversation) {
            handleUnblock(confirmDialog.conversation.conversation_id)
          }
          setConfirmDialog({ visible: false, type: null, conversation: null, reason: '', message: null })
        }}
        onCancel={() => setConfirmDialog({ visible: false, type: null, conversation: null, reason: '', message: null })}
      />

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        conversation={contextMenu.conversation}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, conversation: null })}
        onPin={handlePin}
        onUnpin={handleUnpin}
        onBlock={(id) => {
          const conv = conversations.find(c => c.conversation_id === id)
          setConfirmDialog({ visible: true, type: 'block', conversation: conv, reason: '' })
        }}
        onUnblock={(id) => {
          const conv = conversations.find(c => c.conversation_id === id)
          setConfirmDialog({ visible: true, type: 'unblock', conversation: conv, reason: '' })
        }}
        onDelete={(id) => {
          const conv = conversations.find(c => c.conversation_id === id)
          setConfirmDialog({ visible: true, type: 'delete', conversation: conv, reason: '' })
        }}
      />
    </div>
  )
}

