import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Upload, FileText, User, Bot, LogIn, LogOut, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import ReactMarkdown from 'react-markdown'
import LeadCaptureModal from '../components/LeadCaptureModal'
import DocumentUploadModal from '../components/DocumentUploadModal'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [showApplicationsSidebar, setShowApplicationsSidebar] = useState(false)
  const [applications, setApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [deviceFingerprint] = useState(() => {
    // Generate or retrieve device fingerprint
    let fp = localStorage.getItem('device_fingerprint')
    if (!fp) {
      fp = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('device_fingerprint', fp)
    }
    return fp
  })
  
  // Generate or retrieve chat_session_id for this chat session
  const [chatSessionId] = useState(() => {
    // Generate a new chat session ID for each new chat
    // This ensures each chat window/tab has its own session
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })
  
  const messagesEndRef = useRef(null)
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Show lead modal after 3 messages from user
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user')
    const leadSubmitted = localStorage.getItem('lead_submitted') === 'true'
    const leadDismissed = localStorage.getItem('lead_dismissed') === 'true'
    
    if (userMessages.length >= 3 && !isAuthenticated && !showLeadModal && !leadSubmitted && !leadDismissed) {
      setShowLeadModal(true)
    }
  }, [messages, isAuthenticated, showLeadModal])

  // Load applications for logged-in students
  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      loadApplications()
    }
  }, [isAuthenticated, user])

  const loadApplications = async () => {
    setLoadingApplications(true)
    try {
      const response = await api.get('/students/applications')
      setApplications(response.data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      setApplications([])
    } finally {
      setLoadingApplications(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'under_review':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'under_review':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }
  
  const sendMessage = async () => {
    if (!input.trim() || loading) return
    
    const messageToSend = input.trim()
    const userMessage = { role: 'user', content: messageToSend }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      // Get auth token properly
      let authToken = null
      if (isAuthenticated) {
        try {
          const authStorage = localStorage.getItem('auth-storage')
          if (authStorage) {
            const parsed = JSON.parse(authStorage)
            authToken = parsed.state?.token
          }
        } catch (e) {
          console.error('Error getting auth token:', e)
        }
      }
      
      // Use streaming endpoint
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBaseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && {
            'Authorization': `Bearer ${authToken}`
          })
        },
        body: JSON.stringify({
          message: messageToSend,
          device_fingerprint: deviceFingerprint,
          chat_session_id: chatSessionId,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to send message: ${response.status} ${errorText}`)
      }
      
      // Add assistant message placeholder
      let assistantMessageIndex = -1
      setMessages(prev => {
        const newMessages = [...prev, { role: 'assistant', content: '' }]
        assistantMessageIndex = newMessages.length - 1
        return newMessages
      })
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.error) {
                  throw new Error(data.error)
                }
                // DEBUG: Log all data chunks
                if (data.done || data.show_lead_form !== undefined) {
                  console.log('DEBUG: Received data chunk:', data)
                }
                if (data.content && data.content.trim()) {
                // Prevent duplicate content by checking if we're not repeating the same chunk
                const newContent = data.content
                // Only append if the new content doesn't already exist at the end
                if (accumulatedContent.length === 0 || !accumulatedContent.endsWith(newContent)) {
                  accumulatedContent += newContent
                  // Update the specific assistant message by index
                  setMessages(prev => {
                    const newMessages = [...prev]
                    if (assistantMessageIndex >= 0 && assistantMessageIndex < newMessages.length) {
                      newMessages[assistantMessageIndex] = {
                        ...newMessages[assistantMessageIndex],
                        content: accumulatedContent
                      }
                    }
                    return newMessages
                  })
                }
              }
              if (data.done) {
                // Final cleanup: remove obvious duplicate paragraphs/sentences
                setMessages(prev => {
                  const newMessages = [...prev]
                  if (assistantMessageIndex >= 0 && assistantMessageIndex < newMessages.length) {
                    let finalContent = accumulatedContent
                    // Remove duplicate consecutive paragraphs (simple heuristic)
                    const paragraphs = finalContent.split('\n\n')
                    const uniqueParagraphs = []
                    for (let i = 0; i < paragraphs.length; i++) {
                      const para = paragraphs[i].trim()
                      // Only add if it's not the same as the previous paragraph
                      if (para && (uniqueParagraphs.length === 0 || uniqueParagraphs[uniqueParagraphs.length - 1] !== para)) {
                        uniqueParagraphs.push(para)
                      }
                    }
                    finalContent = uniqueParagraphs.join('\n\n')
                    
                    newMessages[assistantMessageIndex] = {
                      ...newMessages[assistantMessageIndex],
                      content: finalContent
                    }
                  }
                  return newMessages
                })
                
                // Check if we should show lead form
                console.log('DEBUG: Final chunk received:', { 
                  show_lead_form: data.show_lead_form, 
                  show_lead_form_type: typeof data.show_lead_form,
                  isAuthenticated, 
                  done: data.done,
                  allDataKeys: Object.keys(data)
                })
                
                // Use strict check for show_lead_form (must be exactly true)
                if (data.show_lead_form === true && !isAuthenticated) {
                  const leadSubmitted = localStorage.getItem('lead_submitted') === 'true'
                  const leadDismissed = localStorage.getItem('lead_dismissed') === 'true'
                  console.log('DEBUG: Lead form check:', { 
                    leadSubmitted, 
                    leadDismissed, 
                    willShow: !leadSubmitted 
                  })
                  
                  // If backend explicitly requests lead form (show_lead_form: true), 
                  // show it regardless of previous dismissal (only check if already submitted)
                  // The dismissal flag should only prevent automatic "after 3 messages" trigger,
                  // not explicit backend requests
                  if (!leadSubmitted) {
                    console.log('DEBUG: Backend requested lead form - showing despite previous dismissal')
                    // Clear dismissal flag since backend is explicitly requesting the form
                    localStorage.removeItem('lead_dismissed')
                    // Use setTimeout to ensure state update happens after render
                    setTimeout(() => {
                      setShowLeadModal(true)
                      console.log('DEBUG: showLeadModal state should now be true')
                    }, 0)
                  } else {
                    console.log('DEBUG: Lead form blocked because lead already submitted')
                  }
                } else {
                  console.log('DEBUG: Lead form not shown because:', { 
                    show_lead_form: data.show_lead_form, 
                    show_lead_form_strict: data.show_lead_form === true,
                    isAuthenticated 
                  })
                }
                
                break
              }
            } catch (e) {
              if (e.message && e.message.includes('error')) {
                throw e
              }
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Please check your connection and try again.'}`,
      }])
    } finally {
      setLoading(false)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Applications Sidebar for Students */}
      {isAuthenticated && user?.role === 'student' && (
        <>
          {showApplicationsSidebar && (
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">My Applications</h2>
                <button
                  onClick={() => setShowApplicationsSidebar(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {loadingApplications ? (
                  <div className="text-center py-8 text-gray-500">Loading applications...</div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-4">No applications yet</p>
                    <p className="text-xs text-gray-400">Start a conversation to apply to programs</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm text-gray-900 mb-1">
                              {app.university_name}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1">{app.major_name}</p>
                            <p className="text-xs text-gray-500">
                              {app.intake_term} {app.intake_year}
                            </p>
                          </div>
                          {getStatusIcon(app.status)}
                        </div>
                        
                        <div className={`mt-2 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(app.status)}`}>
                          {app.status.replace('_', ' ').toUpperCase()}
                        </div>
                        
                        {app.application_fee && (
                          <div className="mt-2 text-xs text-gray-600">
                            Fee: {app.application_fee} RMB
                            {app.application_fee_paid ? (
                              <span className="ml-2 text-green-600">✓ Paid</span>
                            ) : (
                              <span className="ml-2 text-orange-600">Pending</span>
                            )}
                          </div>
                        )}
                        
                        {app.result && (
                          <div className="mt-2 text-xs text-gray-600">
                            Result: <span className="font-medium">{app.result}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!showApplicationsSidebar && (
            <button
              onClick={() => setShowApplicationsSidebar(true)}
              className="fixed left-4 top-20 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 z-10"
              title="Show Applications"
            >
              <FileText className="w-5 h-5" />
            </button>
          )}
        </>
      )}
      
      <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">MalishaEdu AI Agent</h1>
            <p className="text-xs text-gray-500">Your China Education Advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {user?.role === 'student' && (
                <>
                  <button
                    onClick={() => setShowApplicationsSidebar(!showApplicationsSidebar)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <FileText className="w-4 h-4" />
                    Applications ({applications.length})
                  </button>
                  <button
                    onClick={() => setShowDocModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Upload className="w-4 h-4" />
                    Documents
                  </button>
                </>
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <FileText className="w-4 h-4" />
                  Dashboard
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4" />
              Login / Sign Up
            </button>
          )}
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-700 mb-1">
                Welcome to MalishaEdu AI Agent
              </h2>
              <p className="text-sm text-gray-500">
                Ask me about Chinese universities, programs, scholarships, and more!
              </p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="mb-2 ml-4 list-disc space-y-0.5" {...props} />,
                        ol: ({node, ...props}) => <ol className="mb-2 ml-4 list-decimal space-y-0.5" {...props} />,
                        li: ({node, ...props}) => <li className="text-sm" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-base font-semibold mb-1.5 mt-2 first:mt-0" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-sm font-semibold mb-1 mt-2 first:mt-0" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-medium mb-1 mt-1.5 first:mt-0" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
              
              {msg.role === 'user' && (
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Chinese universities, programs, scholarships..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showLeadModal && (
        <LeadCaptureModal
          onClose={() => setShowLeadModal(false)}
          deviceFingerprint={deviceFingerprint}
          chatSessionId={chatSessionId}
        />
      )}
      
      {showDocModal && (
        <DocumentUploadModal
          onClose={() => setShowDocModal(false)}
          onUploadComplete={loadApplications}
        />
      )}
    </div>
    </div>
  )
}

