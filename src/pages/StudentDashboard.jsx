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

  useEffect(() => {
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
      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        {/* Left Sidebar - User Profile */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {studentProfile?.full_name || user?.name || 'Student'}
              </h2>
              <p className="text-gray-600 text-sm mb-4">{user?.email}</p>
              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium mx-auto">
                <Camera className="w-4 h-4" />
                Change Photo
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
            {activeTab === 'personal' && <PersonalInfoTab profile={studentProfile} onUpdate={loadStudentProfile} />}
            {activeTab === 'passport' && <PassportScoresTab profile={studentProfile} onUpdate={loadStudentProfile} />}
            {activeTab === 'programs' && <ProgramsTab applications={applications} onUpdate={loadApplications} />}
            {activeTab === 'documents' && <DocumentsTab studentId={studentProfile?.id} profile={studentProfile} onUpdate={loadStudentProfile} />}
            {activeTab === 'cova' && <CovaTab profile={studentProfile} onUpdate={loadStudentProfile} />}
            {activeTab === 'security' && <SecurityTab />}
          </div>

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
    'full_name', 'email', 'phone', 'country_of_citizenship',
    'date_of_birth', 'passport_number', 'current_address'
  ]
  const filled = fields.filter(field => profile[field]).length
  return Math.round((filled / fields.length) * 100)
}

// Personal Info Tab Component
function PersonalInfoTab({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    given_name: profile?.given_name || '',
    family_name: profile?.family_name || '',
    father_name: profile?.father_name || '',
    mother_name: profile?.mother_name || '',
    gender: profile?.gender || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    wechat_id: profile?.wechat_id || '',
    country_of_citizenship: profile?.country_of_citizenship || '',
    date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
    current_address: profile?.current_address || '',
    current_country_of_residence: profile?.current_country_of_residence || '',
    highest_degree_name: profile?.highest_degree_name || '',
    highest_degree_institution: profile?.highest_degree_institution || '',
    highest_degree_country: profile?.highest_degree_country || '',
    highest_degree_year: profile?.highest_degree_year || '',
    highest_degree_cgpa: profile?.highest_degree_cgpa || '',
    relation_with_guarantor: profile?.relation_with_guarantor || '',
    is_the_bank_guarantee_in_students_name: profile?.is_the_bank_guarantee_in_students_name !== undefined ? profile.is_the_bank_guarantee_in_students_name : true
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/students/me', formData)
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name (Given Name)</label>
          <input
            type="text"
            value={formData.given_name}
            onChange={(e) => setFormData({...formData, given_name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name (Family Name)</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WeChat ID</label>
          <input
            type="text"
            value={formData.wechat_id}
            onChange={(e) => setFormData({...formData, wechat_id: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Optional"
          />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Degree Name *</label>
            <select
              value={formData.highest_degree_name}
              onChange={(e) => setFormData({...formData, highest_degree_name: e.target.value})}
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
              max={new Date().getFullYear() + 1}
              value={formData.highest_degree_year}
              onChange={(e) => setFormData({...formData, highest_degree_year: e.target.value ? parseInt(e.target.value) : ''})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CGPA/GPA *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.highest_degree_cgpa}
              onChange={(e) => setFormData({...formData, highest_degree_cgpa: e.target.value ? parseFloat(e.target.value) : ''})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., 3.75"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter your CGPA or GPA (out of 4.0 or 10.0 scale)</p>
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
function PassportScoresTab({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    passport_number: profile?.passport_number || '',
    passport_expiry_date: profile?.passport_expiry_date ? profile.passport_expiry_date.split('T')[0] : '',
    hsk_level: profile?.hsk_level || '',
    csca_status: profile?.csca_status || 'NOT_REGISTERED',
    csca_score_math: profile?.csca_score_math || '',
    csca_score_specialized_chinese: profile?.csca_score_specialized_chinese || '',
    csca_score_physics: profile?.csca_score_physics || '',
    csca_score_chemistry: profile?.csca_score_chemistry || '',
    english_test_type: profile?.english_test_type || 'NONE',
    english_test_score: profile?.english_test_score || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/students/me', formData)
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
            value={formData.hsk_level}
            onChange={(e) => setFormData({...formData, hsk_level: e.target.value ? parseInt(e.target.value) : ''})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Not taken</option>
            <option value="1">HSK 1</option>
            <option value="2">HSK 2</option>
            <option value="3">HSK 3</option>
            <option value="4">HSK 4</option>
            <option value="5">HSK 5</option>
            <option value="6">HSK 6</option>
          </select>
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
            <option value="NONE">None</option>
            <option value="IELTS">IELTS</option>
            <option value="TOEFL">TOEFL</option>
            <option value="TOEIC">TOEIC</option>
            <option value="OTHER">Other</option>
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
function CovaTab({ profile, onUpdate }) {
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
      await api.put('/students/me', formData)
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
      onUpdate()
      setEditingApp(null)
      alert('Application updated successfully!')
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update application. Please try again.')
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
          {applications.map((app) => (
            <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800">{app.university_name}</h4>
                  <p className="text-gray-600">{app.major_name}</p>
                  <p className="text-sm text-gray-500">{app.intake_term} {app.intake_year}</p>
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
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-xs text-gray-500">Scholarship Preference</p>
                      {editingApp === app.id ? (
                        <select
                          value={app.scholarship_preference || ''}
                          onChange={(e) => handleEditApplication(app.id, e.target.value)}
                          onBlur={() => setEditingApp(null)}
                          className="text-sm font-semibold text-teal-600 border border-teal-300 rounded px-2 py-1"
                          autoFocus
                        >
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
                        </select>
                      ) : (
                        <p className="text-sm font-semibold text-teal-600">
                          {app.scholarship_preference || 'Not selected'}
                          {canEdit(app) && (
                            <button
                              onClick={() => setEditingApp(app.id)}
                              className="ml-2 text-teal-600 hover:text-teal-700"
                              title="Edit scholarship preference"
                            >
                              <Edit className="w-3 h-3 inline" />
                            </button>
                          )}
                        </p>
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
                  onChange={(e) => setFormData({ ...formData, degree_level: e.target.value })}
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
                    setFormData({ ...formData, university_id: uniId, major_id: '', program_intake_id: '' })
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
                    setFormData({ ...formData, major_id: majorId, program_intake_id: '' })
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
                >
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
                </select>
                <p className="text-xs text-gray-500 mt-1">Note: Language programs have no scholarship</p>
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
function DocumentsTab({ studentId, profile, onUpdate }) {
  const [uploading, setUploading] = useState({})
  const [documents, setDocuments] = useState([])
  const fileInputRefs = useRef({})

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      // Load verified documents from student-documents endpoint
      const response = await api.get('/verify-document/student-documents')
      setDocuments(response.data || [])
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
      description: 'Upload your passport size photograph',
      documentType: 'photo',
      field: 'passport_photo_url'
    },
    {
      id: 'transcript',
      title: 'Academic Transcripts',
      icon: '🎓',
      description: 'Upload scanned color copies of your academic transcripts',
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
      
      console.log(`🚀 Sending to backend: /verify-document/verify-and-upload`)
      console.log(`📋 FormData - doc_type: ${docType.documentType}`)

      // Use verify-and-upload endpoint
      const response = await api.post('/verify-document/verify-and-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

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
      await api.delete(`/verify-document/student-documents/${documentId}`)
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

// Security Tab Component - Placeholder
function SecurityTab() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h3>
      <p className="text-gray-600">Security settings will be implemented here.</p>
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

