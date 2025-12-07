import { useState, useEffect } from 'react'
import { BarChart3, Users, FileText, MessageSquare, Settings, Upload, MessageCircle, Bot, User as UserIcon, Building2, GraduationCap, Calendar, Plus, Edit, Trash2, X, Play, Loader2 } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import ReactMarkdown from 'react-markdown'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [complaints, setComplaints] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  
  // Loading states for each tab
  const [loadingStates, setLoadingStates] = useState({
    overview: false,
    leads: false,
    complaints: false,
    chat: false,
    users: false,
    students: false,
    applications: false,
    universities: false,
    majors: false,
    intakes: false,
    rag: false,
    settings: false,
    automation: false
  })
  
  // Students pagination state
  const [students, setStudents] = useState([])
  const [studentsPage, setStudentsPage] = useState(1)
  const [studentsPageSize] = useState(20)
  const [studentsTotal, setStudentsTotal] = useState(0)
  const [studentsSearch, setStudentsSearch] = useState('')
  const [studentsSearchDebounced, setStudentsSearchDebounced] = useState('')
  
  // Debounce search for students
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentsSearchDebounced(studentsSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [studentsSearch])
  
  // Load students when search changes
  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents(1, studentsSearchDebounced)
    }
  }, [studentsSearchDebounced, activeTab])
  const [ragFile, setRagFile] = useState(null)
  const [ragText, setRagText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [modelSettings, setModelSettings] = useState({ temperature: 0.7, top_k: 5, top_p: 1.0 })
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Universities, Majors, Program Intakes state
  const [universities, setUniversities] = useState([])
  const [majors, setMajors] = useState([])
  const [programIntakes, setProgramIntakes] = useState([])
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [selectedMajor, setSelectedMajor] = useState(null)
  
  // Applications state
  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [applicationFilters, setApplicationFilters] = useState({
    status: '',
    university_id: '',
    student_id: ''
  })
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationUpdateForm, setApplicationUpdateForm] = useState({
    status: '',
    admin_notes: '',
    result: '',
    result_notes: '',
    application_fee_paid: false
  })
  
  // Automation state
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [automationForm, setAutomationForm] = useState({
    student_id: '',
    apply_url: '',
    username: '',
    password: '',
    portal_type: ''
  })
  const [automationRunning, setAutomationRunning] = useState(false)
  const [automationResult, setAutomationResult] = useState(null)
  
  // Form states
  const [showUniversityForm, setShowUniversityForm] = useState(false)
  const [showMajorForm, setShowMajorForm] = useState(false)
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState(null)
  const [editingMajor, setEditingMajor] = useState(null)
  const [editingIntake, setEditingIntake] = useState(null)
  
  // Form data
  const [universityForm, setUniversityForm] = useState({
    name: '', city: '', province: '', country: 'China', is_partner: true,
    university_ranking: '', logo_url: '', description: '', website: '', contact_email: '', contact_wechat: ''
  })
  const [majorForm, setMajorForm] = useState({
    university_id: '', name: '', degree_level: 'Bachelor', teaching_language: 'English',
    duration_years: '', description: '', discipline: '', is_featured: false
  })
  const [intakeForm, setIntakeForm] = useState({
    university_id: '', major_id: '', intake_term: 'September', intake_year: new Date().getFullYear(),
    application_deadline: '', documents_required: '', tuition_per_semester: '', tuition_per_year: '',
    application_fee: '', accommodation_fee: '', service_fee: '', medical_insurance_fee: '',
    teaching_language: 'English', duration_years: '', degree_type: '', 
    arrival_medical_checkup_fee: '', admission_process: '', accommodation_note: '', visa_extension_fee: '',
    notes: '', scholarship_info: ''
  })
  
  // Pagination and search for program intakes
  const [intakeSearchTerm, setIntakeSearchTerm] = useState('')
  const [intakeCurrentPage, setIntakeCurrentPage] = useState(1)
  const [intakePageSize] = useState(10)
  
  const { logout, token, isAuthenticated, user } = useAuthStore()
  
  useEffect(() => {
    // Check if user is admin first
    if (!isAuthenticated || user?.role !== 'admin') {
      console.error('Admin access required', { isAuthenticated, user })
      return
    }
    
    // Ensure token is set in API client if available
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      console.log('Token set in API client:', token.substring(0, 20) + '...')
    } else {
      console.warn('No token available in store')
      // Try to get token from localStorage
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const parsed = JSON.parse(authStorage)
          const storedToken = parsed.state?.token
          if (storedToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
            console.log('Token retrieved from localStorage')
          }
        }
      } catch (e) {
        console.error('Error reading token from localStorage:', e)
      }
    }
    
    // Only load overview stats on initial mount
    loadStats()
    loadModelSettings()
  }, [token, isAuthenticated, user])
  
  useEffect(() => {
    // Lazy load data only when tab is clicked
    if (activeTab === 'overview') {
      // Overview already loaded on mount
    } else if (activeTab === 'leads') {
      loadLeads()
    } else if (activeTab === 'complaints') {
      loadComplaints()
    } else if (activeTab === 'chat') {
      loadConversations()
    } else if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'students') {
      loadStudents()
    } else if (activeTab === 'universities') {
      loadUniversities()
    } else if (activeTab === 'majors') {
      loadMajors()
      loadUniversities() // Load universities for dropdown
    } else if (activeTab === 'intakes') {
      loadProgramIntakes()
      loadUniversities() // Load universities for dropdown
      loadMajors() // Load majors for display and filtering
    } else if (activeTab === 'applications') {
      loadApplications()
      loadUniversities() // Load universities for filter
    }
  }, [activeTab])
  
  useEffect(() => {
    if (selectedUniversity && activeTab === 'majors') {
      loadMajors(selectedUniversity)
    }
  }, [selectedUniversity, activeTab])
  
  useEffect(() => {
    if (selectedMajor && activeTab === 'intakes') {
      loadProgramIntakes(null, selectedMajor)
    }
  }, [selectedMajor, activeTab])
  
  const setLoading = (tab, loading) => {
    setLoadingStates(prev => ({ ...prev, [tab]: loading }))
  }
  
  const loadStats = async () => {
    setLoading('overview', true)
    try {
      const response = await api.get('/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading('overview', false)
    }
  }
  
  const loadLeads = async () => {
    setLoading('leads', true)
    try {
      const response = await api.get('/admin/leads?days=7')
      setLeads(response.data)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading('leads', false)
    }
  }
  
  const loadComplaints = async () => {
    setLoading('complaints', true)
    try {
      const response = await api.get('/admin/complaints')
      setComplaints(response.data)
    } catch (error) {
      console.error('Error loading complaints:', error)
    } finally {
      setLoading('complaints', false)
    }
  }
  
  const loadConversations = async () => {
    setLoading('chat', true)
    try {
      const response = await api.get('/admin/conversations')
      setConversations(response.data)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading('chat', false)
    }
  }
  
  const loadUsers = async () => {
    setLoading('users', true)
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading('users', false)
    }
  }
  
  const loadStudents = async (page = studentsPage, search = studentsSearch) => {
    setLoading('students', true)
    try {
      const response = await api.get(`/admin/students?page=${page}&page_size=${studentsPageSize}&search=${encodeURIComponent(search || '')}`)
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
  
  const loadModelSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      if (response.data) {
        setModelSettings({
          temperature: response.data.temperature || 0.7,
          top_k: response.data.top_k || 5,
          top_p: response.data.top_p || 1.0
        })
      }
    } catch (error) {
      console.error('Error loading model settings:', error)
    }
  }
  
  // Applications Management
  const loadApplications = async () => {
    setLoading('applications', true)
    try {
      let url = '/admin/applications?'
      if (applicationFilters.status) url += `status=${applicationFilters.status}&`
      if (applicationFilters.university_id) url += `university_id=${applicationFilters.university_id}&`
      if (applicationFilters.student_id) url += `student_id=${applicationFilters.student_id}&`
      const response = await api.get(url)
      setApplications(response.data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      setApplications([])
    } finally {
      setLoading('applications', false)
    }
  }

  const handleViewApplication = async (applicationId) => {
    try {
      const response = await api.get(`/admin/applications/${applicationId}`)
      setSelectedApplication(response.data)
      setApplicationUpdateForm({
        status: response.data.status,
        admin_notes: response.data.admin_notes || '',
        result: response.data.result || '',
        result_notes: response.data.result_notes || '',
        application_fee_paid: response.data.application_fee_paid || false
      })
      setShowApplicationModal(true)
    } catch (error) {
      console.error('Error loading application details:', error)
      alert('Failed to load application details')
    }
  }

  const handleUpdateApplication = async () => {
    try {
      await api.put(`/admin/applications/${selectedApplication.id}`, applicationUpdateForm)
      alert('Application updated successfully')
      setShowApplicationModal(false)
      setSelectedApplication(null)
      loadApplications()
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update application')
    }
  }
  
  // Automation functions
  const handleRunAutomation = async () => {
    if (!automationForm.student_id || !automationForm.apply_url) {
      alert('Please provide Student ID and Apply URL')
      return
    }
    
    setAutomationRunning(true)
    setAutomationResult(null)
    
    try {
      const response = await api.post('/admin/automation/run', {
        student_id: parseInt(automationForm.student_id),
        apply_url: automationForm.apply_url,
        username: automationForm.username || null,
        password: automationForm.password || null,
        portal_type: automationForm.portal_type || null
      })
      
      setAutomationResult(response.data)
      if (response.data.status === 'ok') {
        alert('Automation completed successfully! Check the logs and screenshot.')
      } else {
        alert(`Automation failed: ${response.data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Automation error:', error)
      setAutomationResult({
        status: 'error',
        error: error.response?.data?.detail || error.message
      })
      alert(`Automation failed: ${error.response?.data?.detail || error.message}`)
    } finally {
      setAutomationRunning(false)
    }
  }
  
  const handleOpenAutomationForApplication = (application) => {
    setAutomationForm({
      student_id: application.student_id?.toString() || '',
      apply_url: '',
      username: '',
      password: '',
      portal_type: ''
    })
    setShowAutomationModal(true)
    setAutomationResult(null)
  }
  
  const handleRAGUpload = async () => {
    if (!ragFile && !ragText.trim()) {
      alert('Please provide either a file or plain text')
      return
    }
    
    setUploading(true)
    try {
      const formData = new FormData()
      if (ragFile) {
        formData.append('file', ragFile)
      }
      if (ragText.trim()) {
        formData.append('text', ragText)
      }
      
      await api.post('/rag/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      alert('RAG document uploaded and processed successfully!')
      setRagFile(null)
      setRagText('')
    } catch (error) {
      alert(error.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }
  
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await api.post('/admin/tune', modelSettings)
      alert('Model settings saved successfully!')
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }
  
  // Universities CRUD
  const loadUniversities = async () => {
    setLoading('universities', true)
    try {
      const response = await api.get('/universities/')
      setUniversities(response.data)
    } catch (error) {
      console.error('Error loading universities:', error)
    } finally {
      setLoading('universities', false)
    }
  }
  
  const handleCreateUniversity = async () => {
    try {
      // Convert empty strings to null for optional fields
      const formData = {
        ...universityForm,
        university_ranking: universityForm.university_ranking === '' || universityForm.university_ranking === null ? null : parseInt(universityForm.university_ranking),
        logo_url: universityForm.logo_url?.trim() || null,
        website: universityForm.website?.trim() || null,
        description: universityForm.description?.trim() || null,
        contact_email: universityForm.contact_email?.trim() || null,
        contact_wechat: universityForm.contact_wechat?.trim() || null,
        city: universityForm.city?.trim() || null,
        province: universityForm.province?.trim() || null,
      }
      await api.post('/universities/', formData)
      alert('University created successfully!')
      setShowUniversityForm(false)
      resetUniversityForm()
      loadUniversities()
    } catch (error) {
      console.error('Error creating university:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to create university'
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    }
  }
  
  const handleUpdateUniversity = async () => {
    try {
      // Convert empty strings to null for optional fields
      const formData = {
        ...universityForm,
        university_ranking: universityForm.university_ranking === '' || universityForm.university_ranking === null ? null : parseInt(universityForm.university_ranking),
        logo_url: universityForm.logo_url?.trim() || null,
        website: universityForm.website?.trim() || null,
        description: universityForm.description?.trim() || null,
        contact_email: universityForm.contact_email?.trim() || null,
        contact_wechat: universityForm.contact_wechat?.trim() || null,
        city: universityForm.city?.trim() || null,
        province: universityForm.province?.trim() || null,
      }
      await api.put(`/universities/${editingUniversity.id}`, formData)
      alert('University updated successfully!')
      setShowUniversityForm(false)
      setEditingUniversity(null)
      resetUniversityForm()
      loadUniversities()
    } catch (error) {
      console.error('Error updating university:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to update university'
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    }
  }
  
  const handleDeleteUniversity = async (id) => {
    if (!confirm('Are you sure you want to delete this university? This will also delete all associated majors and intakes.')) {
      return
    }
    try {
      await api.delete(`/universities/${id}`)
      alert('University deleted successfully!')
      loadUniversities()
    } catch (error) {
      console.error('Error deleting university:', error)
      alert('Failed to delete university')
    }
  }
  
  const resetUniversityForm = () => {
    setUniversityForm({
      name: '', city: '', province: '', country: 'China', is_partner: true,
      university_ranking: '', logo_url: '', description: '', website: '', contact_email: '', contact_wechat: ''
    })
  }
  
  const startEditUniversity = (university) => {
    setEditingUniversity(university)
    setUniversityForm({
      name: university.name || '',
      city: university.city || '',
      province: university.province || '',
      country: university.country || 'China',
      is_partner: university.is_partner !== undefined ? university.is_partner : true,
      university_ranking: university.university_ranking || '',
      logo_url: university.logo_url || '',
      description: university.description || '',
      website: university.website || '',
      contact_email: university.contact_email || '',
      contact_wechat: university.contact_wechat || ''
    })
    setShowUniversityForm(true)
  }
  
  // Majors CRUD
  const loadMajors = async (universityId = null) => {
    setLoading('majors', true)
    try {
      const url = universityId ? `/majors/?university_id=${universityId}` : '/majors/'
      const response = await api.get(url)
      setMajors(response.data)
    } catch (error) {
      console.error('Error loading majors:', error)
    } finally {
      setLoading('majors', false)
    }
  }
  
  const handleCreateMajor = async () => {
    try {
      const data = {
        ...majorForm,
        university_id: parseInt(majorForm.university_id),
        duration_years: majorForm.duration_years ? parseFloat(majorForm.duration_years) : null
      }
      await api.post('/majors/', data)
      alert('Major created successfully!')
      setShowMajorForm(false)
      resetMajorForm()
      loadMajors(selectedUniversity)
    } catch (error) {
      console.error('Error creating major:', error)
      alert('Failed to create major')
    }
  }
  
  const handleUpdateMajor = async () => {
    try {
      const data = {
        ...majorForm,
        duration_years: majorForm.duration_years ? parseFloat(majorForm.duration_years) : null
      }
      await api.put(`/majors/${editingMajor.id}`, data)
      alert('Major updated successfully!')
      setShowMajorForm(false)
      setEditingMajor(null)
      resetMajorForm()
      loadMajors(selectedUniversity)
    } catch (error) {
      console.error('Error updating major:', error)
      alert('Failed to update major')
    }
  }
  
  const handleDeleteMajor = async (id) => {
    if (!confirm('Are you sure you want to delete this major? This will also delete all associated program intakes.')) {
      return
    }
    try {
      await api.delete(`/majors/${id}`)
      alert('Major deleted successfully!')
      loadMajors(selectedUniversity)
    } catch (error) {
      console.error('Error deleting major:', error)
      alert('Failed to delete major')
    }
  }
  
  const resetMajorForm = () => {
    setMajorForm({
      university_id: selectedUniversity || '', name: '', degree_level: 'Bachelor',
      teaching_language: 'English', duration_years: '', description: '', discipline: '', is_featured: false
    })
  }
  
  const startEditMajor = (major) => {
    setEditingMajor(major)
    setMajorForm({
      university_id: major.university_id || '',
      name: major.name || '',
      degree_level: major.degree_level || 'Bachelor',
      teaching_language: major.teaching_language || 'English',
      duration_years: major.duration_years || '',
      description: major.description || '',
      discipline: major.discipline || '',
      is_featured: major.is_featured || false
    })
    setShowMajorForm(true)
  }
  
  // Program Intakes CRUD
  const loadProgramIntakes = async (universityId = null, majorId = null) => {
    setLoading('intakes', true)
    try {
      let url = '/program-intakes/?upcoming_only=false'
      if (universityId) url += `&university_id=${universityId}`
      if (majorId) url += `&major_id=${majorId}`
      const response = await api.get(url)
      console.log('Program intakes response:', response.data)
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setProgramIntakes(response.data)
      } else {
        console.error('Expected array but got:', typeof response.data, response.data)
        setProgramIntakes([])
      }
    } catch (error) {
      console.error('Error loading program intakes:', error)
      setProgramIntakes([])
    } finally {
      setLoading('intakes', false)
    }
  }
  
  const handleCreateIntake = async () => {
    try {
      const data = {
        ...intakeForm,
        university_id: parseInt(intakeForm.university_id),
        major_id: parseInt(intakeForm.major_id),
        intake_year: parseInt(intakeForm.intake_year),
        application_deadline: new Date(intakeForm.application_deadline).toISOString(),
        tuition_per_semester: intakeForm.tuition_per_semester ? parseFloat(intakeForm.tuition_per_semester) : null,
        tuition_per_year: intakeForm.tuition_per_year ? parseFloat(intakeForm.tuition_per_year) : null,
        application_fee: intakeForm.application_fee ? parseFloat(intakeForm.application_fee) : null,
        accommodation_fee: intakeForm.accommodation_fee ? parseFloat(intakeForm.accommodation_fee) : null,
        service_fee: intakeForm.service_fee ? parseFloat(intakeForm.service_fee) : null,
        medical_insurance_fee: intakeForm.medical_insurance_fee ? parseFloat(intakeForm.medical_insurance_fee) : null,
        duration_years: intakeForm.duration_years ? parseFloat(intakeForm.duration_years) : null,
        teaching_language: intakeForm.teaching_language || null,
        degree_type: intakeForm.degree_type || null,
        arrival_medical_checkup_fee: intakeForm.arrival_medical_checkup_fee ? parseFloat(intakeForm.arrival_medical_checkup_fee) : null,
        admission_process: intakeForm.admission_process || null,
        accommodation_note: intakeForm.accommodation_note || null,
        visa_extension_fee: intakeForm.visa_extension_fee ? parseFloat(intakeForm.visa_extension_fee) : null
      }
      await api.post('/program-intakes/', data)
      alert('Program intake created successfully!')
      setShowIntakeForm(false)
      resetIntakeForm()
      loadProgramIntakes(selectedUniversity, selectedMajor)
    } catch (error) {
      console.error('Error creating program intake:', error)
      alert('Failed to create program intake')
    }
  }
  
  const handleUpdateIntake = async () => {
    try {
      const data = {
        ...intakeForm,
        application_deadline: new Date(intakeForm.application_deadline).toISOString(),
        tuition_per_semester: intakeForm.tuition_per_semester ? parseFloat(intakeForm.tuition_per_semester) : null,
        tuition_per_year: intakeForm.tuition_per_year ? parseFloat(intakeForm.tuition_per_year) : null,
        application_fee: intakeForm.application_fee ? parseFloat(intakeForm.application_fee) : null,
        accommodation_fee: intakeForm.accommodation_fee ? parseFloat(intakeForm.accommodation_fee) : null,
        service_fee: intakeForm.service_fee ? parseFloat(intakeForm.service_fee) : null,
        medical_insurance_fee: intakeForm.medical_insurance_fee ? parseFloat(intakeForm.medical_insurance_fee) : null,
        duration_years: intakeForm.duration_years ? parseFloat(intakeForm.duration_years) : null,
        teaching_language: intakeForm.teaching_language || null,
        degree_type: intakeForm.degree_type || null,
        arrival_medical_checkup_fee: intakeForm.arrival_medical_checkup_fee ? parseFloat(intakeForm.arrival_medical_checkup_fee) : null,
        admission_process: intakeForm.admission_process || null,
        accommodation_note: intakeForm.accommodation_note || null,
        visa_extension_fee: intakeForm.visa_extension_fee ? parseFloat(intakeForm.visa_extension_fee) : null
      }
      await api.put(`/program-intakes/${editingIntake.id}`, data)
      alert('Program intake updated successfully!')
      setShowIntakeForm(false)
      setEditingIntake(null)
      resetIntakeForm()
      loadProgramIntakes(selectedUniversity, selectedMajor)
    } catch (error) {
      console.error('Error updating program intake:', error)
      alert('Failed to update program intake')
    }
  }
  
  const handleDeleteIntake = async (id) => {
    if (!confirm('Are you sure you want to delete this program intake?')) {
      return
    }
    try {
      await api.delete(`/program-intakes/${id}`)
      alert('Program intake deleted successfully!')
      loadProgramIntakes(selectedUniversity, selectedMajor)
    } catch (error) {
      console.error('Error deleting program intake:', error)
      alert('Failed to delete program intake')
    }
  }
  
  const resetIntakeForm = () => {
    setIntakeForm({
      university_id: selectedUniversity || '', major_id: selectedMajor || '',
      intake_term: 'September', intake_year: new Date().getFullYear(),
      application_deadline: '', documents_required: '', tuition_per_semester: '', tuition_per_year: '',
      application_fee: '', accommodation_fee: '', service_fee: '', medical_insurance_fee: '',
      teaching_language: 'English', duration_years: '', degree_type: '',
      arrival_medical_checkup_fee: '', admission_process: '', accommodation_note: '', visa_extension_fee: '',
      notes: '', scholarship_info: ''
    })
  }
  
  const startEditIntake = (intake) => {
    setEditingIntake(intake)
    const deadline = intake.application_deadline ? new Date(intake.application_deadline).toISOString().slice(0, 16) : ''
    setIntakeForm({
      university_id: intake.university_id || '',
      major_id: intake.major_id || '',
      intake_term: intake.intake_term || 'September',
      intake_year: intake.intake_year || new Date().getFullYear(),
      application_deadline: deadline,
      documents_required: intake.documents_required || '',
      tuition_per_semester: intake.tuition_per_semester || '',
      tuition_per_year: intake.tuition_per_year || '',
      application_fee: intake.application_fee || '',
      accommodation_fee: intake.accommodation_fee || '',
      service_fee: intake.service_fee || '',
      medical_insurance_fee: intake.medical_insurance_fee || '',
      teaching_language: intake.teaching_language || 'English',
      duration_years: intake.duration_years || '',
      degree_type: intake.degree_type || '',
      arrival_medical_checkup_fee: intake.arrival_medical_checkup_fee || '',
      admission_process: intake.admission_process || '',
      accommodation_note: intake.accommodation_note || '',
      visa_extension_fee: intake.visa_extension_fee || '',
      notes: intake.notes || '',
      scholarship_info: intake.scholarship_info || ''
    })
    setShowIntakeForm(true)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
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
              onClick={() => setActiveTab('chat')}
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
            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'leads'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.leads ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Users className="w-5 h-5" />
              )}
              Leads
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'complaints'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.complaints ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
              Complaints
            </button>
            <button
              onClick={() => setActiveTab('universities')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'universities'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.universities ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
              Universities
            </button>
            <button
              onClick={() => setActiveTab('majors')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'majors'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.majors ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
              Majors
            </button>
            <button
              onClick={() => setActiveTab('intakes')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'intakes'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.intakes ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
              Program Intakes
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'students'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.students ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
              Students
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'applications'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.applications ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              Applications
            </button>
            <button
              onClick={() => setActiveTab('rag')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'rag'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Upload className="w-5 h-5" />
              RAG Upload
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
              {loadingStates.overview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Leads Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.leads.today}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.students.total}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Pending Complaints</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.complaints.pending}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.applications.total}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Students</h2>
              </div>
              
              {/* Search */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or country..."
                    value={studentsSearch}
                    onChange={(e) => setStudentsSearch(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {loadingStates.students ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Country</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Documents</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
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
                              <td className="px-4 py-3 text-sm text-gray-600">{student.document_count || 0}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {studentsTotal > 0 && (
                    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
                      <div className="text-sm text-gray-700">
                        Showing {(studentsPage - 1) * studentsPageSize + 1} to {Math.min(studentsPage * studentsPageSize, studentsTotal)} of {studentsTotal} students
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadStudents(studentsPage - 1, studentsSearch)}
                          disabled={studentsPage === 1 || loadingStates.students}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-700">
                          Page {studentsPage} of {Math.ceil(studentsTotal / studentsPageSize)}
                        </span>
                        <button
                          onClick={() => loadStudents(studentsPage + 1, studentsSearch)}
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
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Student Conversations</h2>
              {loadingStates.chat ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Conversation List */}
                <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Recent Conversations</h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full text-left p-3 rounded-lg border ${
                          selectedConversation?.id === conv.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {conv.user ? (
                            <>
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-sm text-gray-900">
                                {conv.user.name || conv.user.email}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Anonymous</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {conv.message_count} messages • {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : ''}
                        </p>
                      </button>
                    ))}
                    {conversations.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No conversations yet</p>
                    )}
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
                  {selectedConversation ? (
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="font-medium text-gray-900">
                          {selectedConversation.user ? (
                            `Chat with ${selectedConversation.user.name || selectedConversation.user.email}`
                          ) : (
                            'Anonymous Chat'
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.message_count} messages
                        </p>
                      </div>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                          selectedConversation.messages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-3 ${
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {msg.role === 'assistant' && (
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                  msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                {msg.role === 'assistant' ? (
                                  <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                              </div>
                              {msg.role === 'user' && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="w-5 h-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No messages in this conversation</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Select a conversation to view messages</p>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          )}
          
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
              {loadingStates.leads ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{lead.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{lead.email || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{lead.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{lead.country || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}
          
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Complaints</h2>
              {loadingStates.complaints ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((complaint) => (
                  <div key={complaint.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{complaint.subject}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{complaint.message}</p>
                    {complaint.admin_response && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                        <strong>Response:</strong> {complaint.admin_response}
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Student Applications</h2>
                <button
                  onClick={loadApplications}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Refresh
                </button>
              </div>
              
              {/* Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={applicationFilters.status}
                      onChange={(e) => {
                        setApplicationFilters({...applicationFilters, status: e.target.value})
                        setTimeout(() => loadApplications(), 100)
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                    <select
                      value={applicationFilters.university_id}
                      onChange={(e) => {
                        setApplicationFilters({...applicationFilters, university_id: e.target.value})
                        setTimeout(() => loadApplications(), 100)
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">All Universities</option>
                      {universities.map(uni => (
                        <option key={uni.id} value={uni.id}>{uni.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      type="number"
                      value={applicationFilters.student_id}
                      onChange={(e) => {
                        setApplicationFilters({...applicationFilters, student_id: e.target.value})
                        setTimeout(() => loadApplications(), 100)
                      }}
                      placeholder="Filter by student ID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Applications Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">University</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Major</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intake</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">#{app.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{app.student_name || 'N/A'}</div>
                            <div className="text-gray-500 text-xs">{app.student_email || ''}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{app.university_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{app.major_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {app.intake_term} {app.intake_year}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            app.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {app.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {app.application_fee ? `${app.application_fee} RMB` : '-'}
                          {app.application_fee_paid && (
                            <span className="ml-2 text-green-600 text-xs">✓ Paid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewApplication(app.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View/Edit
                            </button>
                            <button
                              onClick={() => handleOpenAutomationForApplication(app)}
                              className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                              title="Run Application Automation"
                            >
                              <Play className="w-4 h-4" />
                              Auto-Fill
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {applications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No applications found
                  </div>
                )}
              </div>
              
              {/* Application Detail Modal */}
              {showApplicationModal && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Application #{selectedApplication.id} Details
                      </h3>
                      <button
                        onClick={() => {
                          setShowApplicationModal(false)
                          setSelectedApplication(null)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {/* Student Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                          <div><strong>Name:</strong> {selectedApplication.student?.full_name || 'N/A'}</div>
                          <div><strong>Email:</strong> {selectedApplication.student?.email || 'N/A'}</div>
                          <div><strong>Phone:</strong> {selectedApplication.student?.phone || 'N/A'}</div>
                          <div><strong>Country:</strong> {selectedApplication.student?.country || 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* Program Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Program Information</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                          <div><strong>University:</strong> {selectedApplication.program_intake?.university_name}</div>
                          <div><strong>Major:</strong> {selectedApplication.program_intake?.major_name}</div>
                          <div><strong>Intake:</strong> {selectedApplication.program_intake?.intake_term} {selectedApplication.program_intake?.intake_year}</div>
                          <div><strong>Application Fee:</strong> {selectedApplication.program_intake?.application_fee || 0} RMB</div>
                          <div><strong>Tuition (per year):</strong> {selectedApplication.program_intake?.tuition_per_year || 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* Application Status Update */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Update Application Status</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                              value={applicationUpdateForm.status}
                              onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, status: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="under_review">Under Review</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                            <input
                              type="text"
                              value={applicationUpdateForm.result}
                              onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, result: e.target.value})}
                              placeholder="e.g., Accepted, Rejected, Waitlisted"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                            <textarea
                              value={applicationUpdateForm.admin_notes}
                              onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, admin_notes: e.target.value})}
                              placeholder="Internal notes about this application"
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Result Notes</label>
                            <textarea
                              value={applicationUpdateForm.result_notes}
                              onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, result_notes: e.target.value})}
                              placeholder="Notes about the result (visible to student)"
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="fee_paid"
                              checked={applicationUpdateForm.application_fee_paid}
                              onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, application_fee_paid: e.target.checked})}
                              className="w-4 h-4"
                            />
                            <label htmlFor="fee_paid" className="text-sm text-gray-700">
                              Application fee paid
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleUpdateApplication}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setShowApplicationModal(false)
                            setSelectedApplication(null)
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
          
          {activeTab === 'rag' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Upload RAG Document</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or Enter Plain Text (will be distilled via GPT)
                    </label>
                    <textarea
                      value={ragText}
                      onChange={(e) => setRagText(e.target.value)}
                      placeholder="Enter text content here. It will be processed and distilled using GPT before creating embeddings..."
                      rows={10}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or Select File (PDF, DOCX, TXT, CSV)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setRagFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.txt,.csv"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> All content (file or text) will be distilled using GPT to extract key information before creating vector embeddings. This improves search accuracy.
                    </p>
                  </div>
                  <button
                    onClick={handleRAGUpload}
                    disabled={(!ragFile && !ragText.trim()) || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading & Processing...' : 'Upload & Process'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'universities' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Universities</h2>
                <button
                  onClick={() => {
                    resetUniversityForm()
                    setEditingUniversity(null)
                    setShowUniversityForm(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add University
                </button>
              </div>
              
              {showUniversityForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{editingUniversity ? 'Edit' : 'Add'} University</h3>
                    <button onClick={() => { setShowUniversityForm(false); setEditingUniversity(null); resetUniversityForm() }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input type="text" value={universityForm.name} onChange={(e) => setUniversityForm({...universityForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input type="text" value={universityForm.city} onChange={(e) => setUniversityForm({...universityForm, city: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                      <input type="text" value={universityForm.province} onChange={(e) => setUniversityForm({...universityForm, province: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input type="text" value={universityForm.country} onChange={(e) => setUniversityForm({...universityForm, country: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={universityForm.is_partner} onChange={(e) => setUniversityForm({...universityForm, is_partner: e.target.checked})} />
                        <span className="text-sm font-medium text-gray-700">Partner University</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">University Ranking</label>
                      <input 
                        type="number" 
                        value={universityForm.university_ranking || ''} 
                        onChange={(e) => setUniversityForm({...universityForm, university_ranking: e.target.value ? parseInt(e.target.value) : ''})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                        placeholder="e.g., 1, 2, 3..."
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: Enter the university's ranking (lower number = higher rank)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                      <input type="url" value={universityForm.logo_url} onChange={(e) => setUniversityForm({...universityForm, logo_url: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input type="url" value={universityForm.website} onChange={(e) => setUniversityForm({...universityForm, website: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <input type="email" value={universityForm.contact_email} onChange={(e) => setUniversityForm({...universityForm, contact_email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WeChat</label>
                      <input type="text" value={universityForm.contact_wechat} onChange={(e) => setUniversityForm({...universityForm, contact_wechat: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={universityForm.description} onChange={(e) => setUniversityForm({...universityForm, description: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button onClick={editingUniversity ? handleUpdateUniversity : handleCreateUniversity} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingUniversity ? 'Update' : 'Create'}
                      </button>
                      <button onClick={() => { setShowUniversityForm(false); setEditingUniversity(null); resetUniversityForm() }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ranking</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Partner</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {universities.map((uni) => (
                      <tr key={uni.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{uni.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{uni.city}{uni.province ? `, ${uni.province}` : ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{uni.university_ranking || '-'}</td>
                        <td className="px-4 py-3 text-sm">{uni.is_partner ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => startEditUniversity(uni)} className="text-blue-600 hover:text-blue-800">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUniversity(uni.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'majors' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Majors</h2>
              </div>
              {loadingStates.majors ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                <button
                  onClick={() => {
                    resetMajorForm()
                    setEditingMajor(null)
                    setShowMajorForm(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Major
                </button>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by University</label>
                <select value={selectedUniversity || ''} onChange={(e) => setSelectedUniversity(e.target.value ? parseInt(e.target.value) : null)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">All Universities</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                  ))}
                </select>
              </div>
              
              {showMajorForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{editingMajor ? 'Edit' : 'Add'} Major</h3>
                    <button onClick={() => { setShowMajorForm(false); setEditingMajor(null); resetMajorForm() }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                      <select value={majorForm.university_id} onChange={(e) => setMajorForm({...majorForm, university_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                        <option value="">Select University</option>
                        {universities.map((uni) => (
                          <option key={uni.id} value={uni.id}>{uni.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input type="text" value={majorForm.name} onChange={(e) => setMajorForm({...majorForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Level *</label>
                      <select value={majorForm.degree_level} onChange={(e) => setMajorForm({...majorForm, degree_level: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="Language">Language</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="PhD">PhD</option>
                        <option value="Short Program">Short Program</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Language *</label>
                      <select value={majorForm.teaching_language} onChange={(e) => setMajorForm({...majorForm, teaching_language: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="Chinese">Chinese</option>
                        <option value="English">English</option>
                        <option value="Bilingual">Bilingual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
                      <input type="number" step="0.5" value={majorForm.duration_years} onChange={(e) => setMajorForm({...majorForm, duration_years: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                      <input type="text" value={majorForm.discipline} onChange={(e) => setMajorForm({...majorForm, discipline: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={majorForm.description} onChange={(e) => setMajorForm({...majorForm, description: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={majorForm.is_featured} onChange={(e) => setMajorForm({...majorForm, is_featured: e.target.checked})} />
                        <span className="text-sm font-medium text-gray-700">Featured Major</span>
                      </label>
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button onClick={editingMajor ? handleUpdateMajor : handleCreateMajor} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingMajor ? 'Update' : 'Create'}
                      </button>
                      <button onClick={() => { setShowMajorForm(false); setEditingMajor(null); resetMajorForm() }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">University</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Degree Level</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Language</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {majors.map((major) => (
                      <tr key={major.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{major.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{universities.find(u => u.id === major.university_id)?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{major.degree_level}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{major.teaching_language}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => startEditMajor(major)} className="text-blue-600 hover:text-blue-800">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMajor(major.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'intakes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Program Intakes</h2>
              </div>
              {loadingStates.intakes ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        resetIntakeForm()
                        setEditingIntake(null)
                        setShowIntakeForm(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Program Intake
                    </button>
                  </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by University</label>
                  <select value={selectedUniversity || ''} onChange={(e) => {
                    setSelectedUniversity(e.target.value ? parseInt(e.target.value) : null)
                    setSelectedMajor(null)
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Universities</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>{uni.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Major</label>
                  <select value={selectedMajor || ''} onChange={(e) => setSelectedMajor(e.target.value ? parseInt(e.target.value) : null)} className="w-full border border-gray-300 rounded-lg px-3 py-2" disabled={!selectedUniversity}>
                    <option value="">All Majors</option>
                    {majors.filter(m => !selectedUniversity || m.university_id === selectedUniversity).map((major) => (
                      <option key={major.id} value={major.id}>{major.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {showIntakeForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{editingIntake ? 'Edit' : 'Add'} Program Intake</h3>
                    <button onClick={() => { setShowIntakeForm(false); setEditingIntake(null); resetIntakeForm() }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                      <select value={intakeForm.university_id} onChange={(e) => {
                        setIntakeForm({...intakeForm, university_id: e.target.value, major_id: ''})
                        setSelectedUniversity(parseInt(e.target.value))
                      }} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                        <option value="">Select University</option>
                        {universities.map((uni) => (
                          <option key={uni.id} value={uni.id}>{uni.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Major *</label>
                      <select value={intakeForm.major_id} onChange={(e) => setIntakeForm({...intakeForm, major_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required disabled={!intakeForm.university_id}>
                        <option value="">Select Major</option>
                        {majors.filter(m => m.university_id === parseInt(intakeForm.university_id)).map((major) => (
                          <option key={major.id} value={major.id}>{major.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intake Term *</label>
                      <select value={intakeForm.intake_term} onChange={(e) => setIntakeForm({...intakeForm, intake_term: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="March">March</option>
                        <option value="September">September</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intake Year *</label>
                      <input type="number" value={intakeForm.intake_year} onChange={(e) => setIntakeForm({...intakeForm, intake_year: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                      <input type="datetime-local" value={intakeForm.application_deadline} onChange={(e) => setIntakeForm({...intakeForm, application_deadline: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tuition per Semester (RMB)</label>
                      <input type="number" step="0.01" value={intakeForm.tuition_per_semester} onChange={(e) => setIntakeForm({...intakeForm, tuition_per_semester: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tuition per Year (RMB)</label>
                      <input type="number" step="0.01" value={intakeForm.tuition_per_year} onChange={(e) => setIntakeForm({...intakeForm, tuition_per_year: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Application Fee (RMB) - Non-refundable</label>
                      <input type="number" step="0.01" value={intakeForm.application_fee} onChange={(e) => setIntakeForm({...intakeForm, application_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Fee (RMB per year)</label>
                      <input type="number" step="0.01" value={intakeForm.accommodation_fee} onChange={(e) => setIntakeForm({...intakeForm, accommodation_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 3000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (RMB) - Only for successful application</label>
                      <input type="number" step="0.01" value={intakeForm.service_fee} onChange={(e) => setIntakeForm({...intakeForm, service_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 2000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical Insurance Fee (RMB)</label>
                      <input type="number" step="0.01" value={intakeForm.medical_insurance_fee} onChange={(e) => setIntakeForm({...intakeForm, medical_insurance_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 1000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Language *</label>
                      <select value={intakeForm.teaching_language} onChange={(e) => setIntakeForm({...intakeForm, teaching_language: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="English">English</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Bilingual">Bilingual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration of Course (Years)</label>
                      <input type="number" step="0.5" value={intakeForm.duration_years} onChange={(e) => setIntakeForm({...intakeForm, duration_years: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Type</label>
                      <select value={intakeForm.degree_type} onChange={(e) => setIntakeForm({...intakeForm, degree_type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="">Select Degree Type</option>
                        <option value="Non-degree">Non-degree</option>
                        <option value="Associate Bachelor">Associate Bachelor</option>
                        <option value="Masters">Masters</option>
                        <option value="Doctoral (phd)">Doctoral (phd)</option>
                        <option value="Study Tour Program">Study Tour Program</option>
                        <option value="Upgrade from Junior College Student to University Student">Upgrade from Junior College Student to University Student</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Medical Checkup Fee (RMB) - One-time</label>
                      <input type="number" step="0.01" value={intakeForm.arrival_medical_checkup_fee} onChange={(e) => setIntakeForm({...intakeForm, arrival_medical_checkup_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visa Extension Fee (RMB) - Required each year</label>
                      <input type="number" step="0.01" value={intakeForm.visa_extension_fee} onChange={(e) => setIntakeForm({...intakeForm, visa_extension_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 400" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admission Process</label>
                      <textarea value={intakeForm.admission_process} onChange={(e) => setIntakeForm({...intakeForm, admission_process: e.target.value})} rows={2} placeholder="Describe the admission process" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Note</label>
                      <textarea value={intakeForm.accommodation_note} onChange={(e) => setIntakeForm({...intakeForm, accommodation_note: e.target.value})} rows={2} placeholder="Notes about accommodation options" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Requirments (comma-separated) *</label>
                      <textarea value={intakeForm.documents_required} onChange={(e) => setIntakeForm({...intakeForm, documents_required: e.target.value})} rows={2} placeholder="e.g., passport, photo, diploma, transcript, bank statement" className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea value={intakeForm.notes} onChange={(e) => setIntakeForm({...intakeForm, notes: e.target.value})} rows={2} placeholder="e.g., Age 18-30, Online interview required" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Information</label>
                      <textarea value={intakeForm.scholarship_info} onChange={(e) => setIntakeForm({...intakeForm, scholarship_info: e.target.value})} rows={2} placeholder="Available scholarships for this program/intake" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button onClick={editingIntake ? handleUpdateIntake : handleCreateIntake} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingIntake ? 'Update' : 'Create'}
                      </button>
                      <button onClick={() => { setShowIntakeForm(false); setEditingIntake(null); resetIntakeForm() }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Search and Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={intakeSearchTerm}
                      onChange={(e) => {
                        setIntakeSearchTerm(e.target.value)
                        setIntakeCurrentPage(1) // Reset to first page on search
                      }}
                      placeholder="Search by university, major, intake term..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedUniversity || ''}
                      onChange={(e) => {
                        setSelectedUniversity(e.target.value ? parseInt(e.target.value) : null)
                        setIntakeCurrentPage(1)
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">All Universities</option>
                      {universities.map(uni => (
                        <option key={uni.id} value={uni.id}>{uni.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedMajor || ''}
                      onChange={(e) => {
                        setSelectedMajor(e.target.value ? parseInt(e.target.value) : null)
                        setIntakeCurrentPage(1)
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      disabled={!selectedUniversity}
                    >
                      <option value="">All Majors</option>
                      {majors.filter(m => !selectedUniversity || m.university_id === selectedUniversity).map(major => (
                        <option key={major.id} value={major.id}>{major.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Program Intakes Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">University</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Major</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Intake</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Deadline</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tuition/Year</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">App Fee</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      // Filter intakes based on search and selected filters
                      let filteredIntakes = programIntakes
                      
                      if (intakeSearchTerm) {
                        const searchLower = intakeSearchTerm.toLowerCase()
                        filteredIntakes = filteredIntakes.filter(intake => {
                          // Use university_name and major_name from response, fallback to lookup
                          const uniName = intake.university_name || universities.find(u => u.id === intake.university_id)?.name || ''
                          const majorName = intake.major_name || majors.find(m => m.id === intake.major_id)?.name || ''
                          return (
                            uniName.toLowerCase().includes(searchLower) ||
                            majorName.toLowerCase().includes(searchLower) ||
                            (intake.intake_term || '').toLowerCase().includes(searchLower) ||
                            String(intake.intake_year || '').includes(searchLower)
                          )
                        })
                      }
                      
                      if (selectedUniversity) {
                        filteredIntakes = filteredIntakes.filter(intake => intake.university_id === selectedUniversity)
                      }
                      
                      if (selectedMajor) {
                        filteredIntakes = filteredIntakes.filter(intake => intake.major_id === selectedMajor)
                      }
                      
                      // Pagination
                      const totalPages = Math.ceil(filteredIntakes.length / intakePageSize)
                      const startIndex = (intakeCurrentPage - 1) * intakePageSize
                      const endIndex = startIndex + intakePageSize
                      const paginatedIntakes = filteredIntakes.slice(startIndex, endIndex)
                      
                      return (
                        <>
                          {paginatedIntakes.map((intake) => {
                            // Use university_name and major_name from response, fallback to lookup if not available
                            const uni = intake.university_name || universities.find(u => u.id === intake.university_id)?.name
                            const major = intake.major_name || majors.find(m => m.id === intake.major_id)?.name
                            const deadline = intake.application_deadline ? new Date(intake.application_deadline) : null
                            return (
                              <tr key={intake.id}>
                                <td className="px-4 py-3 text-sm text-gray-900">{uni || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{major || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{intake.intake_term} {intake.intake_year}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{deadline ? deadline.toLocaleDateString() : 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{intake.tuition_per_year ? `${intake.tuition_per_year} RMB` : 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{intake.application_fee ? `${intake.application_fee} RMB` : '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex gap-2">
                                    <button onClick={() => startEditIntake(intake)} className="text-blue-600 hover:text-blue-800">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteIntake(intake.id)} className="text-red-600 hover:text-red-800">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          {paginatedIntakes.length === 0 && (
                            <tr>
                              <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                No program intakes found
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })()}
                  </tbody>
                </table>
                
                {/* Pagination Controls */}
                {(() => {
                  let filteredIntakes = programIntakes
                  
                  if (intakeSearchTerm) {
                    const searchLower = intakeSearchTerm.toLowerCase()
                    filteredIntakes = filteredIntakes.filter(intake => {
                      // Use university_name and major_name from response, fallback to lookup
                      const uniName = intake.university_name || universities.find(u => u.id === intake.university_id)?.name || ''
                      const majorName = intake.major_name || majors.find(m => m.id === intake.major_id)?.name || ''
                      return (
                        uniName.toLowerCase().includes(searchLower) ||
                        majorName.toLowerCase().includes(searchLower) ||
                        (intake.intake_term || '').toLowerCase().includes(searchLower) ||
                        String(intake.intake_year || '').includes(searchLower)
                      )
                    })
                  }
                  
                  if (selectedUniversity) {
                    filteredIntakes = filteredIntakes.filter(intake => intake.university_id === selectedUniversity)
                  }
                  
                  if (selectedMajor) {
                    filteredIntakes = filteredIntakes.filter(intake => intake.major_id === selectedMajor)
                  }
                  
                  const totalPages = Math.ceil(filteredIntakes.length / intakePageSize)
                  
                  if (totalPages <= 1) return null
                  
                  return (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {(intakeCurrentPage - 1) * intakePageSize + 1} to {Math.min(intakeCurrentPage * intakePageSize, filteredIntakes.length)} of {filteredIntakes.length} results
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIntakeCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={intakeCurrentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {intakeCurrentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setIntakeCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={intakeCurrentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'automation' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Application Automation</h2>
                <button
                  onClick={() => {
                    setAutomationForm({
                      student_id: '',
                      apply_url: '',
                      username: '',
                      password: '',
                      portal_type: ''
                    })
                    setShowAutomationModal(true)
                    setAutomationResult(null)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  New Automation
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600 mb-4">
                  Automatically fill university application forms with student data. The automation will:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                  <li>Load student data from database</li>
                  <li>Download and prepare student documents</li>
                  <li>Open browser and navigate to application URL</li>
                  <li>Fill form fields automatically</li>
                  <li>Upload required documents</li>
                  <li>Take screenshot for review</li>
                  <li><strong>Require manual submission</strong> (for safety)</li>
                </ul>
                
                {automationResult && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    automationResult.status === 'ok' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className="font-semibold mb-2">
                      {automationResult.status === 'ok' ? '✓ Automation Completed' : '✗ Automation Failed'}
                    </h3>
                    {automationResult.log && (
                      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-60 mb-2">
                        <pre>{automationResult.log}</pre>
                      </div>
                    )}
                    {automationResult.screenshot_url && (
                      <div className="mt-2">
                        <a
                          href={automationResult.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Screenshot →
                        </a>
                      </div>
                    )}
                    {automationResult.filled_fields && (
                      <div className="mt-2 text-sm">
                        <strong>Filled Fields:</strong> {Object.keys(automationResult.filled_fields).length}
                      </div>
                    )}
                    {automationResult.uploaded_files && (
                      <div className="mt-2 text-sm">
                        <strong>Uploaded Files:</strong> {Object.keys(automationResult.uploaded_files).filter(k => automationResult.uploaded_files[k] === 'ok').length}
                      </div>
                    )}
                    {automationResult.error && (
                      <div className="mt-2 text-red-600 text-sm">
                        <strong>Error:</strong> {automationResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Model Tuning Settings</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature: {modelSettings.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={modelSettings.temperature}
                      onChange={(e) => setModelSettings({ ...modelSettings, temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Controls randomness. Lower values make output more deterministic.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Top K: {modelSettings.top_k}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={modelSettings.top_k}
                      onChange={(e) => setModelSettings({ ...modelSettings, top_k: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of top tokens to consider for sampling.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Top P: {modelSettings.top_p}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={modelSettings.top_p}
                      onChange={(e) => setModelSettings({ ...modelSettings, top_p: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nucleus sampling. Controls diversity via cumulative probability.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Automation Modal */}
      {showAutomationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Run Application Automation</h3>
              <button
                onClick={() => {
                  setShowAutomationModal(false)
                  setAutomationResult(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID *
                </label>
                <input
                  type="number"
                  value={automationForm.student_id}
                  onChange={(e) => setAutomationForm({ ...automationForm, student_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter student ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application URL *
                </label>
                <input
                  type="url"
                  value={automationForm.apply_url}
                  onChange={(e) => setAutomationForm({ ...automationForm, apply_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://university.edu/apply"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username (Optional)
                </label>
                <input
                  type="text"
                  value={automationForm.username}
                  onChange={(e) => setAutomationForm({ ...automationForm, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Portal username/email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={automationForm.password}
                  onChange={(e) => setAutomationForm({ ...automationForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Portal password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portal Type (Optional)
                </label>
                <select
                  value={automationForm.portal_type}
                  onChange={(e) => setAutomationForm({ ...automationForm, portal_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Auto-detect</option>
                  <option value="hit">HIT (Harbin Institute of Technology)</option>
                  <option value="beihang">Beihang University</option>
                  <option value="bnuz">BNUZ (Beijing Normal University Zhuhai)</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRunAutomation}
                  disabled={automationRunning || !automationForm.student_id || !automationForm.apply_url}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {automationRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Automation
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAutomationModal(false)
                    setAutomationResult(null)
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
  )
}

