import React, { useState, useEffect, useRef } from 'react'
import { Search, Send, LogOut, MessageSquare, Bot, User, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

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
  const { logout, user } = useAuthStore()
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
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Debounced search
  const debouncedSearch = useRef(
    debounce(async (term) => {
      setPage(1)
      await loadConversations(1, term)
    }, 500)
  ).current

  useEffect(() => {
    if (searchTerm !== undefined) {
      debouncedSearch(searchTerm)
    }
  }, [searchTerm, debouncedSearch])

  useEffect(() => {
    loadConversations(page, searchTerm)
  }, [page])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id)
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedConversation.conversation_id, true)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  const loadConversations = async (pageNum = 1, search = '') => {
    setLoading(true)
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
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await api.get(`/ops/conversations/${conversationId}/messages`, {
        params: { limit: 50 }
      })
      setMessages(response.data || [])
      // Scroll to bottom after loading
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleTakeover = async () => {
    if (!selectedConversation) return
    try {
      await api.post(`/ops/conversations/${selectedConversation.conversation_id}/takeover`)
      // Reload conversations to update mode
      await loadConversations(page, searchTerm)
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
      // Reload conversations to update mode
      await loadConversations(page, searchTerm)
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
      // Reload messages
      await loadMessages(selectedConversation.conversation_id)
      // Reload conversations to update last_message_at
      await loadConversations(page, searchTerm)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatPhone = (phone) => {
    // Format whatsapp:+880... to +880...
    return phone.replace('whatsapp:', '')
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`
    return date.toLocaleDateString()
  }

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
                <button
                  key={conv.conversation_id}
                  onClick={() => {
                    setSelectedConversation(conv)
                    setSidebarOpen(false) // Close sidebar on mobile
                  }}
                  className={`w-full p-3 border-b border-gray-100 hover:bg-gray-50 text-left ${
                    selectedConversation?.conversation_id === conv.conversation_id
                      ? 'bg-green-50 border-l-4 border-l-green-600'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">
                          {conv.display_name || formatPhone(conv.external_from)}
                        </span>
                        {conv.mode === 'HUMAN' && (
                          <Shield className="w-4 h-4 text-green-600 flex-shrink-0" title="Human Mode" />
                        )}
                        {conv.mode === 'AI' && (
                          <Bot className="w-4 h-4 text-gray-400 flex-shrink-0" title="AI Mode" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.last_message_preview || 'No messages'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                </button>
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
                  <h2 className="font-semibold text-gray-900">
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
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.sender_type === 'ai' && <Bot className="w-4 h-4" />}
                          {msg.sender_type === 'ops' && <Shield className="w-4 h-4" />}
                          {msg.sender_type === 'user' && <User className="w-4 h-4" />}
                          <span className="text-xs opacity-75">
                            {msg.sender_type === 'ops' ? 'Ops' : msg.sender_type === 'ai' ? 'AI' : 'User'}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
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
    </div>
  )
}
