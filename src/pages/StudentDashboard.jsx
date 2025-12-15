import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, Send, Camera, GraduationCap, FileText, Lock, 
  CheckCircle, Clock, XCircle, DollarSign, Award, MessageCircle,
  FileCheck, BookOpen, Plus, Edit, Trash2, X
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import ReactMarkdown from 'react-markdown'

export default function StudentDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('personal')
  const [studentProfile, setStudentProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const [chatSessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [extractedPassportData, setExtractedPassportData] = useState(null)
  const [showPassportAutofillNotice, setShowPassportAutofillNotice] = useState(false)

  // Check for admin/partner view mode
  const [adminViewMode, setAdminViewMode] = useState(false)
  const [partnerViewMode, setPartnerViewMode] = useState(false)
  const [viewingStudentId, setViewingStudentId] = useState(null)
  
  const loadStudentProfileAsAdmin = async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}/profile`)
      setStudentProfile(response.data)
    } catch (error) {
      console.error('Error loading student profile as admin:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadStudentProfileAsPartner = async (studentId) => {
    try {
      const response = await api.get(`/partners/me/students/${studentId}/profile`)
      setStudentProfile(response.data)
    } catch (error) {
      console.error('Error loading student profile as partner:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadApplicationsAsAdmin = async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}/applications`)
      setApplications(response.data || [])
    } catch (error) {
      console.error('Error loading applications as admin:', error)
    }
  }
  
  const loadApplicationsAsPartner = async (studentId) => {
    try {
      const response = await api.get(`/partners/me/students/${studentId}/applications`)
      setApplications(response.data || [])
    } catch (error) {
      console.error('Error loading applications as partner:', error)
    }
  }
  
  useEffect(() => {
    // Check URL params for admin/partner view FIRST
    const params = new URLSearchParams(window.location.search)
    const adminView = params.get('admin_view') === 'true'
    const partnerView = params.get('partner_view') === 'true'
    const studentId = params.get('student_id')
    
    // Admin view mode - allow admin to view any student's dashboard
    if (adminView && studentId) {
      if (isAuthenticated && user?.role === 'admin') {
        setAdminViewMode(true)
        setPartnerViewMode(false)
        setViewingStudentId(parseInt(studentId))
        loadStudentProfileAsAdmin(parseInt(studentId))
        loadApplicationsAsAdmin(parseInt(studentId))
        return
      } else {
        // Admin must be logged in to view student dashboard
        navigate('/login', { replace: true })
        return
      }
    }
    
    // Partner view mode - allow partner to view their students' dashboards
    if (partnerView && studentId) {
      if (isAuthenticated && user?.role === 'partner') {
        setAdminViewMode(false)
        setPartnerViewMode(true)
        setViewingStudentId(parseInt(studentId))
        loadStudentProfileAsPartner(parseInt(studentId))
        loadApplicationsAsPartner(parseInt(studentId))
        return
      } else {
        // Partner must be logged in to view student dashboard
        navigate('/login', { replace: true })
        return
      }
    }
    
    // Normal student view - only allow if user is a student
    if (!isAuthenticated || user?.role !== 'student') {
      navigate('/login', { replace: true })
      return
    }
    loadStudentProfile()
    loadApplications()
  }, [isAuthenticated, user, navigate])

  const loadStudentProfile = async () => {
    try {
      const response = await api.get('/students/me')
      setStudentProfile(response.data)
    } catch (error) {
      console.error('Error loading student profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async () => {
    try {
      const response = await api.get('/students/applications')
      setApplications(response.data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const profileComplete = studentProfile ? calculateProfileComplete(studentProfile) : 0
  const applicationsCount = applications.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin/Partner View Banner */}
      {adminViewMode && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-800" />
              <p className="text-sm font-medium text-yellow-800">
                Admin View Mode - Viewing: {studentProfile?.given_name && studentProfile?.family_name ? `${studentProfile.given_name} ${studentProfile.family_name}` : studentProfile?.full_name || studentProfile?.email || `Student ID: ${viewingStudentId}`}
              </p>
            </div>
            <button
              onClick={() => window.close()}
              className="text-sm text-yellow-800 hover:text-yellow-900 underline"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
      {partnerViewMode && (
        <div className="bg-blue-100 border-b border-blue-300 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-800" />
              <p className="text-sm font-medium text-blue-800">
                Partner View Mode - Viewing: {studentProfile?.given_name && studentProfile?.family_name ? `${studentProfile.given_name} ${studentProfile.family_name}` : studentProfile?.full_name || studentProfile?.email || `Student ID: ${viewingStudentId}`}
              </p>
            </div>
            <button
              onClick={() => window.close()}
              className="text-sm text-blue-800 hover:text-blue-900 underline"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        {/* Left Sidebar - User Profile */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {studentProfile?.given_name && studentProfile?.family_name ? `${studentProfile.given_name} ${studentProfile.family_name}` : studentProfile?.full_name || user?.name || 'Student'}
              </h2>
              <p className="text-gray-600 text-sm mb-4">{user?.email}</p>
              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium mx-auto mb-4">
                <Camera className="w-4 h-4" />
                Change Photo
              </button>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium mx-auto"
              >
                <Lock className="w-4 h-4" />
                Logout
              </button>
            </div>
            
            <div className="mt-6 space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Member Since</span>
                <span className="text-gray-800 font-medium text-sm">
                  {studentProfile?.created_at ? new Date(studentProfile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Applications</span>
                <span className="text-gray-800 font-medium text-sm">{applicationsCount}</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Profile Complete</span>
                  <span className="text-gray-800 font-medium text-sm">{profileComplete}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileComplete}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          {/* Main Form Area */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            {/* Tabs */}
            <div className="flex border-b mb-6 space-x-1">
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'personal'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <User className="w-4 h-4" />
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('programs')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'programs'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Programs
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'documents'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Documents
              </button>
              <button
                onClick={() => setActiveTab('passport')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'passport'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                Passport & Scores
              </button>
              <button
                onClick={() => setActiveTab('cova')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'cova'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                COVA
              </button>
              <button
                onClick={() => setActiveTab('additional')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'additional'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Additional Info
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'security'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Lock className="w-4 h-4" />
                Security
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'personal' && <PersonalInfoTab profile={studentProfile} onUpdate={(adminViewMode || partnerViewMode) ? (adminViewMode ? () => loadStudentProfileAsAdmin(viewingStudentId) : () => loadStudentProfileAsPartner(viewingStudentId)) : loadStudentProfile} extractedPassportData={extractedPassportData} onPassportDataUsed={() => setExtractedPassportData(null)} adminViewMode={adminViewMode} partnerViewMode={partnerViewMode} viewingStudentId={viewingStudentId} />}
            {activeTab === 'passport' && <PassportScoresTab profile={studentProfile} onUpdate={(adminViewMode || partnerViewMode) ? (adminViewMode ? () => loadStudentProfileAsAdmin(viewingStudentId) : () => loadStudentProfileAsPartner(viewingStudentId)) : loadStudentProfile} extractedPassportData={extractedPassportData} onPassportDataUsed={() => setExtractedPassportData(null)} adminViewMode={adminViewMode} partnerViewMode={partnerViewMode} viewingStudentId={viewingStudentId} />}
            {activeTab === 'programs' && <ProgramsTab applications={applications} onUpdate={(adminViewMode || partnerViewMode) ? (adminViewMode ? () => loadApplicationsAsAdmin(viewingStudentId) : () => loadApplicationsAsPartner(viewingStudentId)) : loadApplications} />}
            {activeTab === 'documents' && <DocumentsTab studentId={studentProfile?.id} profile={studentProfile} onUpdate={(adminViewMode || partnerViewMode) ? (adminViewMode ? () => loadStudentProfileAsAdmin(viewingStudentId) : () => loadStudentProfileAsPartner(viewingStudentId)) : loadStudentProfile} onPassportExtracted={(data) => {
              setExtractedPassportData(data)
              setShowPassportAutofillNotice(true)
            }} adminViewMode={adminViewMode} partnerViewMode={partnerViewMode} viewingStudentId={viewingStudentId} />}
            {activeTab === 'additional' && <AdditionalInfoTab profile={studentProfile} onUpdate={(adminViewMode || partnerViewMode) ? (adminViewMode ? () => loadStudentProfileAsAdmin(viewingStudentId) : () => loadStudentProfileAsPartner(viewingStudentId)) : loadStudentProfile} adminViewMode={adminViewMode} partnerViewMode={partnerViewMode} viewingStudentId={viewingStudentId} />}
            {activeTab === 'security' && <SecurityTab adminViewMode={adminViewMode} partnerViewMode={partnerViewMode} viewingStudentId={viewingStudentId} />}
            {activeTab === 'cova' && <CovaTab profile={studentProfile} onUpdate={(adminViewMode || partnerViewMode) ? (adminViewMode ? () => loadStudentProfileAsAdmin(viewingStudentId) : () => loadStudentProfileAsPartner(viewingStudentId)) : loadStudentProfile} adminViewMode={adminViewMode} partnerViewMode={partnerViewMode} viewingStudentId={viewingStudentId} />}
          </div>

          {/* Passport Autofill Notice */}
          {showPassportAutofillNotice && extractedPassportData && (
            <div className="fixed top-4 right-4 bg-teal-50 border border-teal-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-teal-800 mb-2">📋 Passport Information Extracted</h4>
                  <p className="text-sm text-teal-700 mb-3">
                    Your passport information has been extracted. Please review and save it in the Personal Info or Passport & Scores tab.
                  </p>
                  <div className="text-xs text-teal-600 space-y-1 mb-3">
                    {extractedPassportData.passport_number && <div>Passport Number: {extractedPassportData.passport_number}</div>}
                    {extractedPassportData.name && <div>Name: {extractedPassportData.name}</div>}
                    {extractedPassportData.date_of_birth && <div>Date of Birth: {extractedPassportData.date_of_birth}</div>}
                    {extractedPassportData.expiry_date && <div>Expiry Date: {extractedPassportData.expiry_date}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPassportAutofillNotice(false)
                        setActiveTab('personal')
                      }}
                      className="text-sm bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
                    >
                      Go to Personal Info
                    </button>
                    <button
                      onClick={() => {
                        setShowPassportAutofillNotice(false)
                        setActiveTab('passport')
                      }}
                      className="text-sm bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
                    >
                      Go to Passport & Scores
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowPassportAutofillNotice(false)}
                  className="text-teal-600 hover:text-teal-800 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Chat Window */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <ChatWindow
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendChatMessage={sendChatMessage}
              chatLoading={chatLoading}
              chatEndRef={chatEndRef}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function calculateProfileComplete(profile) {
  const fields = [
    'given_name', 'family_name', 'email', 'phone', 'country_of_citizenship',
    'date_of_birth', 'passport_number', 'current_address'
  ]
  const filled = fields.filter(field => profile[field]).length
  return Math.round((filled / fields.length) * 100)
}

// Personal Info Tab Component
function PersonalInfoTab({ profile, onUpdate, extractedPassportData, onPassportDataUsed, adminViewMode = false, partnerViewMode = false, viewingStudentId = null }) {
  const [formData, setFormData] = useState({
    given_name: profile?.given_name || '',
    family_name: profile?.family_name || '',
    father_name: profile?.father_name || '',
    mother_name: profile?.mother_name || '',
    gender: profile?.gender || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    country_of_citizenship: profile?.country_of_citizenship || '',
    date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
    current_address: profile?.current_address || '',
    current_country_of_residence: profile?.current_country_of_residence || '',
    highest_degree_name: profile?.highest_degree_name || '',
    highest_degree_medium: profile?.highest_degree_medium || '',
    highest_degree_institution: profile?.highest_degree_institution || '',
    highest_degree_country: profile?.highest_degree_country || '',
    highest_degree_year: profile?.highest_degree_year || '',
    highest_degree_cgpa: profile?.highest_degree_cgpa || '',
    number_of_published_papers: profile?.number_of_published_papers || '',
    marital_status: profile?.marital_status || '',
    religion: profile?.religion || '',
    occupation: profile?.occupation || '',
    native_language: profile?.native_language || '',
    employer_or_institution_affiliated: profile?.employer_or_institution_affiliated || '',
    health_status: profile?.health_status || '',
    hobby: profile?.hobby || '',
    is_ethnic_chinese: profile?.is_ethnic_chinese || false,
    video_url: profile?.video_url || '',
    relation_with_guarantor: profile?.relation_with_guarantor || '',
    is_the_bank_guarantee_in_students_name: profile?.is_the_bank_guarantee_in_students_name !== undefined ? profile.is_the_bank_guarantee_in_students_name : true
  })
  const [saving, setSaving] = useState(false)

  // Autofill from extracted passport data
  useEffect(() => {
    if (extractedPassportData) {
      console.log('🔄 PersonalInfoTab: Processing extracted passport data:', extractedPassportData)
      console.log('🔄 PersonalInfoTab: Current formData:', formData)
      
      setFormData(prev => {
        const updates = {}
        if (extractedPassportData.given_name && !prev.given_name) {
          updates.given_name = extractedPassportData.given_name
        }
        if (extractedPassportData.family_name && !prev.family_name) {
          updates.family_name = extractedPassportData.family_name
        }
        // If name exists but given_name/family_name don't, try to split
        if (extractedPassportData.name && !prev.given_name && !prev.family_name) {
          const nameParts = extractedPassportData.name.trim().split(' ', 2)
          if (nameParts.length > 0) {
            updates.given_name = nameParts[0]
            if (nameParts.length > 1) {
              updates.family_name = nameParts.slice(1).join(' ')
            }
          }
        }
        if (extractedPassportData.father_name && !prev.father_name) {
          updates.father_name = extractedPassportData.father_name
        }
        if (extractedPassportData.date_of_birth && !prev.date_of_birth) {
          updates.date_of_birth = extractedPassportData.date_of_birth
        }
        if (extractedPassportData.nationality && !prev.country_of_citizenship) {
          updates.country_of_citizenship = extractedPassportData.nationality
        }
        
        if (Object.keys(updates).length > 0) {
          console.log('✅ PersonalInfoTab: Auto-filling fields:', updates)
          // Show success message
          setTimeout(() => {
            alert(`✅ Passport information has been auto-filled:\n${Object.keys(updates).map(k => `${k}: ${updates[k]}`).join('\n')}\n\nPlease review and click "Save Changes" to save.`)
          }, 100)
          if (onPassportDataUsed) {
            onPassportDataUsed() // Mark as used
          }
          return { ...prev, ...updates }
        } else {
          console.log('ℹ️ PersonalInfoTab: No fields to update (all already filled or no data)')
          return prev
        }
      })
    }
  }, [extractedPassportData, onPassportDataUsed])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Convert empty strings to null for optional fields
      const submitData = { ...formData }
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          submitData[key] = null
        }
      })
      
      // Use admin/partner endpoint if in admin/partner view mode
      if (adminViewMode && viewingStudentId) {
        await api.put(`/admin/students/${viewingStudentId}/profile`, submitData)
      } else if (partnerViewMode && viewingStudentId) {
        await api.put(`/partners/me/students/${viewingStudentId}/profile`, submitData)
      } else {
        await api.put('/students/me', submitData)
      }
      onUpdate()
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name (Given Name) *</label>
          <input
            type="text"
            value={formData.given_name}
            onChange={(e) => setFormData({...formData, given_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name (Family Name) *</label>
          <input
            type="text"
            value={formData.family_name}
            onChange={(e) => setFormData({...formData, family_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
          <input
            type="text"
            value={formData.father_name}
            onChange={(e) => setFormData({...formData, father_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name</label>
          <input
            type="text"
            value={formData.mother_name}
            onChange={(e) => setFormData({...formData, mother_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({...formData, gender: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => {
              const email = e.target.value
              setFormData({...formData, email: email})
            }}
            onBlur={(e) => {
              const email = e.target.value.trim()
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (email && !emailRegex.test(email)) {
                alert('Please enter a valid email address')
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
            title="Please enter a valid email address (e.g., example@email.com)"
          />
          <p className="text-xs text-gray-500 mt-1">Format: example@email.com</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              // Allow only digits, +, -, spaces, and parentheses
              const phone = e.target.value.replace(/[^\d+\-() ]/g, '')
              setFormData({...formData, phone: phone})
            }}
            onBlur={(e) => {
              const phone = e.target.value.trim().replace(/\s+/g, '')
              // Basic phone validation: at least 7 digits
              const phoneRegex = /^[\d+\-()]{7,}$/
              if (phone && !phoneRegex.test(phone)) {
                alert('Please enter a valid phone number (at least 7 digits)')
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
            pattern="[\d+\-() ]{7,}"
            title="Please enter a valid phone number (e.g., +1234567890 or 123-456-7890)"
            placeholder="e.g., +1234567890 or 123-456-7890"
          />
          <p className="text-xs text-gray-500 mt-1">Format: +1234567890 or 123-456-7890 (minimum 7 digits)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
          <select
            value={formData.country_of_citizenship}
            onChange={(e) => setFormData({...formData, country_of_citizenship: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          >
            <option value="">Select Country</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="India">India</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Indonesia">Indonesia</option>
            {/* Add more countries */}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Please enter a valid date</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Country of Residence</label>
          <input
            type="text"
            value={formData.current_country_of_residence || ''}
            onChange={(e) => setFormData({...formData, current_country_of_residence: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="e.g., Bangladesh"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
        <input
          type="text"
          value={formData.current_address}
          onChange={(e) => setFormData({...formData, current_address: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="Please enter your complete address"
        />
      </div>
      
      {/* Highest Degree Information */}
      <div className="border-t pt-6 mt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Highest Degree Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Highest Level of Education Completed/to be Completed *</label>
            <select
              value={formData.highest_degree_name}
              onChange={(e) => setFormData({...formData, highest_degree_name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">Select Education Level</option>
              <option value="Junior high">Junior high</option>
              <option value="Senior high">Senior high</option>
              <option value="Technical secondary">Technical secondary</option>
              <option value="Vocational College">Vocational College</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="Dr./Phd">Dr./Phd</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Degree Medium</label>
            <select
              value={formData.highest_degree_medium}
              onChange={(e) => setFormData({...formData, highest_degree_medium: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select Medium</option>
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
              <option value="Native">Native</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
            <input
              type="text"
              value={formData.highest_degree_institution}
              onChange={(e) => setFormData({...formData, highest_degree_institution: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="University/College name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              value={formData.highest_degree_country}
              onChange={(e) => setFormData({...formData, highest_degree_country: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Country where degree was obtained"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year *</label>
            <input
              type="number"
              min="1950"
              max={new Date().getFullYear() + 5}
              value={formData.highest_degree_year}
              onChange={(e) => {
                const year = e.target.value.replace(/\D/g, '') // Only digits
                if (year === '' || (parseInt(year) >= 1950 && parseInt(year) <= new Date().getFullYear() + 5)) {
                  setFormData({...formData, highest_degree_year: year ? parseInt(year) : ''})
                }
              }}
              onBlur={(e) => {
                const year = parseInt(e.target.value)
                const currentYear = new Date().getFullYear()
                if (e.target.value && (year < 1950 || year > currentYear + 5)) {
                  alert(`Please enter a valid graduation year (between 1950 and ${currentYear + 5})`)
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., 2024"
              required
              title={`Enter graduation year (1950 - ${new Date().getFullYear() + 5})`}
            />
            <p className="text-xs text-gray-500 mt-1">Enter year between 1950 and {new Date().getFullYear() + 5}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CGPA/GPA *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.highest_degree_cgpa}
              onChange={(e) => {
                const value = e.target.value
                // Allow digits, one decimal point, and one decimal place
                const cgpaRegex = /^\d*\.?\d{0,2}$/
                if (value === '' || cgpaRegex.test(value)) {
                  const numValue = parseFloat(value)
                  if (value === '' || (numValue >= 0 && numValue <= 10.0)) {
                    setFormData({...formData, highest_degree_cgpa: value === '' ? '' : numValue})
                  }
                }
              }}
              onBlur={(e) => {
                const cgpa = parseFloat(e.target.value)
                if (e.target.value && (isNaN(cgpa) || cgpa < 0 || cgpa > 10.0)) {
                  alert('Please enter a valid CGPA/GPA (0.00 - 10.00)')
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., 3.75 or 8.5"
              required
              title="Enter CGPA/GPA (0.00 - 10.00)"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your CGPA or GPA (0.00 - 10.00 scale, e.g., 3.75 for 4.0 scale or 8.5 for 10.0 scale)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Published Papers</label>
            <input
              type="number"
              min="0"
              value={formData.number_of_published_papers}
              onChange={(e) => setFormData({...formData, number_of_published_papers: e.target.value ? parseInt(e.target.value) : ''})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>
      
      {/* Personal Information */}
      <div className="border-t pt-6 mt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Personal Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
            <select
              value={formData.marital_status}
              onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
            <select
              value={formData.religion}
              onChange={(e) => setFormData({...formData, religion: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select Religion</option>
              <option value="Anglican">Anglican</option>
              <option value="Atheism">Atheism</option>
              <option value="Mormon">Mormon</option>
              <option value="Christianity">Christianity</option>
              <option value="Judaism">Judaism</option>
              <option value="Catholicism">Catholicism</option>
              <option value="Eastern Orthodoxy">Eastern Orthodoxy</option>
              <option value="Hinduism">Hinduism</option>
              <option value="Islam">Islam</option>
              <option value="Buddhism">Buddhism</option>
              <option value="Taoism">Taoism</option>
              <option value="None">None</option>
              <option value="Lutheranism">Lutheranism</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({...formData, occupation: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select Occupation</option>
              <option value="Employee">Employee</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Doctor">Doctor</option>
              <option value="Labourer">Labourer</option>
              <option value="Army service">Army service</option>
              <option value="Engineers">Engineers</option>
              <option value="Scholars">Scholars</option>
              <option value="Housewife">Housewife</option>
              <option value="Retired">Retired</option>
              <option value="Manager">Manager</option>
              <option value="Officer">Officer</option>
              <option value="Farmer">Farmer</option>
              <option value="Reporter">Reporter</option>
              <option value="Monks and priests">Monks and priests</option>
              <option value="Religious">Religious</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Native Language</label>
            <select
              value={formData.native_language}
              onChange={(e) => setFormData({...formData, native_language: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select Native Language</option>
              <option value="Chinese">Chinese</option>
              <option value="English">English</option>
              <option value="Bengali">Bengali</option>
              <option value="Hindi">Hindi</option>
              <option value="Urdu">Urdu</option>
              <option value="Arabic">Arabic</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Russian">Russian</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">korean</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Thai">Thai</option>
              <option value="Indonesian">Indonesian</option>
              <option value="Malay">Malay</option>
              <option value="Turkish">Turkish</option>
              <option value="Persian">Persian</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employer or Institution Affiliated</label>
            <input
              type="text"
              value={formData.employer_or_institution_affiliated}
              onChange={(e) => setFormData({...formData, employer_or_institution_affiliated: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter employer or institution name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Health Status</label>
            <input
              type="text"
              value={formData.health_status}
              onChange={(e) => setFormData({...formData, health_status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter health status"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hobby</label>
            <input
              type="text"
              value={formData.hobby}
              onChange={(e) => setFormData({...formData, hobby: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., sports, reading, music"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.is_ethnic_chinese}
                onChange={(e) => setFormData({...formData, is_ethnic_chinese: e.target.checked})}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Are you Ethnic Chinese?
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">3-5 Minutes Video Url</label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({...formData, video_url: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="https://example.com/video-url"
            />
            <p className="text-xs text-gray-500 mt-1">Enter URL for your 3-5 minutes introduction video (optional)</p>
          </div>
        </div>
      </div>
      
      {/* Financial Guarantor Information */}
      <div className="border-t pt-6 mt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Financial Guarantor Information</h4>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.is_the_bank_guarantee_in_students_name}
                onChange={(e) => setFormData({...formData, is_the_bank_guarantee_in_students_name: e.target.checked})}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Bank guarantee is in my name
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6">Check this if the bank statement/guarantee is in your name</p>
          </div>
          {!formData.is_the_bank_guarantee_in_students_name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relation with Guarantor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.relation_with_guarantor}
                onChange={(e) => setFormData({...formData, relation_with_guarantor: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., Father, Mother, Uncle, etc."
                required={!formData.is_the_bank_guarantee_in_students_name}
              />
            </div>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={saving}
        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

// Passport & Scores Tab Component
function PassportScoresTab({ profile, onUpdate, extractedPassportData, onPassportDataUsed, adminViewMode = false, partnerViewMode = false, viewingStudentId = null }) {
  const [formData, setFormData] = useState({
    passport_number: profile?.passport_number || '',
    passport_expiry_date: profile?.passport_expiry_date ? profile.passport_expiry_date.split('T')[0] : '',
    hsk_score: profile?.hsk_score || '',
    level_of_hsk: profile?.level_of_hsk || '',
    hsk_test_score_report_no: profile?.hsk_test_score_report_no || '',
    hsk_certificate_date: profile?.hsk_certificate_date ? profile.hsk_certificate_date.split('T')[0] : '',
    hskk_level: profile?.hskk_level || '',
    hskk_score: profile?.hskk_score || '',
    csca_status: profile?.csca_status || 'NOT_REGISTERED',
    csca_score_math: profile?.csca_score_math || '',
    csca_score_specialized_chinese: profile?.csca_score_specialized_chinese || '',
    csca_score_physics: profile?.csca_score_physics || '',
    csca_score_chemistry: profile?.csca_score_chemistry || '',
    english_test_type: profile?.english_test_type || 'NONE',
    english_test_score: profile?.english_test_score || '',
    english_language_proficiency: profile?.english_language_proficiency || '',
    chinese_language_proficiency: profile?.chinese_language_proficiency || '',
    other_certificate_english_name: profile?.other_certificate_english_name || '',
    other_language_proficiency: profile?.other_language_proficiency || ''
  })
  const [saving, setSaving] = useState(false)

  // Autofill from extracted passport data
  useEffect(() => {
    if (extractedPassportData) {
      console.log('🔄 PassportScoresTab: Processing extracted passport data:', extractedPassportData)
      console.log('🔄 PassportScoresTab: Current formData:', formData)
      
      setFormData(prev => {
        const updates = {}
        if (extractedPassportData.passport_number && !prev.passport_number) {
          updates.passport_number = extractedPassportData.passport_number
        }
        if (extractedPassportData.expiry_date && !prev.passport_expiry_date) {
          updates.passport_expiry_date = extractedPassportData.expiry_date
        }
        
        if (Object.keys(updates).length > 0) {
          console.log('✅ PassportScoresTab: Auto-filling fields:', updates)
          // Show success message
          setTimeout(() => {
            alert(`✅ Passport information has been auto-filled:\n${Object.keys(updates).map(k => `${k}: ${updates[k]}`).join('\n')}\n\nPlease review and click "Save Changes" to save.`)
          }, 100)
          if (onPassportDataUsed) {
            onPassportDataUsed() // Mark as used
          }
          return { ...prev, ...updates }
        } else {
          console.log('ℹ️ PassportScoresTab: No fields to update (all already filled or no data)')
          return prev
        }
      })
    }
  }, [extractedPassportData, onPassportDataUsed])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Convert empty strings to null for optional fields
      const submitData = { ...formData }
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          submitData[key] = null
        }
      })
      // Use admin/partner endpoint if in admin/partner view mode
      if (adminViewMode && viewingStudentId) {
        await api.put(`/admin/students/${viewingStudentId}/profile`, submitData)
      } else if (partnerViewMode && viewingStudentId) {
        await api.put(`/partners/me/students/${viewingStudentId}/profile`, submitData)
      } else {
        await api.put('/students/me', submitData)
      }
      onUpdate()
      alert('Passport & Scores updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Passport Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
          <input
            type="text"
            value={formData.passport_number}
            onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Passport Expiry Date</label>
          <input
            type="date"
            value={formData.passport_expiry_date}
            onChange={(e) => setFormData({...formData, passport_expiry_date: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">Language & Test Scores</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HSK Level</label>
          <select
            value={formData.level_of_hsk}
            onChange={(e) => setFormData({...formData, level_of_hsk: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Select HSK Level</option>
            <option value="none">None</option>
            <option value="HSK LEVEL 1">HSK LEVEL 1</option>
            <option value="HSK LEVEL 2">HSK LEVEL 2</option>
            <option value="HSK LEVEL 3">HSK LEVEL 3</option>
            <option value="HSK LEVEL 4">HSK LEVEL 4</option>
            <option value="HSK LEVEL 5">HSK LEVEL 5</option>
            <option value="HSK LEVEL 6">HSK LEVEL 6</option>
            <option value="HSK LEVEL 7">HSK LEVEL 7</option>
            <option value="HSK LEVEL 8">HSK LEVEL 8</option>
            <option value="HSK LEVEL 9">HSK LEVEL 9</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HSK Score</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.hsk_score}
            onChange={(e) => setFormData({...formData, hsk_score: e.target.value ? parseFloat(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter HSK score"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HSK Test Score Report No.</label>
          <input
            type="text"
            value={formData.hsk_test_score_report_no}
            onChange={(e) => setFormData({...formData, hsk_test_score_report_no: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter HSK test score report number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HSK Certificate Date</label>
          <input
            type="date"
            value={formData.hsk_certificate_date}
            onChange={(e) => setFormData({...formData, hsk_certificate_date: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HSKK Level</label>
          <select
            value={formData.hskk_level}
            onChange={(e) => setFormData({...formData, hskk_level: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Not taken</option>
            <option value="Beginner">Beginner</option>
            <option value="Elementary">Elementary</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HSKK Score</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.hskk_score}
            onChange={(e) => setFormData({...formData, hskk_score: e.target.value ? parseFloat(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter HSKK score"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CSCA Status</label>
          <select
            value={formData.csca_status}
            onChange={(e) => setFormData({...formData, csca_status: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="NOT_REGISTERED">Not Registered</option>
            <option value="REGISTERED">Registered</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CSCA Math Score</label>
          <input
            type="number"
            step="0.1"
            value={formData.csca_score_math}
            onChange={(e) => setFormData({...formData, csca_score_math: e.target.value ? parseFloat(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CSCA Specialized Chinese Score</label>
          <input
            type="number"
            step="0.1"
            value={formData.csca_score_specialized_chinese}
            onChange={(e) => setFormData({...formData, csca_score_specialized_chinese: e.target.value ? parseFloat(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CSCA Physics Score</label>
          <input
            type="number"
            step="0.1"
            value={formData.csca_score_physics}
            onChange={(e) => setFormData({...formData, csca_score_physics: e.target.value ? parseFloat(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CSCA Chemistry Score</label>
          <input
            type="number"
            step="0.1"
            value={formData.csca_score_chemistry}
            onChange={(e) => setFormData({...formData, csca_score_chemistry: e.target.value ? parseFloat(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">English Test Type</label>
          <select
            value={formData.english_test_type}
            onChange={(e) => setFormData({...formData, english_test_type: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="None">None</option>
            <option value="IELTS">IELTS</option>
            <option value="TOEFL">TOEFL</option>
            <option value="GRE">GRE</option>
            <option value="GMAT">GMAT</option>
            <option value="Duolingo">Duolingo</option>
            <option value="TOEIC">TOEIC</option>
            <option value="PTE">PTE</option>
            <option value="Native Language">Native Language</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">English Test Score</label>
          <input
            type="number"
            step="0.1"
            value={formData.english_test_score}
            onChange={(e) => setFormData({...formData, english_test_score: e.target.value ? parseFloat(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Other Certificate for English Name</label>
          <input
            type="text"
            value={formData.other_certificate_english_name}
            onChange={(e) => setFormData({...formData, other_certificate_english_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter other English certificate name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">English Language Proficiency</label>
          <select
            value={formData.english_language_proficiency}
            onChange={(e) => setFormData({...formData, english_language_proficiency: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Select Proficiency</option>
            <option value="None">None</option>
            <option value="Poor">Poor</option>
            <option value="Fair">Fair</option>
            <option value="Good">Good</option>
            <option value="Excellent">Excellent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chinese Language Proficiency</label>
          <select
            value={formData.chinese_language_proficiency}
            onChange={(e) => setFormData({...formData, chinese_language_proficiency: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Select Proficiency</option>
            <option value="None">None</option>
            <option value="Poor">Poor</option>
            <option value="Fair">Fair</option>
            <option value="Good">Good</option>
            <option value="Excellent">Excellent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Other Language Proficiency</label>
          <input
            type="text"
            value={formData.other_language_proficiency}
            onChange={(e) => setFormData({...formData, other_language_proficiency: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter other language proficiency details"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

// COVA Tab Component
function CovaTab({ profile, onUpdate, adminViewMode = false, partnerViewMode = false, viewingStudentId = null }) {
  const [formData, setFormData] = useState({
    home_address: profile?.home_address || '',
    current_address: profile?.current_address || '',
    emergency_contact_name: profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
    emergency_contact_relationship: profile?.emergency_contact_relationship || '',
    planned_arrival_date: profile?.planned_arrival_date ? profile.planned_arrival_date.split('T')[0] : '',
    intended_address_china: profile?.intended_address_china || '',
    previous_visa_china: profile?.previous_visa_china || false,
    previous_visa_details: profile?.previous_visa_details || '',
    previous_travel_to_china: profile?.previous_travel_to_china || false,
    previous_travel_details: profile?.previous_travel_details || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Use admin endpoint if in admin view mode
      if (adminViewMode && viewingStudentId) {
        await api.put(`/admin/students/${viewingStudentId}/profile`, formData)
      } else {
        await api.put('/students/me', formData)
      }
      onUpdate()
      alert('COVA information updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Permanent Home Address</label>
          <textarea
            value={formData.home_address}
            onChange={(e) => setFormData({...formData, home_address: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            rows={3}
            placeholder="Enter your permanent home address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Address</label>
          <textarea
            value={formData.current_address}
            onChange={(e) => setFormData({...formData, current_address: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            rows={3}
            placeholder="Enter your current residence address"
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">Emergency Contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
          <input
            type="text"
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
          <input
            type="tel"
            value={formData.emergency_contact_phone}
            onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
          <input
            type="text"
            value={formData.emergency_contact_relationship}
            onChange={(e) => setFormData({...formData, emergency_contact_relationship: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="e.g., Father, Mother, Spouse"
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">China Travel Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Planned Arrival Date</label>
          <input
            type="date"
            value={formData.planned_arrival_date}
            onChange={(e) => setFormData({...formData, planned_arrival_date: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Intended Address in China</label>
          <input
            type="text"
            value={formData.intended_address_china}
            onChange={(e) => setFormData({...formData, intended_address_china: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Usually university dorm address"
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.previous_visa_china}
              onChange={(e) => setFormData({...formData, previous_visa_china: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Have you had a Chinese visa before?</span>
          </label>
          {formData.previous_visa_china && (
            <textarea
              value={formData.previous_visa_details}
              onChange={(e) => setFormData({...formData, previous_visa_details: e.target.value})}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={2}
              placeholder="Details about previous visa"
            />
          )}
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.previous_travel_to_china}
              onChange={(e) => setFormData({...formData, previous_travel_to_china: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Have you traveled to China before?</span>
          </label>
          {formData.previous_travel_to_china && (
            <textarea
              value={formData.previous_travel_details}
              onChange={(e) => setFormData({...formData, previous_travel_details: e.target.value})}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={2}
              placeholder="Details about previous travel"
            />
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

// Programs Tab Component - Will show applications with new fields
function ProgramsTab({ applications, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [localApplications, setLocalApplications] = useState(applications)
  
  // Update local applications when prop changes
  useEffect(() => {
    setLocalApplications(applications)
  }, [applications])
  const [universities, setUniversities] = useState([])
  const [majors, setMajors] = useState([])
  const [programIntakes, setProgramIntakes] = useState([])
  const [formData, setFormData] = useState({
    university_id: '',
    major_id: '',
    program_intake_id: '',
    degree_level: '',
    scholarship_preference: ''
  })
  const [loading, setLoading] = useState(false)
  
  // Check if selected major is a language program
  const isLanguageProgram = () => {
    if (formData.degree_level === 'Language') {
      return true
    }
    if (formData.major_id) {
      const selectedMajor = majors.find(m => m.id === parseInt(formData.major_id))
      if (selectedMajor) {
        const majorName = selectedMajor.name.toLowerCase()
        return majorName.includes('chinese language') || 
               majorName.includes('language') ||
               majorName.includes('chinese')
      }
    }
    return false
  }

  useEffect(() => {
    loadUniversities()
  }, [])

  const loadUniversities = async () => {
    try {
      const response = await api.get('/universities?is_partner=true')
      setUniversities(response.data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const loadMajors = async (universityId) => {
    try {
      const response = await api.get(`/majors?university_id=${universityId}`)
      setMajors(response.data || [])
    } catch (error) {
      console.error('Error loading majors:', error)
    }
  }

  const loadProgramIntakes = async (universityId, majorId) => {
    try {
      const response = await api.get(`/program-intakes?university_id=${universityId}&major_id=${majorId}`)
      setProgramIntakes(response.data || [])
    } catch (error) {
      console.error('Error loading program intakes:', error)
    }
  }

  const handleAddApplication = async (e) => {
    e.preventDefault()
    if (!formData.program_intake_id) {
      alert('Please select a program')
      return
    }

    setLoading(true)
    try {
      await api.post('/students/applications', {
        program_intake_id: parseInt(formData.program_intake_id),
        degree_level: formData.degree_level || null,
        scholarship_preference: formData.scholarship_preference || null
      })
      onUpdate()
      setShowAddModal(false)
      setFormData({ university_id: '', major_id: '', program_intake_id: '', degree_level: '', scholarship_preference: '' })
      setProgramIntakes([])
      setMajors([])
      alert('Application added successfully!')
    } catch (error) {
      console.error('Error adding application:', error)
      alert(error.response?.data?.detail || 'Failed to add application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditApplication = async (appId, scholarshipPreference) => {
    setLoading(true)
    try {
      await api.put(`/students/applications/${appId}`, {
        scholarship_preference: scholarshipPreference || null
      })
      setEditingApp(null)
      onUpdate() // Reload applications from server
      alert('Scholarship preference updated successfully!')
    } catch (error) {
      console.error('Error updating application:', error)
      alert(error.response?.data?.detail || 'Failed to update scholarship preference. Please try again.')
      onUpdate() // Reload to revert any local changes
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return
    }

    setLoading(true)
    try {
      await api.delete(`/students/applications/${appId}`)
      onUpdate()
      alert('Application deleted successfully!')
    } catch (error) {
      console.error('Error deleting application:', error)
      alert(error.response?.data?.detail || 'Failed to delete application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStateIcon = (state) => {
    switch (state) {
      case 'succeeded':
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'applied':
      case 'submitted':
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'succeeded':
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'applied':
      case 'submitted':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canEdit = (app) => {
    // Can only edit if not submitted/applied
    return !app.application_state || 
           ['not_applied', 'draft'].includes(app.application_state)
  }

  const canDelete = (app) => {
    // Can only delete if not submitted/applied
    return !app.application_state || 
           ['not_applied', 'draft'].includes(app.application_state)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Your Applications</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Program
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No applications yet. Start applying to programs!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localApplications.map((app) => (
            <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800">{app.university_name}</h4>
                  <p className="text-gray-600">{app.major_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500">{app.intake_term} {app.intake_year}</p>
                    {app.degree_level && (
                      <>
                        <span className="text-gray-300">•</span>
                        <p className="text-sm font-medium text-teal-600">{app.degree_level}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStateIcon(app.application_state)}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStateColor(app.application_state)}`}>
                    {app.application_state?.replace('_', ' ').toUpperCase() || 'NOT APPLIED'}
                  </span>
                  {canDelete(app) && (
                    <button
                      onClick={() => handleDeleteApplication(app.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Payment Required</p>
                    <p className="text-sm font-semibold">{app.payment_fee_required || 0} RMB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Payment Paid</p>
                    <p className="text-sm font-semibold">{app.payment_fee_paid || 0} RMB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-gray-500">Payment Due</p>
                    <p className="text-sm font-semibold">{app.payment_fee_due || 0} RMB</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Award className="w-5 h-5 text-teal-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Scholarship Preference</p>
                      {editingApp === app.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={app.scholarship_preference || ''}
                            onChange={(e) => {
                              // Update local state immediately for better UX
                              const updatedApps = localApplications.map(a => 
                                a.id === app.id ? { ...a, scholarship_preference: e.target.value } : a
                              )
                              setLocalApplications(updatedApps)
                            }}
                            className="text-sm font-semibold text-teal-600 border border-teal-300 rounded px-2 py-1 flex-1"
                            autoFocus
                            disabled={app.degree_level === 'Language' || (app.major_name && (app.major_name.toLowerCase().includes('chinese language') || app.major_name.toLowerCase().includes('language')))}
                          >
                            {(app.degree_level === 'Language' || (app.major_name && (app.major_name.toLowerCase().includes('chinese language') || app.major_name.toLowerCase().includes('language')))) ? (
                              <option value="None">Language Programs (No scholarship) - 150 USD Charge</option>
                            ) : (
                              <>
                                <option value="">No Scholarship</option>
                                <option value="Type-A">Type-A (Full scholarship with stipend) - 900 USD (English) / 700 USD (Chinese) Charge</option>
                                <option value="Type-B">Type-B (Full scholarship without stipend) - 700 USD (English) / 600 USD (Chinese) Charge</option>
                                <option value="Type-C">Type-C (Only tuition free) - 500 USD (English) / 400 USD (Chinese) Charge</option>
                                <option value="Type-D">Type-D (Only tuition free - alternative) - 500 USD (English) / 400 USD (Chinese) Charge</option>
                                <option value="Partial-Low">Partial Scholarship (&lt;5000 CNY/year) - 500 USD Charge</option>
                                <option value="Partial-Mid">Partial Scholarship (5100-10000 CNY/year) - 350 USD Charge</option>
                                <option value="Partial-High">Partial Scholarship (10000-15000 CNY/year) - 300 USD Charge</option>
                                <option value="Self-Paid">Self-Paid - 150 USD Charge</option>
                                <option value="None">Language Programs (No scholarship) - 150 USD Charge</option>
                              </>
                            )}
                          </select>
                          <button
                            onClick={() => {
                              handleEditApplication(app.id, app.scholarship_preference)
                            }}
                            className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700 transition-colors"
                            disabled={loading}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingApp(null)
                              // Reload to revert changes
                              onUpdate()
                            }}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-teal-600">
                            {app.scholarship_preference || 'Not selected'}
                          </p>
                          {canEdit(app) && (
                            <button
                              onClick={() => setEditingApp(app.id)}
                              className="text-teal-600 hover:text-teal-700 p-1"
                              title="Edit scholarship preference"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Read-only admin fields */}
              {app.result && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-1">Result (Admin)</p>
                  <p className="text-sm text-gray-700">{app.result}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Add New Program Application</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFormData({ university_id: '', major_id: '', program_intake_id: '', degree_level: '', scholarship_preference: '' })
                  setProgramIntakes([])
                  setMajors([])
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree Level *</label>
                <select
                  value={formData.degree_level || ''}
                  onChange={(e) => {
                    const degreeLevel = e.target.value
                    // If Language is selected, automatically set scholarship preference to None
                    setFormData({ 
                      ...formData, 
                      degree_level: degreeLevel,
                      scholarship_preference: degreeLevel === 'Language' ? 'None' : formData.scholarship_preference
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Degree Level</option>
                  <option value="Non-degree">Non-degree</option>
                  <option value="Associate">Associate</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="Doctoral (PhD)">Doctoral (PhD)</option>
                  <option value="Language">Language</option>
                  <option value="Short Program">Short Program</option>
                  <option value="Study Tour Program">Study Tour Program</option>
                  <option value="Upgrade from Junior College Student to University Student">Upgrade from Junior College Student to University Student</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the degree level for this application</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">University *</label>
                <select
                  value={formData.university_id || ''}
                  onChange={async (e) => {
                    const uniId = e.target.value
                    setFormData({ ...formData, university_id: uniId, major_id: '', program_intake_id: '', scholarship_preference: '' })
                    setMajors([])
                    setProgramIntakes([])
                    if (uniId) {
                      await loadMajors(uniId)
                    }
                  }}
                  disabled={!formData.degree_level}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    !formData.degree_level ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                >
                  <option value="">
                    {formData.degree_level ? 'Select University' : 'Select Degree Level first'}
                  </option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major *</label>
                <select
                  value={formData.major_id || ''}
                  onChange={async (e) => {
                    const majorId = e.target.value
                    const selectedMajor = majors.find(m => m.id === parseInt(majorId))
                    const isLang = formData.degree_level === 'Language' || 
                                  (selectedMajor && (selectedMajor.name.toLowerCase().includes('chinese language') || 
                                                    selectedMajor.name.toLowerCase().includes('language')))
                    setFormData({ 
                      ...formData, 
                      major_id: majorId, 
                      program_intake_id: '',
                      scholarship_preference: isLang ? 'None' : formData.scholarship_preference
                    })
                    setProgramIntakes([])
                    if (majorId && formData.university_id) {
                      await loadProgramIntakes(formData.university_id, majorId)
                    }
                  }}
                  disabled={!formData.university_id}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    !formData.university_id ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                >
                  <option value="">
                    {formData.university_id ? 'Select Major' : 'Select University first'}
                  </option>
                  {majors.map((major) => (
                    <option key={major.id} value={major.id}>{major.name}</option>
                  ))}
                </select>
                {!formData.university_id && (
                  <p className="text-xs text-gray-500 mt-1">Please select a university first to see available majors</p>
                )}
              </div>

              {formData.major_id && programIntakes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program Intake *</label>
                  <select
                    value={formData.program_intake_id}
                    onChange={(e) => setFormData({ ...formData, program_intake_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Program Intake</option>
                    {programIntakes.map((intake) => (
                      <option key={intake.id} value={intake.id}>
                        {intake.intake_term} {intake.intake_year} - {intake.university_name || 'University'} - {intake.major_name || 'Major'} - Fee: {intake.application_fee || 0} RMB
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scholarship Preference</label>
                <select
                  value={formData.scholarship_preference}
                  onChange={(e) => setFormData({ ...formData, scholarship_preference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  disabled={isLanguageProgram()}
                >
                  {isLanguageProgram() ? (
                    <option value="None">Language Programs (No scholarship) - 150 USD Charge</option>
                  ) : (
                    <>
                      <option value="">No Scholarship</option>
                      <option value="Type-A">Type-A (Full scholarship with stipend) - 900 USD (English) / 700 USD (Chinese) Charge</option>
                      <option value="Type-B">Type-B (Full scholarship without stipend) - 700 USD (English) / 600 USD (Chinese) Charge</option>
                      <option value="Type-C">Type-C (Only tuition free) - 500 USD (English) / 400 USD (Chinese)  Charge </option>
                      <option value="Type-D">Type-D (Only tuition free - alternative) - 500 USD (English) / 400 USD (Chinese) Charge</option>
                      <option value="Partial-Low">Partial Scholarship (&lt;5000 CNY/year) - 500 USD Charge</option>
                      <option value="Partial-Mid">Partial Scholarship (5100-10000 CNY/year) - 350 USD Charge</option>
                      <option value="Partial-High">Partial Scholarship (10000-15000 CNY/year) - 300 USD Charge</option>
                      <option value="Self-Paid">Self-Paid - 150 USD Charge</option>
                      <option value="None">Language Programs (No scholarship) - 150 USD Charge</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {isLanguageProgram() 
                    ? 'Language programs have no scholarship options. Only the language program charge applies.' 
                    : 'Note: Language programs have no scholarship'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Application'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ university_id: '', major_id: '', program_intake_id: '', degree_level: '', scholarship_preference: '' })
                    setProgramIntakes([])
                    setMajors([])
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Documents Tab Component
function DocumentsTab({ studentId, profile, onUpdate, onPassportExtracted, adminViewMode = false, partnerViewMode = false, viewingStudentId = null }) {
  const [uploading, setUploading] = useState({})
  const [documents, setDocuments] = useState([])
  const fileInputRefs = useRef({})

  useEffect(() => {
    loadDocuments()
  }, [adminViewMode, partnerViewMode, viewingStudentId])

  const loadDocuments = async () => {
    try {
      if (adminViewMode && viewingStudentId) {
        // Use admin endpoint for documents
        const response = await api.get(`/admin/students/${viewingStudentId}/documents`)
        setDocuments(response.data || [])
      } else {
        // Load verified documents from student-documents endpoint
        const response = await api.get('/verify-document/student-documents')
        setDocuments(response.data || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      // Fallback to old endpoint
      try {
        const fallbackResponse = await api.get('/documents/')
        setDocuments(fallbackResponse.data || [])
      } catch (e) {
        console.error('Error loading documents from fallback:', e)
      }
    }
  }

  const documentTypes = [
    {
      id: 'passport',
      title: 'Passport (Scanned Copy)',
      icon: '🌐',
      description: 'Upload a clear scanned color copy of your passport',
      documentType: 'passport',
      field: 'passport_scanned_url'
    },
    {
      id: 'passport_page',
      title: 'Passport Page',
      icon: '📄',
      description: 'Upload additional passport pages if required',
      documentType: 'passport_page',
      field: 'passport_page_url'
    },
    {
      id: 'photo',
      title: 'Passport Size Photo',
      icon: '👤',
      description: 'Colored 2-inch bare-headed photo. Requirements: JPG/JPEG format, 100-500KB, minimum 295×413 pixels, 4:3 ratio, white background without border, head accounts for 2/3 of photo size, width < height (portrait orientation)',
      documentType: 'photo',
      field: 'passport_photo_url'
    },
    {
      id: 'transcript',
      title: 'Highest Diploma Transcript',
      icon: '🎓',
      description: 'Upload scanned color copies of your highest diploma transcript',
      documentType: 'transcript',
      field: 'academic_transcript_url'
    },
    {
      id: 'diploma',
      title: 'Highest Degree Diploma',
      icon: '📜',
      description: 'Upload scanned color copy of your highest degree diploma',
      documentType: 'diploma',
      field: 'highest_degree_diploma_url'
    },
    {
      id: 'cv_resume',
      title: 'CV/Resume',
      icon: '📋',
      description: 'Upload your CV or Resume',
      documentType: 'cv_resume',
      field: 'cv_resume_url'
    },
    {
      id: 'physical_exam',
      title: 'Foreigner Physical Examination Form',
      icon: '💼',
      description: 'Upload the completed physical examination form',
      documentType: 'physical_exam',
      field: 'physical_examination_form_url'
    },
    {
      id: 'police_clearance',
      title: 'Police Clearance',
      icon: '🛡️',
      description: 'Upload scanned color copy of police clearance certificate',
      documentType: 'non_criminal',
      field: 'police_clearance_url'
    },
    {
      id: 'hsk',
      title: 'HSK Certificate',
      icon: '文',
      description: 'Upload your HSK Chinese language proficiency certificate',
      documentType: 'english_proficiency',
      field: 'hsk_certificate_url'
    },
    {
      id: 'english_proficiency',
      title: 'English Proficiency Certificate',
      icon: '🇬🇧',
      description: 'Upload your English proficiency certificate (IELTS/TOEFL)',
      documentType: 'english_proficiency',
      field: 'english_certificate_url'
    },
    {
      id: 'bank_statement',
      title: 'Bank Statement',
      icon: '💰',
      description: 'Upload your bank statement for financial proof',
      documentType: 'bank_statement',
      field: 'bank_statement_url'
    },
    {
      id: 'recommendation_1',
      title: 'Letter of Recommendation 1',
      icon: '📄',
      description: 'Upload the first letter of recommendation',
      documentType: 'recommendation_letter',
      field: 'recommendation_letter_1_url'
    },
    {
      id: 'recommendation_2',
      title: 'Letter of Recommendation 2',
      icon: '📄',
      description: 'Upload the second letter of recommendation',
      documentType: 'recommendation_letter',
      field: 'recommendation_letter_2_url'
    },
    {
      id: 'study_plan',
      title: 'Study Plan / Motivation Letter',
      icon: '📝',
      description: 'Upload your study plan or motivation letter',
      documentType: 'study_plan',
      field: 'study_plan_url'
    },
    {
      id: 'jw202_jw201',
      title: 'JW202/JW201 Form',
      icon: '📑',
      description: 'Upload your JW202 or JW201 form',
      documentType: 'jw202_jw201',
      field: 'jw202_jw201_url'
    },
    {
      id: 'guarantee_letter',
      title: 'Guarantee Letter',
      icon: '📋',
      description: 'Upload guarantee letter',
      documentType: 'guarantee_letter',
      field: 'guarantee_letter_url'
    },
    {
      id: 'bank_guarantor_letter',
      title: 'Bank Guarantor Letter',
      icon: '🏦',
      description: 'Upload bank guarantor letter (if bank guarantee is not in your name)',
      documentType: 'bank_guarantor_letter',
      field: 'bank_guarantor_letter_url',
      conditional: true // Only required if is_the_bank_guarantee_in_students_name is false
    },
    {
      id: 'acceptance_letter',
      title: 'Acceptance Letter',
      icon: '📨',
      description: 'Upload your university acceptance letter',
      documentType: 'acceptance_letter',
      field: 'acceptance_letter_url'
    }
  ]

  const handleFileSelect = (docType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        await handleUpload(docType, file)
      }
    }
    input.click()
  }

  const handleUpload = async (docType, file) => {
    if (!file) return

    // Check file size (1MB = 1048576 bytes)
    const MAX_FILE_SIZE = 1048576
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size (${(file.size / 1024).toFixed(2)} KB) exceeds maximum allowed size of 1MB. Please compress or resize the file.`)
      return
    }

    console.log(`📤 Uploading document: ${docType.title}`)
    console.log(`📄 Document Type: ${docType.documentType}`)
    console.log(`📁 Filename: ${file.name}`)
    console.log(`📦 File Size: ${(file.size / 1024).toFixed(2)} KB`)

    setUploading(prev => ({ ...prev, [docType.id]: true }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('doc_type', docType.documentType)
      
      // Use appropriate endpoint based on admin/partner view mode
      let endpoint
      if (adminViewMode && viewingStudentId) {
        endpoint = `/admin/students/${viewingStudentId}/documents/verify-and-upload`
      } else if (partnerViewMode && viewingStudentId) {
        endpoint = `/partners/me/students/${viewingStudentId}/documents/verify-and-upload`
      } else {
        endpoint = '/verify-document/verify-and-upload'
      }
      
      console.log(`🚀 Sending to backend: ${endpoint}`)
      console.log(`📋 FormData - doc_type: ${docType.documentType}`)
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('📥 Document upload response:', response.data)

      // Check if passport was verified and extract data
      if (docType.documentType === 'passport' || docType.documentType === 'passport_page') {
        const verificationResult = response.data
        console.log('🔍 Checking passport verification result:', verificationResult)
        
        // Backend returns verification_status and extracted_data
        if (verificationResult.verification_status === 'ok' && verificationResult.extracted_data) {
          const extracted = verificationResult.extracted_data
          console.log('✅ Passport data extracted:', extracted)
          
          // Extract passport information
          const passportData = {
            passport_number: extracted.passport_number || null,
            name: extracted.name || null,
            given_name: extracted.given_name || null,
            family_name: extracted.family_name || null,
            father_name: extracted.father_name || null,
            date_of_birth: extracted.date_of_birth || null,
            nationality: extracted.nationality || null,
            expiry_date: extracted.expiry_date || null,
            issuing_country: extracted.issuing_country || null
          }
          
          console.log('📋 Processed passport data:', passportData)
          
          // Only call callback if we have meaningful data
          if (passportData.passport_number || passportData.name || passportData.date_of_birth) {
            console.log('🚀 Calling onPassportExtracted callback')
            if (onPassportExtracted) {
              onPassportExtracted(passportData)
            } else {
              console.warn('⚠️ onPassportExtracted callback not provided')
            }
          } else {
            console.warn('⚠️ No meaningful passport data to extract')
          }
        } else {
          console.log('⚠️ Passport verification not successful or no extracted data:', {
            status: verificationResult.verification_status,
            hasExtracted: !!verificationResult.extracted_data
          })
        }
      }

      // Reload documents and profile
      await loadDocuments()
      if (onUpdate) onUpdate()

      alert(`${docType.title} verified and uploaded successfully!`)
    } catch (error) {
      console.error('Error uploading document:', error)
      // Handle different error response formats
      let errorMessage = 'Document verification failed'
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else if (error.response.data.detail.reason) {
          errorMessage = error.response.data.detail.reason
        } else if (error.response.data.detail.message) {
          errorMessage = error.response.data.detail.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      alert(`Verification failed: ${errorMessage}\n\nThe document was not uploaded. Please upload a valid ${docType.title.toLowerCase()}.`)
    } finally {
      setUploading(prev => ({ ...prev, [docType.id]: false }))
    }
  }

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      // Use appropriate endpoint based on admin/partner view mode
      let endpoint
      if (adminViewMode && viewingStudentId) {
        endpoint = `/admin/students/${viewingStudentId}/documents/${documentId}`
      } else if (partnerViewMode && viewingStudentId) {
        endpoint = `/partners/me/students/${viewingStudentId}/documents/${documentId}`
      } else {
        endpoint = `/verify-document/student-documents/${documentId}`
      }
      
      await api.delete(endpoint)
      await loadDocuments()
      if (onUpdate) onUpdate()
      alert('Document deleted successfully!')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  const getDocumentStatus = (docType) => {
    // Check if document exists in verified documents list
    const doc = documents.find(d => d.document_type === docType.documentType)
    if (doc) {
      return { 
        uploaded: true, 
        verified: doc.verified, 
        url: doc.r2_url, 
        filename: doc.filename,
        verificationStatus: doc.verification_status,
        verificationReason: doc.verification_reason,
        documentId: doc.id
      }
    }
    // Also check profile field (legacy)
    if (profile && profile[docType.field]) {
      return { uploaded: true, verified: false, url: profile[docType.field] }
    }
    return { uploaded: false, verified: false }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Documents</h3>
        <p className="text-gray-600 text-sm">
          Upload scanned color copies of all required documents. All documents are optional but recommended for a complete application.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes.map((doc) => {
          const status = getDocumentStatus(doc)
          const isUploading = uploading[doc.id]

          return (
            <div
              key={doc.id}
              className={`border rounded-lg p-4 transition-shadow ${
                status.uploaded 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{doc.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{doc.title}</h4>
                      {status.uploaded && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            status.verificationStatus === 'ok'
                              ? 'bg-green-200 text-green-800' 
                              : status.verificationStatus === 'blurry'
                              ? 'bg-yellow-200 text-yellow-800'
                              : status.verificationStatus === 'fake'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            {status.verificationStatus === 'ok' ? '✓ Verified' : 
                             status.verificationStatus === 'blurry' ? '⚠ Blurry' :
                             status.verificationStatus === 'fake' ? '✗ Fake' :
                             status.verificationStatus === 'incomplete' ? '⚠ Incomplete' :
                             '⏳ Pending'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                  {status.uploaded && status.filename && (
                    <p className="text-xs text-gray-500 mb-1">File: {status.filename}</p>
                  )}
                  {status.uploaded && status.verificationReason && (
                    <p className="text-xs text-gray-600 italic mb-2">{status.verificationReason}</p>
                  )}
                  {/* Thumbnail for image documents (especially passport photos) */}
                  {status.uploaded && status.url && (doc.documentType === 'photo' || doc.documentType === 'passport' || doc.documentType === 'passport_page') && (
                    <div className="mt-2 mb-2">
                      <img 
                        src={status.url} 
                        alt={doc.title}
                        className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(status.url, '_blank')}
                        onError={(e) => {
                          // Hide thumbnail if image fails to load
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  {status.uploaded ? (
                    <>
                      <button
                        onClick={() => window.open(status.url, '_blank')}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleFileSelect(doc)}
                        disabled={isUploading}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                      >
                        {isUploading ? 'Uploading...' : 'Replace'}
                      </button>
                      {status.documentId && (
                        <button
                          onClick={() => handleDelete(status.documentId)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleFileSelect(doc)}
                      disabled={isUploading}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                    >
                      {isUploading ? 'Verifying...' : 'Upload & Verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Additional Info Tab Component
function AdditionalInfoTab({ profile, onUpdate, adminViewMode = false, partnerViewMode = false, viewingStudentId = null }) {
  const [formData, setFormData] = useState({
    criminal_record: profile?.criminal_record || false,
    criminal_record_details: profile?.criminal_record_details || '',
    financial_supporter: profile?.financial_supporter || {
      name: '',
      tel: '',
      organization: '',
      address: '',
      relationship: '',
      email: ''
    },
    guarantor_in_china: profile?.guarantor_in_china || {
      name: '',
      phone_number: '',
      mobile: '',
      email: '',
      address: '',
      organization: ''
    },
    social_media_accounts: profile?.social_media_accounts || {
      facebook: '',
      linkedin: '',
      qq: '',
      skype: '',
      wechat: '',
      twitter: '',
      dingtalk: '',
      instagram: ''
    },
    studied_in_china: profile?.studied_in_china || false,
    studied_in_china_details: profile?.studied_in_china_details || '',
    work_experience: profile?.work_experience || false,
    work_experience_details: profile?.work_experience_details || [],
    worked_in_china: profile?.worked_in_china || false,
    worked_in_china_details: profile?.worked_in_china_details || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const submitData = { ...formData }
      // Convert empty strings to null for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          submitData[key] = null
        }
      })
      
      // Use admin/partner endpoint if in admin/partner view mode
      if (adminViewMode && viewingStudentId) {
        await api.put(`/admin/students/${viewingStudentId}/profile`, submitData)
      } else if (partnerViewMode && viewingStudentId) {
        await api.put(`/partners/me/students/${viewingStudentId}/profile`, submitData)
      } else {
        await api.put('/students/me', submitData)
      }
      onUpdate()
      alert('Additional information updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      work_experience_details: [...(prev.work_experience_details || []), {
        from: '',
        to: '',
        company: '',
        position: '',
        country: ''
      }]
    }))
  }

  const removeWorkExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      work_experience_details: prev.work_experience_details.filter((_, i) => i !== index)
    }))
  }

  const updateWorkExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      work_experience_details: prev.work_experience_details.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Criminal Record Section */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Criminal Record</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Have you ever had a criminal record? *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="criminal_record"
                  checked={formData.criminal_record === true}
                  onChange={() => setFormData({...formData, criminal_record: true})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="criminal_record"
                  checked={formData.criminal_record === false}
                  onChange={() => setFormData({...formData, criminal_record: false})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>No</span>
              </label>
            </div>
          </div>
          {formData.criminal_record && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Criminal Record Details</label>
              <textarea
                value={formData.criminal_record_details}
                onChange={(e) => setFormData({...formData, criminal_record_details: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows="3"
                placeholder="Please provide details"
              />
            </div>
          )}
        </div>
      </div>

      {/* Financial Supporter Section */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Supporter</h3>
        <p className="text-sm text-orange-600 mb-4">(The guarantor should be an adult, willing to sponsor you to complete your studies. He or she may live in or outside China, generally should be parent.)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.financial_supporter.name}
              onChange={(e) => setFormData({...formData, financial_supporter: {...formData.financial_supporter, name: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tel. *</label>
            <input
              type="tel"
              value={formData.financial_supporter.tel}
              onChange={(e) => setFormData({...formData, financial_supporter: {...formData.financial_supporter, tel: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Example: +86-10-12345678"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization *</label>
            <input
              type="text"
              value={formData.financial_supporter.organization}
              onChange={(e) => setFormData({...formData, financial_supporter: {...formData.financial_supporter, organization: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.financial_supporter.address}
              onChange={(e) => setFormData({...formData, financial_supporter: {...formData.financial_supporter, address: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship with applicant</label>
            <input
              type="text"
              value={formData.financial_supporter.relationship}
              onChange={(e) => setFormData({...formData, financial_supporter: {...formData.financial_supporter, relationship: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., Father, Mother, Brother"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.financial_supporter.email}
              onChange={(e) => setFormData({...formData, financial_supporter: {...formData.financial_supporter, email: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Guarantor in China Section */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Guarantor in China</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.guarantor_in_china.name}
              onChange={(e) => setFormData({...formData, guarantor_in_china: {...formData.guarantor_in_china, name: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.guarantor_in_china.phone_number}
              onChange={(e) => setFormData({...formData, guarantor_in_china: {...formData.guarantor_in_china, phone_number: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Example: +86-10-12345678"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile *</label>
            <input
              type="tel"
              value={formData.guarantor_in_china.mobile}
              onChange={(e) => setFormData({...formData, guarantor_in_china: {...formData.guarantor_in_china, mobile: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Example: +86-13612345678"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.guarantor_in_china.email}
              onChange={(e) => setFormData({...formData, guarantor_in_china: {...formData.guarantor_in_china, email: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <input
              type="text"
              value={formData.guarantor_in_china.address}
              onChange={(e) => setFormData({...formData, guarantor_in_china: {...formData.guarantor_in_china, address: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
            <input
              type="text"
              value={formData.guarantor_in_china.organization}
              onChange={(e) => setFormData({...formData, guarantor_in_china: {...formData.guarantor_in_china, organization: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Social Media Accounts Section */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Media Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Account</label>
            <input
              type="text"
              value={formData.social_media_accounts.facebook}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, facebook: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WeChat</label>
            <input
              type="text"
              value={formData.social_media_accounts.wechat}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, wechat: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Account</label>
            <input
              type="text"
              value={formData.social_media_accounts.linkedin}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, linkedin: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Twitter Account</label>
            <input
              type="text"
              value={formData.social_media_accounts.twitter}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, twitter: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">QQ</label>
            <input
              type="text"
              value={formData.social_media_accounts.qq}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, qq: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DingTalk</label>
            <input
              type="text"
              value={formData.social_media_accounts.dingtalk}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, dingtalk: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skype</label>
            <input
              type="text"
              value={formData.social_media_accounts.skype}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, skype: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
            <input
              type="text"
              value={formData.social_media_accounts.instagram}
              onChange={(e) => setFormData({...formData, social_media_accounts: {...formData.social_media_accounts, instagram: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Study in China Section */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Study Background</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Have you ever studied online or offline at any institution in China? *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="studied_in_china"
                  checked={formData.studied_in_china === true}
                  onChange={() => setFormData({...formData, studied_in_china: true})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="studied_in_china"
                  checked={formData.studied_in_china === false}
                  onChange={() => setFormData({...formData, studied_in_china: false})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>No</span>
              </label>
            </div>
          </div>
          {formData.studied_in_china && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Study Details</label>
              <textarea
                value={formData.studied_in_china_details}
                onChange={(e) => setFormData({...formData, studied_in_china_details: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows="3"
                placeholder="Please provide details about your study in China"
              />
            </div>
          )}
        </div>
      </div>

      {/* Employment Background Section */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Background</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Do you have work experience? *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="work_experience"
                  checked={formData.work_experience === true}
                  onChange={() => setFormData({...formData, work_experience: true})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="work_experience"
                  checked={formData.work_experience === false}
                  onChange={() => setFormData({...formData, work_experience: false})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>No</span>
              </label>
            </div>
          </div>
          {formData.work_experience && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">Work Experience Details</label>
                <button
                  type="button"
                  onClick={addWorkExperience}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm"
                >
                  Add Work Experience
                </button>
              </div>
              {formData.work_experience_details && formData.work_experience_details.map((exp, index) => (
                <div key={index} className="border p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700">Work Experience #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeWorkExperience(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                      <input
                        type="date"
                        value={exp.from}
                        onChange={(e) => updateWorkExperience(index, 'from', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                      <input
                        type="date"
                        value={exp.to}
                        onChange={(e) => updateWorkExperience(index, 'to', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={exp.country}
                        onChange={(e) => updateWorkExperience(index, 'country', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Have you ever worked in China? *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="worked_in_china"
                  checked={formData.worked_in_china === true}
                  onChange={() => setFormData({...formData, worked_in_china: true})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="worked_in_china"
                  checked={formData.worked_in_china === false}
                  onChange={() => setFormData({...formData, worked_in_china: false})}
                  className="w-4 h-4 text-teal-600"
                />
                <span>No</span>
              </label>
            </div>
          </div>
          {formData.worked_in_china && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work in China Details</label>
              <textarea
                value={formData.worked_in_china_details}
                onChange={(e) => setFormData({...formData, worked_in_china_details: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows="3"
                placeholder="Please provide details about your work experience in China"
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

// Security Tab Component
function SecurityTab({ adminViewMode = false, partnerViewMode = false, viewingStudentId = null }) {
  const { user } = useAuthStore()
  const [passwordInfo, setPasswordInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadPasswordInfo()
  }, [adminViewMode, partnerViewMode, viewingStudentId])

  const loadPasswordInfo = async () => {
    setLoading(true)
    try {
      if (adminViewMode && viewingStudentId) {
        // Admin viewing student - use admin endpoint
        const response = await api.get(`/admin/students/${viewingStudentId}/password`)
        // Response should have: email, has_password, note, student_id
        if (response.data) {
          // Remove the standard backend note - we don't need to show it
          const passwordData = {
            ...response.data,
            note: undefined // Don't show the standard backend note
          }
          setPasswordInfo(passwordData)
        } else {
          throw new Error('No data in response')
        }
      } else if (partnerViewMode && viewingStudentId) {
        // Partner viewing student - use partner endpoint
        const response = await api.get(`/partners/me/students/${viewingStudentId}/password`)
        // Response should have: email, has_password, note, student_id
        if (response.data) {
          // Remove the standard backend note - we don't need to show it
          const passwordData = {
            ...response.data,
            note: undefined // Don't show the standard backend note
          }
          setPasswordInfo(passwordData)
        } else {
          throw new Error('No data in response')
        }
      } else {
        // Student viewing own profile - get student ID first
        try {
          const profileResponse = await api.get('/students/me')
          if (profileResponse.data?.id) {
            const response = await api.get(`/admin/students/${profileResponse.data.id}/password`)
            if (response.data) {
              const passwordData = {
                ...response.data,
                note: undefined // Don't show the standard backend note
              }
              setPasswordInfo(passwordData)
            } else {
              throw new Error('No data in response')
            }
          } else {
            // Fallback: assume password exists if user is authenticated
            setPasswordInfo({
              has_password: true,
              email: user?.email,
              note: undefined
            })
          }
        } catch (e) {
          console.error('Error loading password info for student:', e)
          // If admin endpoint fails, show error
          setPasswordInfo({
            has_password: true,
            email: user?.email,
            note: "Unable to load password status. You can still update your password below."
          })
        }
      }
    } catch (error) {
      console.error('Error loading password info:', error)
      // Only show error if we don't have valid data
      setPasswordInfo({
        has_password: true,
        email: error.response?.data?.email || user?.email || 'N/A',
        note: "Unable to load password status. You can still update your password below."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New password and confirm password do not match')
      return
    }
    
    if (formData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    setUpdating(true)
    try {
      if (adminViewMode && viewingStudentId) {
        // Admin updating student password - no need for current password
        await api.post(`/admin/students/${viewingStudentId}/set-password`, {
          password: formData.newPassword
        })
        alert('Password updated successfully!')
      } else if (partnerViewMode && viewingStudentId) {
        // Partner updating student password - no need for current password
        await api.post(`/partners/me/students/${viewingStudentId}/set-password`, {
          password: formData.newPassword
        })
        alert('Password updated successfully!')
      } else {
        // Student updating own password - we need a student endpoint
        // For now, we'll use the admin endpoint if available
        // But ideally, we should have a /students/me/password endpoint
        try {
          const profileResponse = await api.get('/students/me')
          if (profileResponse.data?.id) {
            await api.post(`/admin/students/${profileResponse.data.id}/set-password`, {
              password: formData.newPassword
            })
            alert('Password updated successfully!')
          } else {
            alert('Unable to update password. Please contact support.')
          }
        } catch (e) {
          alert('Unable to update password. Please contact support.')
        }
      }
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowUpdateForm(false)
      await loadPasswordInfo()
    } catch (error) {
      console.error('Error updating password:', error)
      alert(error.response?.data?.detail || 'Failed to update password. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Password Management</h3>
        
        {/* Password Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Password Status</h4>
              <p className="text-sm text-gray-600">{passwordInfo?.email || user?.email || 'N/A'}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              passwordInfo?.has_password 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {passwordInfo?.has_password ? 'Password Set' : 'No Password'}
            </div>
            </div>
            {/* Only show error messages, hide standard backend notes */}
            {passwordInfo?.note && passwordInfo.note.includes("Unable to load") && (
              <p className="text-sm text-yellow-600 italic mt-2">{passwordInfo.note}</p>
            )}
          </div>

        {/* Update Password Form */}
        {!showUpdateForm ? (
          <button
            onClick={() => setShowUpdateForm(true)}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            {(adminViewMode || partnerViewMode) ? 'Set/Update Password' : 'Update Password'}
          </button>
        ) : (
          <form onSubmit={handleUpdatePassword} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h4 className="font-medium text-gray-900 mb-4">
              {(adminViewMode || partnerViewMode) ? 'Set/Update Student Password' : 'Update Your Password'}
            </h4>
            
            {!(adminViewMode || partnerViewMode) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter current password"
                  required={!adminViewMode}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(adminViewMode || partnerViewMode) ? 'Admin/Partner can set password without current password' : 'Required to verify your identity'}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter new password (minimum 6 characters)"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
              {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={updating || (formData.newPassword && formData.newPassword !== formData.confirmPassword)}
                className="flex-1 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpdateForm(false)
                  setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// Chat Window Component
function ChatWindow({ messages, chatInput, setChatInput, sendChatMessage, chatLoading, chatEndRef }) {
  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
      <div className="bg-teal-600 text-white px-4 py-3 rounded-t-lg flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <span className="font-semibold">Admission Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Ask me anything about your application process!</p>
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
                    ? 'bg-teal-600 text-white'
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
            placeholder="Ask about your application..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            disabled={chatLoading}
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

