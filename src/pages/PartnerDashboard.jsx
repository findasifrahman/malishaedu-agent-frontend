import React, { useState, useEffect, useRef } from 'react'
import { BarChart3, Users, MessageCircle, Plus, Edit, Trash2, X, Loader2, User as UserIcon, Menu, X as XIcon, Send } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

export default function PartnerDashboard() {
  const navigate = useNavigate()
  const { logout, token, isAuthenticated, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    overview: false,
    students: false,
    chat: false
  })
  
  // Overview stats
  const [stats, setStats] = useState(null)
  
  // Students state
  const [students, setStudents] = useState([])
  const [studentsPage, setStudentsPage] = useState(1)
  const [studentsPageSize] = useState(20)
  const [studentsTotal, setStudentsTotal] = useState(0)
  const [studentsSearch, setStudentsSearch] = useState('')
  const [studentsSearchDebounced, setStudentsSearchDebounced] = useState('')
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [studentForm, setStudentForm] = useState({
    email: '', password: '', name: '', phone: '', country: ''
  })
  
  // Chat state
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const [chatSessionId] = useState(() => `partner_chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentsSearchDebounced(studentsSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [studentsSearch])
  
  // Check authentication and role
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'partner') {
      navigate('/login')
      return
    }
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    // Load initial data
    if (activeTab === 'overview') {
      loadStats()
    } else if (activeTab === 'students') {
      loadStudents(1, '')
    }
  }, [isAuthenticated, user, token, navigate, activeTab])
  
  // Load students when search changes
  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents(1, studentsSearchDebounced)
    }
  }, [studentsSearchDebounced, activeTab])
  
  const setLoading = (tab, loading) => {
    setLoadingStates(prev => ({ ...prev, [tab]: loading }))
  }
  
  const loadStats = async () => {
    setLoading('overview', true)
    try {
      const response = await api.get('/partners/me/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading('overview', false)
    }
  }
  
  const loadStudents = async (page = studentsPage, search = studentsSearchDebounced) => {
    setLoading('students', true)
    try {
      const response = await api.get(`/partners/me/students?page=${page}&page_size=${studentsPageSize}&search=${encodeURIComponent(search || '')}`)
      setStudents(response.data.items || [])
      setStudentsTotal(response.data.total || 0)
      setStudentsPage(page)
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([])
    } finally {
      setLoading('students', false)
    }
  }
  
  const handleCreateStudent = async () => {
    if (!studentForm.email.trim() || !studentForm.name.trim()) {
      alert('Email and name are required')
      return
    }
    if (!studentForm.password.trim()) {
      alert('Password is required')
      return
    }
    try {
      await api.post('/partners/me/students', {
        email: studentForm.email.trim(),
        password: studentForm.password,
        name: studentForm.name.trim(),
        phone: studentForm.phone.trim() || null,
        country: studentForm.country.trim() || null
      })
      alert('Student created successfully!')
      setShowStudentModal(false)
      resetStudentForm()
      loadStudents(1, studentsSearchDebounced)
    } catch (error) {
      console.error('Error creating student:', error)
      alert(error.response?.data?.detail || 'Failed to create student')
    }
  }
  
  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return
    }
    try {
      await api.delete(`/partners/me/students/${studentId}`)
      alert('Student deleted successfully!')
      loadStudents(studentsPage, studentsSearchDebounced)
    } catch (error) {
      console.error('Error deleting student:', error)
      alert(error.response?.data?.detail || 'Failed to delete student')
    }
  }
  
  const resetStudentForm = () => {
    setStudentForm({
      email: '', password: '', name: '', phone: '', country: ''
    })
  }
  
  const scrollChatToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollChatToBottom()
  }, [messages])

  const sendChatMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatLoading(true)

    const newMessage = { role: 'user', content: userMessage }
    setMessages(prev => [...prev, newMessage])

    try {
      const response = await api.post('/chat/', {
        message: userMessage,
        chat_session_id: chatSessionId
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response || response.data.message || 'I apologize, but I encountered an error processing your request.'
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setChatLoading(false)
    }
  }
  
  if (!isAuthenticated || user?.role !== 'partner') {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Partner Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.name || user?.email}</span>
            <button
              onClick={logout}
              className="px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static lg:translate-x-0 z-30 w-64 bg-white border-r border-gray-200 min-h-screen p-4 transition-transform duration-300 ease-in-out`}>
          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('overview')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.overview ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <BarChart3 className="w-5 h-5" />
              )}
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('students')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'students'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.students ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Users className="w-5 h-5" />
              )}
              Students
            </button>
            <button
              onClick={() => {
                setActiveTab('chat')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'chat'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.chat ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              Chat
            </button>
          </nav>
        </aside>
        
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
              {loadingStates.overview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_students || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Active Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active_applications || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Recent Students (7 days)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_students || 0}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Students</h2>
                <button
                  onClick={() => {
                    resetStudentForm()
                    setEditingStudent(null)
                    setShowStudentModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add New Student
                </button>
              </div>
              
              {/* Search */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <input
                  type="text"
                  placeholder="Search by name, email, phone, passport..."
                  value={studentsSearch}
                  onChange={(e) => setStudentsSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {loadingStates.students ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Country</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                No students found
                              </td>
                            </tr>
                          ) : (
                            students.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{student.id}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{student.full_name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.email || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.phone || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.country_of_citizenship || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => window.open(`/dashboard?partner_view=true&student_id=${student.id}`, '_blank')}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="View Student Dashboard"
                                    >
                                      <UserIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(student.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete Student"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Pagination */}
                  {studentsTotal > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg border border-gray-200 p-4 gap-4">
                      <div className="text-sm text-gray-700">
                        Showing {(studentsPage - 1) * studentsPageSize + 1} to {Math.min(studentsPage * studentsPageSize, studentsTotal)} of {studentsTotal} students
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadStudents(studentsPage - 1, studentsSearchDebounced)}
                          disabled={studentsPage === 1 || loadingStates.students}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-700">
                          Page {studentsPage} of {Math.ceil(studentsTotal / studentsPageSize)}
                        </span>
                        <button
                          onClick={() => loadStudents(studentsPage + 1, studentsSearchDebounced)}
                          disabled={studentsPage >= Math.ceil(studentsTotal / studentsPageSize) || loadingStates.students}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Create/Edit Student Modal */}
              {showStudentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingStudent ? 'Edit' : 'Create'} Student
                      </h3>
                      <button
                        onClick={() => {
                          setShowStudentModal(false)
                          setEditingStudent(null)
                          resetStudentForm()
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={studentForm.email}
                          onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          required
                          disabled={!!editingStudent}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          value={studentForm.password}
                          onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          required
                          disabled={!!editingStudent}
                          placeholder={editingStudent ? "Password cannot be changed here. Use Security tab in student dashboard." : "Enter password for student account"}
                        />
                        {editingStudent && (
                          <p className="text-xs text-gray-500 mt-1">
                            To change password, use the Security tab in the student dashboard.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={studentForm.name}
                          onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={studentForm.phone}
                          onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          value={studentForm.country}
                          onChange={(e) => setStudentForm({...studentForm, country: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleCreateStudent}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Create Student
                        </button>
                        <button
                          onClick={() => {
                            setShowStudentModal(false)
                            setEditingStudent(null)
                            resetStudentForm()
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Partner Assistant</h2>
              <PartnerChatWindow
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendChatMessage={sendChatMessage}
                chatLoading={chatLoading}
                chatEndRef={chatEndRef}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Partner Chat Window Component
function PartnerChatWindow({ messages, chatInput, setChatInput, sendChatMessage, chatLoading, chatEndRef }) {
  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <span className="font-semibold">Partner Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Ask me anything about MalishaEdu universities, majors, and programs!</p>
            <p className="text-sm mt-2">I can help you find information about:</p>
            <ul className="text-sm mt-2 text-left max-w-md mx-auto space-y-1">
              <li>• Universities and majors</li>
              <li>• Scholarship information</li>
              <li>• Document requirements</li>
              <li>• Fees and costs</li>
              <li>• Language requirements (HSK, IELTS, CSCA)</li>
              <li>• Bank guarantee amounts</li>
              <li>• Upcoming intakes and deadlines</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <ReactMarkdown className="text-sm">{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={sendChatMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about universities, majors, scholarships..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={chatLoading}
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {chatLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
