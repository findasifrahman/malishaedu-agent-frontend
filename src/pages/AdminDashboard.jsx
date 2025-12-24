import React, { useState, useEffect } from 'react'
import { BarChart3, Users, FileText, MessageSquare, Settings, Upload, MessageCircle, Bot, User as UserIcon, Building2, GraduationCap, Calendar, Plus, Edit, Trash2, X, Play, Loader2, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import ReactMarkdown from 'react-markdown'
import MajorsTable from '../components/admin/MajorsTable'
import ProgramDocumentsTable from '../components/admin/ProgramDocumentsTable'

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
    automation: false,
    documentImport: false
  })
  
  // Students pagination state
  const [students, setStudents] = useState([])
  const [studentsPage, setStudentsPage] = useState(1)
  const [studentsPageSize] = useState(20)
  const [studentsTotal, setStudentsTotal] = useState(0)
  const [studentsSearch, setStudentsSearch] = useState('')
  const [studentsSearchDebounced, setStudentsSearchDebounced] = useState('')
  const [expandedStudents, setExpandedStudents] = useState(new Set())
  const [studentApplications, setStudentApplications] = useState({})
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [studentForm, setStudentForm] = useState({
    email: '', password: '', full_name: '', phone: '', country_of_citizenship: '', passport_number: ''
  })
  
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
  const [selectedIntakeTerm, setSelectedIntakeTerm] = useState(null)
  const [selectedIntakeYear, setSelectedIntakeYear] = useState(null)
  const [selectedTeachingLanguage, setSelectedTeachingLanguage] = useState(null)
  
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
  
  // Document Import state
  const [documentImportFile, setDocumentImportFile] = useState(null)
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [manualSQL, setManualSQL] = useState('')
  const [sqlValidation, setSqlValidation] = useState(null)
  const [documentTextPreview, setDocumentTextPreview] = useState('')
  const [executingSQL, setExecutingSQL] = useState(false)
  const [sqlExecutionResult, setSqlExecutionResult] = useState(null)
  const [sqlGenerationProgress, setSqlGenerationProgress] = useState('')
  
  // Form states
  const [showUniversityForm, setShowUniversityForm] = useState(false)
  const [showMajorForm, setShowMajorForm] = useState(false)
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [intakeFormSections, setIntakeFormSections] = useState({
    basic: true,
    degree: true,
    fees: true,
    requirements: true,
    language: true,
    bankStatement: true,
    insideChina: true,
    scholarship: true,
    documents: true,
    examRequirements: true,
    intakeScholarships: true,
    notes: true
  })
  const [programDocuments, setProgramDocuments] = useState([])  // Documents for current intake
  const [allProgramDocuments, setAllProgramDocuments] = useState([])  // All documents for standalone view
  const [selectedIntakeForDocuments, setSelectedIntakeForDocuments] = useState(null)
  const [documentForm, setDocumentForm] = useState({
    name: '', is_required: true, rules: '', applies_to: ''
  })
  const [editingDocument, setEditingDocument] = useState(null)
  
  // Scholarships state
  const [scholarships, setScholarships] = useState([])
  const [programIntakeScholarships, setProgramIntakeScholarships] = useState([])  // Scholarships for current intake
  const [showScholarshipForm, setShowScholarshipForm] = useState(false)
  const [scholarshipForm, setScholarshipForm] = useState({
    name: '', provider: '', notes: ''
  })
  const [editingScholarship, setEditingScholarship] = useState(null)
  const [programIntakeScholarshipForm, setProgramIntakeScholarshipForm] = useState({
    scholarship_id: '', covers_tuition: false, covers_accommodation: false, covers_insurance: false,
    tuition_waiver_percent: '', living_allowance_monthly: '', living_allowance_yearly: '',
    first_year_only: false, renewal_required: false, deadline: '', eligibility_note: ''
  })
  const [editingProgramIntakeScholarship, setEditingProgramIntakeScholarship] = useState(null)
  
  // Partners state
  const [partners, setPartners] = useState([])
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)
  const [partnerForm, setPartnerForm] = useState({
    name: '', company_name: '', phone1: '', phone2: '', email: '', city: '', country: '', 
    full_address: '', website: '', notes: '', password: ''
  })
  
  // Program Exam Requirements state
  const [programExamRequirements, setProgramExamRequirements] = useState([])  // Exam requirements for current intake
  const [examRequirementForm, setExamRequirementForm] = useState({
    exam_name: '', required: true, subjects: '', min_level: '', min_score: '', exam_language: '', notes: ''
  })
  const [editingExamRequirement, setEditingExamRequirement] = useState(null)
  
  const [editingUniversity, setEditingUniversity] = useState(null)
  const [editingMajor, setEditingMajor] = useState(null)
  const [editingIntake, setEditingIntake] = useState(null)
  
  // Form data
  const [universityForm, setUniversityForm] = useState({
    name: '', name_cn: '', city: '', province: '', country: 'China', is_partner: true,
    university_ranking: '', world_ranking_band: '', national_ranking: '', 
    aliases: '', project_tags: '', default_currency: 'CNY', is_active: true,
    logo_url: '', description: '', website: '', contact_email: '', contact_wechat: ''
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
    notes: '', scholarship_info: '',
    // ========== NEW FIELDS ==========
    program_start_date: '', deadline_type: '', scholarship_available: '',
    age_min: '', age_max: '', min_average_score: '',
    interview_required: false, written_test_required: false, acceptance_letter_required: false,
    inside_china_applicants_allowed: false, inside_china_extra_requirements: '',
    bank_statement_required: false, bank_statement_amount: '', bank_statement_currency: 'USD', bank_statement_note: '',
    hsk_required: false, hsk_level: '', hsk_min_score: '',
    english_test_required: false, english_test_note: '',
    currency: 'CNY', accommodation_fee_period: '', medical_insurance_fee_period: '', arrival_medical_checkup_is_one_time: true
  })
  
  // Pagination and search for program intakes
  const [intakeSearchTerm, setIntakeSearchTerm] = useState('')
  const [intakeSearchDebounced, setIntakeSearchDebounced] = useState('')
  const [intakeCurrentPage, setIntakeCurrentPage] = useState(1)
  const [intakePageSize] = useState(20)
  const [intakeTotal, setIntakeTotal] = useState(0)
  const [intakeTotalPages, setIntakeTotalPages] = useState(0)
  
  // Debounce search for intakes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntakeSearchDebounced(intakeSearchTerm)
      setIntakeCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [intakeSearchTerm])
  
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
      loadUniversities() // Load universities for dropdown
      // Majors are loaded by MajorsTable component
    } else if (activeTab === 'intakes') {
      loadUniversities() // Load universities for dropdown
      // Load a limited set of majors for the dropdown (not all)
      loadMajorsForDropdown()
      // loadProgramIntakes is called via useEffect when filters change
    } else if (activeTab === 'program-documents') {
      loadUniversities() // Load universities for filter
      loadMajorsForDropdown() // Load majors for filter
      loadProgramIntakes() // Load program intakes for filter
    } else if (activeTab === 'scholarships') {
      loadScholarships()
    } else if (activeTab === 'partners') {
      loadPartners()
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
  
  // Removed - now handled by the main useEffect for intakes
  
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
  
  const loadStudents = async (page = studentsPage, search = studentsSearchDebounced) => {
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
  
  const loadStudentApplications = async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}/applications`)
      setStudentApplications(prev => ({ ...prev, [studentId]: response.data || [] }))
    } catch (error) {
      console.error('Error loading student applications:', error)
      setStudentApplications(prev => ({ ...prev, [studentId]: [] }))
    }
  }
  
  const toggleStudentExpansion = (studentId) => {
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId)
    } else {
      newExpanded.add(studentId)
      // Load applications if not already loaded
      if (!studentApplications[studentId]) {
        loadStudentApplications(studentId)
      }
    }
    setExpandedStudents(newExpanded)
  }
  
  const handleCreateStudent = async () => {
    try {
      const response = await api.post('/admin/students', studentForm)
      alert(`Student created successfully! Password: ${response.data.password || 'N/A'}\n\nPlease share this password with the student.`)
      setShowStudentModal(false)
      resetStudentForm()
      loadStudents()
    } catch (error) {
      console.error('Error creating student:', error)
      alert(error.response?.data?.detail || 'Failed to create student')
    }
  }
  
  const handleUpdateStudent = async () => {
    try {
      await api.put(`/admin/students/${editingStudent.id}`, studentForm)
      alert('Student updated successfully!')
      setShowStudentModal(false)
      setEditingStudent(null)
      resetStudentForm()
      loadStudents()
    } catch (error) {
      console.error('Error updating student:', error)
      alert(error.response?.data?.detail || 'Failed to update student')
    }
  }
  
  const resetStudentForm = () => {
    setStudentForm({
      email: '', password: '', full_name: '', phone: '', country_of_citizenship: '', passport_number: ''
    })
  }
  
  const startEditStudent = (student) => {
    setEditingStudent(student)
    setStudentForm({
      email: student.email || '',
      password: '', // Don't show password
      full_name: student.full_name || '',
      phone: student.phone || '',
      country_of_citizenship: student.country_of_citizenship || '',
      passport_number: student.passport_number || ''
    })
    setShowStudentModal(true)
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
      const response = await api.get('/universities')
      setUniversities(response.data)
    } catch (error) {
      console.error('Error loading universities:', error)
    } finally {
      setLoading('universities', false)
    }
  }
  
  const handleCreateUniversity = async () => {
    try {
      // Convert aliases and project_tags from comma-separated strings to arrays
      const aliasesArray = universityForm.aliases 
        ? universityForm.aliases.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : null
      const projectTagsArray = universityForm.project_tags 
        ? universityForm.project_tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : null
      
      // Convert empty strings to null for optional fields
      const formData = {
        ...universityForm,
        university_ranking: universityForm.university_ranking === '' || universityForm.university_ranking === null ? null : parseInt(universityForm.university_ranking),
        national_ranking: universityForm.national_ranking === '' || universityForm.national_ranking === null ? null : parseInt(universityForm.national_ranking),
        aliases: aliasesArray,
        project_tags: projectTagsArray,
        name_cn: universityForm.name_cn?.trim() || null,
        world_ranking_band: universityForm.world_ranking_band?.trim() || null,
        default_currency: universityForm.default_currency?.trim() || 'CNY',
        logo_url: universityForm.logo_url?.trim() || null,
        website: universityForm.website?.trim() || null,
        description: universityForm.description?.trim() || null,
        contact_email: universityForm.contact_email?.trim() || null,
        contact_wechat: universityForm.contact_wechat?.trim() || null,
        city: universityForm.city?.trim() || null,
        province: universityForm.province?.trim() || null,
      }
      await api.post('/universities', formData)
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
      // Convert aliases and project_tags from comma-separated strings to arrays
      const aliasesArray = universityForm.aliases 
        ? universityForm.aliases.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : null
      const projectTagsArray = universityForm.project_tags 
        ? universityForm.project_tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : null
      
      // Convert empty strings to null for optional fields
      const formData = {
        ...universityForm,
        university_ranking: universityForm.university_ranking === '' || universityForm.university_ranking === null ? null : parseInt(universityForm.university_ranking),
        national_ranking: universityForm.national_ranking === '' || universityForm.national_ranking === null ? null : parseInt(universityForm.national_ranking),
        aliases: aliasesArray,
        project_tags: projectTagsArray,
        name_cn: universityForm.name_cn?.trim() || null,
        world_ranking_band: universityForm.world_ranking_band?.trim() || null,
        default_currency: universityForm.default_currency?.trim() || 'CNY',
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
      name: '', name_cn: '', city: '', province: '', country: 'China', is_partner: true,
      university_ranking: '', world_ranking_band: '', national_ranking: '', 
      aliases: '', project_tags: '', default_currency: 'CNY', is_active: true,
      logo_url: '', description: '', website: '', contact_email: '', contact_wechat: ''
    })
  }
  
  const startEditUniversity = (university) => {
    setEditingUniversity(university)
    // Convert arrays to comma-separated strings for display
    const aliasesStr = Array.isArray(university.aliases) 
      ? university.aliases.join(', ') 
      : (university.aliases || '')
    const projectTagsStr = Array.isArray(university.project_tags) 
      ? university.project_tags.join(', ') 
      : (university.project_tags || '')
    
    setUniversityForm({
      name: university.name || '',
      name_cn: university.name_cn || '',
      city: university.city || '',
      province: university.province || '',
      country: university.country || 'China',
      is_partner: university.is_partner !== undefined ? university.is_partner : true,
      university_ranking: university.university_ranking || '',
      world_ranking_band: university.world_ranking_band || '',
      national_ranking: university.national_ranking || '',
      aliases: aliasesStr,
      project_tags: projectTagsStr,
      default_currency: university.default_currency || 'CNY',
      is_active: university.is_active !== undefined ? university.is_active : true,
      logo_url: university.logo_url || '',
      description: university.description || '',
      website: university.website || '',
      contact_email: university.contact_email || '',
      contact_wechat: university.contact_wechat || ''
    })
    setShowUniversityForm(true)
  }
  
  // Majors CRUD - for dropdowns (limited results)
  const loadMajorsForDropdown = async (universityId = null) => {
    try {
      let url = `/majors?page=1&page_size=1000` // Get up to 1000 for dropdown
      if (universityId) url += `&university_id=${universityId}`
      const response = await api.get(url)
      // Handle both paginated and non-paginated responses
      if (response.data.items) {
        setMajors(response.data.items)
      } else if (Array.isArray(response.data)) {
        setMajors(response.data)
      } else {
        setMajors([])
      }
    } catch (error) {
      console.error('Error loading majors for dropdown:', error)
      setMajors([])
    }
  }
  
  // Legacy function for backward compatibility
  const loadMajors = loadMajorsForDropdown
  
  const handleCreateMajor = async () => {
    try {
      const data = {
        ...majorForm,
        university_id: parseInt(majorForm.university_id),
        duration_years: majorForm.duration_years ? parseFloat(majorForm.duration_years) : null
      }
      await api.post('/majors', data)
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
  
  // Program Intakes CRUD - with server-side pagination
  const loadProgramIntakes = async () => {
    setLoading('intakes', true)
    try {
      let url = `/program-intakes?upcoming_only=false&page=${intakeCurrentPage}&page_size=${intakePageSize}`
      if (selectedUniversity) url += `&university_id=${selectedUniversity}`
      if (selectedIntakeTerm) url += `&intake_term=${selectedIntakeTerm}`
      if (selectedIntakeYear) url += `&intake_year=${selectedIntakeYear}`
      if (selectedTeachingLanguage) url += `&teaching_language=${encodeURIComponent(selectedTeachingLanguage)}`
      if (intakeSearchDebounced) url += `&search=${encodeURIComponent(intakeSearchDebounced)}`
      
      const response = await api.get(url)
      if (response.data.items) {
        // New paginated API format
        setProgramIntakes(response.data.items)
        setIntakeTotal(response.data.total)
        setIntakeTotalPages(response.data.total_pages)
      } else if (Array.isArray(response.data)) {
        // Fallback for old API format
        setProgramIntakes(response.data)
        setIntakeTotal(response.data.length)
        setIntakeTotalPages(1)
      } else {
        console.error('Unexpected response format:', response.data)
        setProgramIntakes([])
        setIntakeTotal(0)
        setIntakeTotalPages(0)
      }
    } catch (error) {
      console.error('Error loading program intakes:', error)
      setProgramIntakes([])
      setIntakeTotal(0)
      setIntakeTotalPages(0)
    } finally {
      setLoading('intakes', false)
    }
  }
  
  // Reload intakes when filters or pagination changes
  useEffect(() => {
    if (activeTab === 'intakes') {
      loadProgramIntakes()
    }
  }, [selectedUniversity, selectedIntakeTerm, selectedIntakeYear, selectedTeachingLanguage, intakeSearchDebounced, intakeCurrentPage, activeTab])
  
  const handleCreateIntake = async () => {
    try {
      const data = {
        ...intakeForm,
        university_id: parseInt(intakeForm.university_id),
        major_id: parseInt(intakeForm.major_id),
        intake_year: parseInt(intakeForm.intake_year),
        application_deadline: new Date(intakeForm.application_deadline).toISOString(),
        program_start_date: intakeForm.program_start_date ? new Date(intakeForm.program_start_date).toISOString().split('T')[0] : null,
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
        visa_extension_fee: intakeForm.visa_extension_fee ? parseFloat(intakeForm.visa_extension_fee) : null,
        // ========== NEW FIELDS ==========
        deadline_type: intakeForm.deadline_type || null,
        scholarship_available: intakeForm.scholarship_available === '' ? null : (intakeForm.scholarship_available === 'true' || intakeForm.scholarship_available === true),
        age_min: intakeForm.age_min ? parseInt(intakeForm.age_min) : null,
        age_max: intakeForm.age_max ? parseInt(intakeForm.age_max) : null,
        min_average_score: intakeForm.min_average_score ? parseFloat(intakeForm.min_average_score) : null,
        interview_required: intakeForm.interview_required || null,
        written_test_required: intakeForm.written_test_required || null,
        acceptance_letter_required: intakeForm.acceptance_letter_required || null,
        inside_china_applicants_allowed: intakeForm.inside_china_applicants_allowed || null,
        inside_china_extra_requirements: intakeForm.inside_china_extra_requirements || null,
        bank_statement_required: intakeForm.bank_statement_required || null,
        bank_statement_amount: intakeForm.bank_statement_amount ? parseFloat(intakeForm.bank_statement_amount) : null,
        bank_statement_currency: intakeForm.bank_statement_currency || null,
        bank_statement_note: intakeForm.bank_statement_note || null,
        hsk_required: intakeForm.hsk_required || null,
        hsk_level: intakeForm.hsk_level ? parseInt(intakeForm.hsk_level) : null,
        hsk_min_score: intakeForm.hsk_min_score ? parseInt(intakeForm.hsk_min_score) : null,
        english_test_required: intakeForm.english_test_required || null,
        english_test_note: intakeForm.english_test_note || null,
        currency: intakeForm.currency || 'CNY',
        accommodation_fee_period: intakeForm.accommodation_fee_period || null,
        medical_insurance_fee_period: intakeForm.medical_insurance_fee_period || null,
        arrival_medical_checkup_is_one_time: intakeForm.arrival_medical_checkup_is_one_time !== undefined ? intakeForm.arrival_medical_checkup_is_one_time : true
      }
      const response = await api.post('/program-intakes', data)
      alert('Program intake created successfully!')
      const newIntakeId = response.data.id
      // If documents section was open, keep form open and allow document management
      if (intakeFormSections.documents && newIntakeId) {
        // Update editingIntake to allow document management
        setEditingIntake({ ...response.data, id: newIntakeId })
        // Load documents for the newly created intake
        loadProgramDocuments(newIntakeId)
      } else {
        setShowIntakeForm(false)
        setEditingIntake(null)
        resetIntakeForm()
        setProgramDocuments([])
        setDocumentForm({ name: '', is_required: true, rules: '', applies_to: '' })
        setEditingDocument(null)
        loadProgramIntakes()
      }
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
        program_start_date: intakeForm.program_start_date ? new Date(intakeForm.program_start_date).toISOString().split('T')[0] : null,
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
        visa_extension_fee: intakeForm.visa_extension_fee ? parseFloat(intakeForm.visa_extension_fee) : null,
        // ========== NEW FIELDS ==========
        deadline_type: intakeForm.deadline_type || null,
        scholarship_available: intakeForm.scholarship_available === '' ? null : (intakeForm.scholarship_available === 'true' || intakeForm.scholarship_available === true),
        age_min: intakeForm.age_min ? parseInt(intakeForm.age_min) : null,
        age_max: intakeForm.age_max ? parseInt(intakeForm.age_max) : null,
        min_average_score: intakeForm.min_average_score ? parseFloat(intakeForm.min_average_score) : null,
        interview_required: intakeForm.interview_required || null,
        written_test_required: intakeForm.written_test_required || null,
        acceptance_letter_required: intakeForm.acceptance_letter_required || null,
        inside_china_applicants_allowed: intakeForm.inside_china_applicants_allowed || null,
        inside_china_extra_requirements: intakeForm.inside_china_extra_requirements || null,
        bank_statement_required: intakeForm.bank_statement_required || null,
        bank_statement_amount: intakeForm.bank_statement_amount ? parseFloat(intakeForm.bank_statement_amount) : null,
        bank_statement_currency: intakeForm.bank_statement_currency || null,
        bank_statement_note: intakeForm.bank_statement_note || null,
        hsk_required: intakeForm.hsk_required || null,
        hsk_level: intakeForm.hsk_level ? parseInt(intakeForm.hsk_level) : null,
        hsk_min_score: intakeForm.hsk_min_score ? parseInt(intakeForm.hsk_min_score) : null,
        english_test_required: intakeForm.english_test_required || null,
        english_test_note: intakeForm.english_test_note || null,
        currency: intakeForm.currency || 'CNY',
        accommodation_fee_period: intakeForm.accommodation_fee_period || null,
        medical_insurance_fee_period: intakeForm.medical_insurance_fee_period || null,
        arrival_medical_checkup_is_one_time: intakeForm.arrival_medical_checkup_is_one_time !== undefined ? intakeForm.arrival_medical_checkup_is_one_time : true
      }
      await api.put(`/program-intakes/${editingIntake.id}`, data)
      alert('Program intake updated successfully!')
      // Reload documents, scholarships, and exam requirements if sections are open
      if (intakeFormSections.documents) {
        loadProgramDocuments(editingIntake.id)
      }
      if (intakeFormSections.intakeScholarships) {
        loadProgramIntakeScholarships(editingIntake.id)
      }
      if (intakeFormSections.examRequirements) {
        loadProgramExamRequirements(editingIntake.id)
      }
      if (!intakeFormSections.documents && !intakeFormSections.intakeScholarships && !intakeFormSections.examRequirements) {
        setShowIntakeForm(false)
        setEditingIntake(null)
        resetIntakeForm()
        loadProgramIntakes()
      }
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
      loadProgramIntakes()
    } catch (error) {
      console.error('Error deleting program intake:', error)
      alert('Failed to delete program intake')
    }
  }
  
  const resetIntakeForm = () => {
    setIntakeForm({
      university_id: selectedUniversity || '', major_id: '',
      intake_term: 'September', intake_year: new Date().getFullYear(),
      application_deadline: '', documents_required: '', tuition_per_semester: '', tuition_per_year: '',
      application_fee: '', accommodation_fee: '', service_fee: '', medical_insurance_fee: '',
      teaching_language: 'English', duration_years: '', degree_type: '',
      arrival_medical_checkup_fee: '', admission_process: '', accommodation_note: '', visa_extension_fee: '',
      notes: '', scholarship_info: '',
      // ========== NEW FIELDS ==========
      program_start_date: '', deadline_type: '', scholarship_available: '',
      age_min: '', age_max: '', min_average_score: '',
      interview_required: false, written_test_required: false, acceptance_letter_required: false,
      inside_china_applicants_allowed: false, inside_china_extra_requirements: '',
      bank_statement_required: false, bank_statement_amount: '', bank_statement_currency: 'USD', bank_statement_note: '',
      hsk_required: false, hsk_level: '', hsk_min_score: '',
      english_test_required: false, english_test_note: '',
      currency: 'CNY', accommodation_fee_period: '', medical_insurance_fee_period: '', arrival_medical_checkup_is_one_time: true
    })
  }
  
  const startEditIntake = (intake) => {
    setEditingIntake(intake)
    const deadline = intake.application_deadline ? new Date(intake.application_deadline).toISOString().slice(0, 16) : ''
    const startDate = intake.program_start_date ? new Date(intake.program_start_date).toISOString().slice(0, 10) : ''
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
      scholarship_info: intake.scholarship_info || '',
      // ========== NEW FIELDS ==========
      program_start_date: startDate,
      deadline_type: intake.deadline_type || '',
      scholarship_available: intake.scholarship_available !== undefined ? intake.scholarship_available : '',
      age_min: intake.age_min || '',
      age_max: intake.age_max || '',
      min_average_score: intake.min_average_score || '',
      interview_required: intake.interview_required || false,
      written_test_required: intake.written_test_required || false,
      acceptance_letter_required: intake.acceptance_letter_required || false,
      inside_china_applicants_allowed: intake.inside_china_applicants_allowed || false,
      inside_china_extra_requirements: intake.inside_china_extra_requirements || '',
      bank_statement_required: intake.bank_statement_required || false,
      bank_statement_amount: intake.bank_statement_amount || '',
      bank_statement_currency: intake.bank_statement_currency || 'USD',
      bank_statement_note: intake.bank_statement_note || '',
      hsk_required: intake.hsk_required || false,
      hsk_level: intake.hsk_level || '',
      hsk_min_score: intake.hsk_min_score || '',
      english_test_required: intake.english_test_required || false,
      english_test_note: intake.english_test_note || '',
      currency: intake.currency || 'CNY',
      accommodation_fee_period: intake.accommodation_fee_period || '',
      medical_insurance_fee_period: intake.medical_insurance_fee_period || '',
      arrival_medical_checkup_is_one_time: intake.arrival_medical_checkup_is_one_time !== undefined ? intake.arrival_medical_checkup_is_one_time : true
    })
    setShowIntakeForm(true)
    // Load documents, scholarships, and exam requirements for this intake
    if (intake.id) {
      loadProgramDocuments(intake.id)
      loadProgramIntakeScholarships(intake.id)
      loadProgramExamRequirements(intake.id)
    }
  }
  
  const toggleIntakeSection = (section) => {
    setIntakeFormSections(prev => ({ ...prev, [section]: !prev[section] }))
  }
  
  // ========== Program Documents Management ==========
  const loadProgramDocuments = async (intakeId) => {
    if (!intakeId) {
      setProgramDocuments([])
      return
    }
    try {
      const response = await api.get(`/program-documents/program-intakes/${intakeId}/documents`)
      setProgramDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading program documents:', error)
      setProgramDocuments([])
    }
  }
  
  const handleCreateDocument = async (intakeId) => {
    if (!intakeId) {
      alert('Program intake must be saved first before adding documents')
      return
    }
    if (!documentForm.name.trim()) {
      alert('Document name is required')
      return
    }
    try {
      await api.post('/program-documents', {
        program_intake_id: intakeId,
        name: documentForm.name.trim(),
        is_required: documentForm.is_required,
        rules: documentForm.rules.trim() || null,
        applies_to: documentForm.applies_to.trim() || null
      })
      alert('Document added successfully!')
      setDocumentForm({ name: '', is_required: true, rules: '', applies_to: '' })
      loadProgramDocuments(intakeId)
    } catch (error) {
      console.error('Error creating document:', error)
      alert('Failed to add document')
    }
  }
  
  const handleUpdateDocument = async (documentId, intakeId) => {
    if (!documentForm.name.trim()) {
      alert('Document name is required')
      return
    }
    try {
      await api.put(`/program-documents/${documentId}`, {
        name: documentForm.name.trim(),
        is_required: documentForm.is_required,
        rules: documentForm.rules.trim() || null,
        applies_to: documentForm.applies_to.trim() || null
      })
      alert('Document updated successfully!')
      setEditingDocument(null)
      setDocumentForm({ name: '', is_required: true, rules: '', applies_to: '' })
      loadProgramDocuments(intakeId)
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Failed to update document')
    }
  }
  
  const handleDeleteDocument = async (documentId, intakeId) => {
    if (!confirm('Are you sure you want to delete this document requirement?')) {
      return
    }
    try {
      await api.delete(`/program-documents/${documentId}`)
      alert('Document deleted successfully!')
      loadProgramDocuments(intakeId)
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }
  
  const startEditDocument = (document) => {
    setEditingDocument(document)
    setDocumentForm({
      name: document.name || '',
      is_required: document.is_required !== undefined ? document.is_required : true,
      rules: document.rules || '',
      applies_to: document.applies_to || ''
    })
  }
  
  const cancelEditDocument = () => {
    setEditingDocument(null)
    setDocumentForm({ name: '', is_required: true, rules: '', applies_to: '' })
  }
  
  // ========== Scholarships Management ==========
  const loadScholarships = async () => {
    try {
      const response = await api.get('/scholarships')
      setScholarships(response.data || [])
    } catch (error) {
      console.error('Error loading scholarships:', error)
      setScholarships([])
    }
  }
  
  const handleCreateScholarship = async () => {
    if (!scholarshipForm.name.trim()) {
      alert('Scholarship name is required')
      return
    }
    try {
      await api.post('/scholarships', {
        name: scholarshipForm.name.trim(),
        provider: scholarshipForm.provider.trim() || null,
        notes: scholarshipForm.notes.trim() || null
      })
      alert('Scholarship created successfully!')
      setScholarshipForm({ name: '', provider: '', notes: '' })
      setShowScholarshipForm(false)
      loadScholarships()
    } catch (error) {
      console.error('Error creating scholarship:', error)
      alert('Failed to create scholarship')
    }
  }
  
  const handleUpdateScholarship = async () => {
    if (!scholarshipForm.name.trim()) {
      alert('Scholarship name is required')
      return
    }
    try {
      await api.put(`/scholarships/${editingScholarship.id}`, {
        name: scholarshipForm.name.trim(),
        provider: scholarshipForm.provider.trim() || null,
        notes: scholarshipForm.notes.trim() || null
      })
      alert('Scholarship updated successfully!')
      setEditingScholarship(null)
      setScholarshipForm({ name: '', provider: '', notes: '' })
      setShowScholarshipForm(false)
      loadScholarships()
    } catch (error) {
      console.error('Error updating scholarship:', error)
      alert('Failed to update scholarship')
    }
  }
  
  const handleDeleteScholarship = async (id) => {
    if (!confirm('Are you sure you want to delete this scholarship?')) {
      return
    }
    try {
      await api.delete(`/scholarships/${id}`)
      alert('Scholarship deleted successfully!')
      loadScholarships()
    } catch (error) {
      console.error('Error deleting scholarship:', error)
      alert('Failed to delete scholarship')
    }
  }
  
  const startEditScholarship = (scholarship) => {
    setEditingScholarship(scholarship)
    setScholarshipForm({
      name: scholarship.name || '',
      provider: scholarship.provider || '',
      notes: scholarship.notes || ''
    })
    setShowScholarshipForm(true)
  }
  
  const cancelEditScholarship = () => {
    setEditingScholarship(null)
    setScholarshipForm({ name: '', provider: '', notes: '' })
    setShowScholarshipForm(false)
  }
  
  // ========== Program Intake Scholarships Management ==========
  const loadProgramIntakeScholarships = async (intakeId) => {
    if (!intakeId) {
      setProgramIntakeScholarships([])
      return
    }
    try {
      const response = await api.get(`/scholarships/program-intakes/${intakeId}/scholarships`)
      setProgramIntakeScholarships(response.data || [])
    } catch (error) {
      console.error('Error loading program intake scholarships:', error)
      setProgramIntakeScholarships([])
    }
  }
  
  const handleCreateProgramIntakeScholarship = async (intakeId) => {
    if (!intakeId) {
      alert('Program intake must be saved first before adding scholarships')
      return
    }
    if (!programIntakeScholarshipForm.scholarship_id) {
      alert('Please select a scholarship')
      return
    }
    try {
      await api.post('/scholarships/program-intakes/scholarships', {
        program_intake_id: intakeId,
        scholarship_id: parseInt(programIntakeScholarshipForm.scholarship_id),
        covers_tuition: programIntakeScholarshipForm.covers_tuition || null,
        covers_accommodation: programIntakeScholarshipForm.covers_accommodation || null,
        covers_insurance: programIntakeScholarshipForm.covers_insurance || null,
        tuition_waiver_percent: programIntakeScholarshipForm.tuition_waiver_percent ? parseInt(programIntakeScholarshipForm.tuition_waiver_percent) : null,
        living_allowance_monthly: programIntakeScholarshipForm.living_allowance_monthly ? parseFloat(programIntakeScholarshipForm.living_allowance_monthly) : null,
        living_allowance_yearly: programIntakeScholarshipForm.living_allowance_yearly ? parseFloat(programIntakeScholarshipForm.living_allowance_yearly) : null,
        first_year_only: programIntakeScholarshipForm.first_year_only || null,
        renewal_required: programIntakeScholarshipForm.renewal_required || null,
        deadline: programIntakeScholarshipForm.deadline || null,
        eligibility_note: programIntakeScholarshipForm.eligibility_note.trim() || null
      })
      alert('Scholarship added to program intake successfully!')
      setProgramIntakeScholarshipForm({
        scholarship_id: '', covers_tuition: false, covers_accommodation: false, covers_insurance: false,
        tuition_waiver_percent: '', living_allowance_monthly: '', living_allowance_yearly: '',
        first_year_only: false, renewal_required: false, deadline: '', eligibility_note: ''
      })
      loadProgramIntakeScholarships(intakeId)
    } catch (error) {
      console.error('Error creating program intake scholarship:', error)
      alert('Failed to add scholarship')
    }
  }
  
  const handleUpdateProgramIntakeScholarship = async (pisId, intakeId) => {
    try {
      await api.put(`/scholarships/program-intakes/scholarships/${pisId}`, {
        covers_tuition: programIntakeScholarshipForm.covers_tuition || null,
        covers_accommodation: programIntakeScholarshipForm.covers_accommodation || null,
        covers_insurance: programIntakeScholarshipForm.covers_insurance || null,
        tuition_waiver_percent: programIntakeScholarshipForm.tuition_waiver_percent ? parseInt(programIntakeScholarshipForm.tuition_waiver_percent) : null,
        living_allowance_monthly: programIntakeScholarshipForm.living_allowance_monthly ? parseFloat(programIntakeScholarshipForm.living_allowance_monthly) : null,
        living_allowance_yearly: programIntakeScholarshipForm.living_allowance_yearly ? parseFloat(programIntakeScholarshipForm.living_allowance_yearly) : null,
        first_year_only: programIntakeScholarshipForm.first_year_only || null,
        renewal_required: programIntakeScholarshipForm.renewal_required || null,
        deadline: programIntakeScholarshipForm.deadline || null,
        eligibility_note: programIntakeScholarshipForm.eligibility_note.trim() || null
      })
      alert('Scholarship updated successfully!')
      setEditingProgramIntakeScholarship(null)
      setProgramIntakeScholarshipForm({
        scholarship_id: '', covers_tuition: false, covers_accommodation: false, covers_insurance: false,
        tuition_waiver_percent: '', living_allowance_monthly: '', living_allowance_yearly: '',
        first_year_only: false, renewal_required: false, deadline: '', eligibility_note: ''
      })
      loadProgramIntakeScholarships(intakeId)
    } catch (error) {
      console.error('Error updating program intake scholarship:', error)
      alert('Failed to update scholarship')
    }
  }
  
  const handleDeleteProgramIntakeScholarship = async (pisId, intakeId) => {
    if (!confirm('Are you sure you want to remove this scholarship from the program intake?')) {
      return
    }
    try {
      await api.delete(`/scholarships/program-intakes/scholarships/${pisId}`)
      alert('Scholarship removed successfully!')
      loadProgramIntakeScholarships(intakeId)
    } catch (error) {
      console.error('Error deleting program intake scholarship:', error)
      alert('Failed to remove scholarship')
    }
  }
  
  const startEditProgramIntakeScholarship = (pis) => {
    setEditingProgramIntakeScholarship(pis)
    setProgramIntakeScholarshipForm({
      scholarship_id: pis.scholarship_id.toString(),
      covers_tuition: pis.covers_tuition || false,
      covers_accommodation: pis.covers_accommodation || false,
      covers_insurance: pis.covers_insurance || false,
      tuition_waiver_percent: pis.tuition_waiver_percent?.toString() || '',
      living_allowance_monthly: pis.living_allowance_monthly?.toString() || '',
      living_allowance_yearly: pis.living_allowance_yearly?.toString() || '',
      first_year_only: pis.first_year_only || false,
      renewal_required: pis.renewal_required || false,
      deadline: pis.deadline ? pis.deadline.split('T')[0] : '',
      eligibility_note: pis.eligibility_note || ''
    })
  }
  
  const cancelEditProgramIntakeScholarship = () => {
    setEditingProgramIntakeScholarship(null)
    setProgramIntakeScholarshipForm({
      scholarship_id: '', covers_tuition: false, covers_accommodation: false, covers_insurance: false,
      tuition_waiver_percent: '', living_allowance_monthly: '', living_allowance_yearly: '',
      first_year_only: false, renewal_required: false, deadline: '', eligibility_note: ''
    })
  }
  
  // ========== Program Exam Requirements Management ==========
  const loadProgramExamRequirements = async (intakeId) => {
    if (!intakeId) {
      setProgramExamRequirements([])
      return
    }
    try {
      const response = await api.get(`/program-exam-requirements/program-intakes/${intakeId}/exam-requirements`)
      setProgramExamRequirements(response.data || [])
    } catch (error) {
      console.error('Error loading program exam requirements:', error)
      setProgramExamRequirements([])
    }
  }
  
  const handleCreateExamRequirement = async (intakeId) => {
    if (!intakeId) {
      alert('Program intake must be saved first before adding exam requirements')
      return
    }
    if (!examRequirementForm.exam_name.trim()) {
      alert('Exam name is required')
      return
    }
    try {
      await api.post('/program-exam-requirements', {
        program_intake_id: intakeId,
        exam_name: examRequirementForm.exam_name.trim(),
        required: examRequirementForm.required,
        subjects: examRequirementForm.subjects.trim() || null,
        min_level: examRequirementForm.min_level ? parseInt(examRequirementForm.min_level) : null,
        min_score: examRequirementForm.min_score ? parseInt(examRequirementForm.min_score) : null,
        exam_language: examRequirementForm.exam_language.trim() || null,
        notes: examRequirementForm.notes.trim() || null
      })
      alert('Exam requirement added successfully!')
      setExamRequirementForm({
        exam_name: '', required: true, subjects: '', min_level: '', min_score: '', exam_language: '', notes: ''
      })
      loadProgramExamRequirements(intakeId)
    } catch (error) {
      console.error('Error creating exam requirement:', error)
      alert('Failed to add exam requirement')
    }
  }
  
  const handleUpdateExamRequirement = async (examReqId, intakeId) => {
    if (!examRequirementForm.exam_name.trim()) {
      alert('Exam name is required')
      return
    }
    try {
      await api.put(`/program-exam-requirements/${examReqId}`, {
        exam_name: examRequirementForm.exam_name.trim(),
        required: examRequirementForm.required,
        subjects: examRequirementForm.subjects.trim() || null,
        min_level: examRequirementForm.min_level ? parseInt(examRequirementForm.min_level) : null,
        min_score: examRequirementForm.min_score ? parseInt(examRequirementForm.min_score) : null,
        exam_language: examRequirementForm.exam_language.trim() || null,
        notes: examRequirementForm.notes.trim() || null
      })
      alert('Exam requirement updated successfully!')
      setEditingExamRequirement(null)
      setExamRequirementForm({
        exam_name: '', required: true, subjects: '', min_level: '', min_score: '', exam_language: '', notes: ''
      })
      loadProgramExamRequirements(intakeId)
    } catch (error) {
      console.error('Error updating exam requirement:', error)
      alert('Failed to update exam requirement')
    }
  }
  
  const handleDeleteExamRequirement = async (examReqId, intakeId) => {
    if (!confirm('Are you sure you want to delete this exam requirement?')) {
      return
    }
    try {
      await api.delete(`/program-exam-requirements/${examReqId}`)
      alert('Exam requirement deleted successfully!')
      loadProgramExamRequirements(intakeId)
    } catch (error) {
      console.error('Error deleting exam requirement:', error)
      alert('Failed to delete exam requirement')
    }
  }
  
  const startEditExamRequirement = (examReq) => {
    setEditingExamRequirement(examReq)
    setExamRequirementForm({
      exam_name: examReq.exam_name || '',
      required: examReq.required !== undefined ? examReq.required : true,
      subjects: examReq.subjects || '',
      min_level: examReq.min_level?.toString() || '',
      min_score: examReq.min_score?.toString() || '',
      exam_language: examReq.exam_language || '',
      notes: examReq.notes || ''
    })
  }
  
  const cancelEditExamRequirement = () => {
    setEditingExamRequirement(null)
    setExamRequirementForm({
      exam_name: '', required: true, subjects: '', min_level: '', min_score: '', exam_language: '', notes: ''
    })
  }
  
  // ========== Partners Management ==========
  const loadPartners = async () => {
    try {
      const response = await api.get('/partners')
      setPartners(response.data || [])
    } catch (error) {
      console.error('Error loading partners:', error)
      setPartners([])
    }
  }
  
  const handleCreatePartner = async () => {
    if (!partnerForm.name.trim() || !partnerForm.email.trim()) {
      alert('Name and email are required')
      return
    }
    if (!partnerForm.password.trim()) {
      alert('Password is required')
      return
    }
    try {
      await api.post('/partners', {
        name: partnerForm.name.trim(),
        company_name: partnerForm.company_name.trim() || null,
        phone1: partnerForm.phone1.trim() || null,
        phone2: partnerForm.phone2.trim() || null,
        email: partnerForm.email.trim(),
        city: partnerForm.city.trim() || null,
        country: partnerForm.country.trim() || null,
        full_address: partnerForm.full_address.trim() || null,
        website: partnerForm.website.trim() || null,
        notes: partnerForm.notes.trim() || null,
        password: partnerForm.password
      })
      alert('Partner created successfully!')
      setShowPartnerForm(false)
      resetPartnerForm()
      loadPartners()
    } catch (error) {
      console.error('Error creating partner:', error)
      alert(error.response?.data?.detail || 'Failed to create partner')
    }
  }
  
  const handleUpdatePartner = async () => {
    if (!partnerForm.name.trim() || !partnerForm.email.trim()) {
      alert('Name and email are required')
      return
    }
    try {
      const updateData = {
        name: partnerForm.name.trim(),
        company_name: partnerForm.company_name.trim() || null,
        phone1: partnerForm.phone1.trim() || null,
        phone2: partnerForm.phone2.trim() || null,
        email: partnerForm.email.trim(),
        city: partnerForm.city.trim() || null,
        country: partnerForm.country.trim() || null,
        full_address: partnerForm.full_address.trim() || null,
        website: partnerForm.website.trim() || null,
        notes: partnerForm.notes.trim() || null
      }
      // Only include password if it was changed
      if (partnerForm.password.trim()) {
        updateData.password = partnerForm.password
      }
      await api.put(`/partners/${editingPartner.id}`, updateData)
      alert('Partner updated successfully!')
      setShowPartnerForm(false)
      setEditingPartner(null)
      resetPartnerForm()
      loadPartners()
    } catch (error) {
      console.error('Error updating partner:', error)
      alert(error.response?.data?.detail || 'Failed to update partner')
    }
  }
  
  const handleDeletePartner = async (id) => {
    if (!confirm('Are you sure you want to delete this partner? This will fail if the partner has associated students.')) {
      return
    }
    try {
      await api.delete(`/partners/${id}`)
      alert('Partner deleted successfully!')
      loadPartners()
    } catch (error) {
      console.error('Error deleting partner:', error)
      alert(error.response?.data?.detail || 'Failed to delete partner')
    }
  }
  
  const resetPartnerForm = () => {
    setPartnerForm({
      name: '', company_name: '', phone1: '', phone2: '', email: '', city: '', country: '', 
      full_address: '', website: '', notes: '', password: ''
    })
  }
  
  const startEditPartner = (partner) => {
    setEditingPartner(partner)
    setPartnerForm({
      name: partner.name || '',
      company_name: partner.company_name || '',
      phone1: partner.phone1 || '',
      phone2: partner.phone2 || '',
      email: partner.email || '',
      city: partner.city || '',
      country: partner.country || '',
      full_address: partner.full_address || '',
      website: partner.website || '',
      notes: partner.notes || '',
      password: '' // Don't show password
    })
    setShowPartnerForm(true)
  }
  
  const handleDocumentImport = async () => {
    if (!documentImportFile) {
      alert('Please select a document file')
      return
    }
    
    setLoading('documentImport', true)
    try {
      const formData = new FormData()
      formData.append('file', documentImportFile)
      
      // Start SQL generation job (returns immediately with job_id)
      console.log('🚀 Starting SQL generation job...')
      const startResponse = await api.post('/admin/document-import/generate-sql-start', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000 // 10 seconds should be enough to start the job
      })
      
      const jobId = startResponse.data.job_id
      console.log(`✅ Job started: ${jobId}`)
      
      // Poll for job status every 2 seconds
      let pollCount = 0
      const maxPolls = 150 // 5 minutes max (150 * 2 seconds)
      const pollInterval = setInterval(async () => {
        pollCount++
        try {
          const statusResponse = await api.get(`/admin/document-import/generate-sql-status/${jobId}`)
          const job = statusResponse.data
          
          console.log(`📊 [${pollCount}] Job status: ${job.status}, progress: ${job.progress}`)
          
          if (job.status === 'completed') {
            clearInterval(pollInterval)
            setLoading('documentImport', false)
            setSqlGenerationProgress('')
            
            if (!job.result) {
              throw new Error('Job completed but no result returned')
            }
            
            // Ensure SQL is a string (handle edge cases)
            let sqlString = job.result.sql
            
            // Handle various possible formats
            if (typeof sqlString !== 'string') {
              if (sqlString && typeof sqlString === 'object') {
                // If it's an object, try to extract the SQL
                if (sqlString.sql) {
                  sqlString = sqlString.sql
                } else {
                  sqlString = String(sqlString)
                }
              } else {
                sqlString = String(sqlString || '')
              }
            }
            
            // Validate SQL string
            if (!sqlString || sqlString === 'undefined' || sqlString === 'null' || sqlString === '[object Object]') {
              throw new Error('Invalid SQL in result: SQL is not a valid string')
            }
            
            // Additional validation: SQL should be reasonably long
            if (sqlString.length < 100) {
              console.warn('SQL seems too short:', sqlString)
              throw new Error('Generated SQL appears to be invalid (too short). Please try again.')
            }
            
            // Debug: log what we're storing
            console.log('✅ Storing SQL:', {
              type: typeof sqlString,
              length: sqlString.length,
              first100: sqlString.substring(0, 100)
            })
            
            setGeneratedSQL(sqlString)
            setSqlValidation(job.result.validation)
            setDocumentTextPreview(job.result.document_text_preview || '')
            
            if (!job.result.validation.valid) {
              const errorMsg = job.result.validation.errors?.join('\n') || 'SQL validation found errors'
              alert(`SQL validation found errors:\n${errorMsg}\n\nPlease review the generated SQL carefully.`)
            } else {
              alert('SQL generated successfully!')
            }
          } else if (job.status === 'failed') {
            clearInterval(pollInterval)
            setLoading('documentImport', false)
            setSqlGenerationProgress('')
            const errorMsg = job.error || 'SQL generation failed'
            alert(`SQL Generation Failed: ${errorMsg}`)
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval)
            setLoading('documentImport', false)
            setSqlGenerationProgress('')
            alert('SQL generation is taking longer than expected (5 minutes). Please try again or check backend logs.')
          }
          // If status is 'processing', continue polling
        } catch (pollError) {
          console.error('Error polling job status:', pollError)
          // Don't clear interval on network errors, keep trying
          if (pollError.response?.status === 404) {
            clearInterval(pollInterval)
            setLoading('documentImport', false)
            alert('Job not found. Please try again.')
          }
        }
      }, 2000) // Poll every 2 seconds
    } catch (error) {
      console.error('Error generating SQL:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate SQL from document'
      alert(`SQL Generation Failed: ${errorMessage}`)
    } finally {
      setLoading('documentImport', false)
    }
  }
  
  const handleExecuteSQL = async (sqlToExecute = null) => {
    // Get SQL from parameter, generatedSQL, or manualSQL
    // If sqlToExecute is an event object (from onClick), ignore it and use state
    let sql = null
    
    // Check if sqlToExecute is actually a SQL string (longer than 10 chars) or an event object
    if (sqlToExecute && typeof sqlToExecute === 'string' && sqlToExecute.length > 10) {
      // It's actually SQL string passed as parameter
      sql = sqlToExecute
    } else if (sqlToExecute && typeof sqlToExecute === 'object' && sqlToExecute.target) {
      // This is an event object from onClick, ignore it
      console.warn('Received event object, using generatedSQL from state')
      sql = generatedSQL || manualSQL || ''
    } else {
      // Use generatedSQL or manualSQL from state
      sql = generatedSQL || manualSQL || ''
    }
    
    // Debug: log what we received
    console.log('handleExecuteSQL called:', {
      sqlToExecute: sqlToExecute ? (typeof sqlToExecute === 'string' ? `string(${sqlToExecute.length})` : typeof sqlToExecute) : 'null',
      generatedSQL: generatedSQL ? `string(${generatedSQL.length})` : 'null',
      manualSQL: manualSQL ? `string(${manualSQL.length})` : 'null',
      sql: sql ? `string(${sql.length})` : 'null'
    })
    
    // Ensure it's a string (handle case where it might be an object)
    if (typeof sql !== 'string') {
      console.error('SQL is not a string:', sql, typeof sql)
      if (sql && typeof sql === 'object') {
        // Try to extract SQL from various possible object structures
        if (sql.sql) {
          sql = sql.sql
        } else if (sql.result && sql.result.sql) {
          sql = sql.result.sql
        } else {
          // Last resort: try to stringify, but this will likely fail
          console.error('Cannot extract SQL from object:', sql)
          alert('Invalid SQL format. Please regenerate SQL or paste SQL manually.')
          return
        }
      } else {
        sql = String(sql || '')
      }
    }
    
    sql = sql.trim()
    
    if (!sql || sql === 'undefined' || sql === 'null' || sql === '[object Object]' || sql.length < 50) {
      console.error('Invalid SQL:', { length: sql.length, first100: sql.substring(0, 100) })
      alert('No valid SQL to execute. Please regenerate SQL or paste SQL manually.')
      return
    }
    
    // Debug: log what we're sending
    console.log('Executing SQL (length):', sql.length, 'First 100 chars:', sql.substring(0, 100))
    
    if (!confirm('Are you sure you want to execute this SQL? This will modify the database.')) {
      return
    }
    
    setExecutingSQL(true)
    try {
      // Final validation: ensure SQL is a string before sending
      if (typeof sql !== 'string') {
        console.error('SQL is still not a string before sending:', typeof sql, sql)
        alert('Invalid SQL format. Please regenerate SQL or paste SQL manually.')
        setExecutingSQL(false)
        return
      }
      
      // Double-check it's not the object string
      if (sql === '[object Object]' || sql.length < 50) {
        console.error('SQL appears to be invalid:', sql.substring(0, 100))
        alert('SQL appears to be invalid. Please regenerate SQL or paste SQL manually.')
        setExecutingSQL(false)
        return
      }
      
      console.log('Sending SQL to backend:', {
        type: typeof sql,
        length: sql.length,
        first100: sql.substring(0, 100)
      })
      
      const response = await api.post('/admin/document-import/execute-sql', {
        sql: sql
      })
      
      console.log('SQL Execution Response:', response.data)
      setSqlExecutionResult(response.data)
      
      if (response.data.summary) {
        const summary = response.data.summary
        const errors = summary.errors || []
        
        if (errors.length > 0) {
          alert(`SQL executed with errors:\n${errors.join('\n')}`)
        } else {
          const msg = `SQL executed successfully!\n\n` +
            `Inserted: ${summary.majors_inserted || 0} majors, ${summary.program_intakes_inserted || 0} intakes, ${summary.documents_inserted || 0} documents, ${summary.scholarships_inserted || 0} scholarships, ${summary.links_inserted || 0} links\n` +
            `Updated: ${summary.majors_updated || 0} majors, ${summary.program_intakes_updated || 0} intakes, ${summary.documents_updated || 0} documents`
          alert(msg)
        }
      } else {
        alert('SQL executed, but no summary returned. Check the execution result below.')
      }
      
      // Reload relevant data
      if (activeTab === 'universities') loadUniversities()
      if (activeTab === 'majors') loadMajorsForDropdown()
      if (activeTab === 'intakes') loadProgramIntakes()
      
    } catch (error) {
      console.error('Error executing SQL:', error)
      alert(error.response?.data?.detail || 'Failed to execute SQL')
      setSqlExecutionResult({
        success: false,
        error: error.response?.data?.detail || error.message
      })
    } finally {
      setExecutingSQL(false)
    }
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
              onClick={() => setActiveTab('document-import')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'document-import'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {loadingStates.documentImport ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              Document Import
            </button>
            <button
              onClick={() => {
                setActiveTab('program-documents')
                if (activeTab !== 'program-documents') {
                  loadProgramIntakes() // Load intakes for filter
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'program-documents'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              Program Documents
            </button>
            <button
              onClick={() => {
                setActiveTab('scholarships')
                if (activeTab !== 'scholarships') {
                  loadScholarships()
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'scholarships'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Scholarships
            </button>
            <button
              onClick={() => {
                setActiveTab('partners')
                if (activeTab !== 'partners') {
                  loadPartners()
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                activeTab === 'partners'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              Partners
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
                <button
                  onClick={() => {
                    resetStudentForm()
                    setEditingStudent(null)
                    setShowStudentModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Student
                </button>
              </div>
              
              {/* Search */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, passport, or country..."
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
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-12"></th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Passport</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Country</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Docs</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Apps</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                              No students found
                            </td>
                          </tr>
                        ) : (
                          students.map((student) => (
                            <React.Fragment key={student.id}>
                              <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => toggleStudentExpansion(student.id)}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    {expandedStudents.has(student.id) ? '−' : '+'}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{student.id}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{student.full_name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.email || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.phone || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.passport_number || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.country_of_citizenship || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.document_count || 0}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.application_count || 0}</td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => window.open(`/dashboard?admin_view=true&student_id=${student.id}`, '_blank')}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="View Student Dashboard"
                                    >
                                      <UserIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => startEditStudent(student)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Edit Student"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedStudents.has(student.id) && (
                                <tr>
                                  <td colSpan="10" className="px-4 py-4 bg-gray-50">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-gray-900 mb-2">Applications ({studentApplications[student.id]?.length || 0})</h4>
                                      {studentApplications[student.id] && studentApplications[student.id].length > 0 ? (
                                        <div className="space-y-2">
                                          {studentApplications[student.id].map((app) => (
                                            <div key={app.id} className="bg-white rounded border border-gray-200 p-3">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <p className="font-medium text-gray-900">{app.university_name} - {app.major_name}</p>
                                                  <p className="text-sm text-gray-600">{app.intake_term} {app.intake_year}</p>
                                                  <p className="text-sm text-gray-500">Status: {app.status}</p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-sm text-gray-600">Fee: {app.application_fee || 0} RMB</p>
                                                  {app.application_fee_paid && (
                                                    <span className="text-xs text-green-600">✓ Paid</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500">No applications found</p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                        />
                      </div>
                      {!editingStudent && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password (Optional - will generate random if not provided)</label>
                          <input
                            type="password"
                            value={studentForm.password}
                            onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Leave empty to generate random password"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={studentForm.full_name}
                          onChange={(e) => setStudentForm({...studentForm, full_name: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                        <input
                          type="text"
                          value={studentForm.passport_number}
                          onChange={(e) => setStudentForm({...studentForm, passport_number: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country of Citizenship</label>
                        <input
                          type="text"
                          value={studentForm.country_of_citizenship}
                          onChange={(e) => setStudentForm({...studentForm, country_of_citizenship: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={editingStudent ? handleUpdateStudent : handleCreateStudent}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {editingStudent ? 'Update' : 'Create'}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name (Chinese)</label>
                      <input type="text" value={universityForm.name_cn} onChange={(e) => setUniversityForm({...universityForm, name_cn: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="中文名称" />
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">World Ranking Band</label>
                      <input 
                        type="text" 
                        value={universityForm.world_ranking_band || ''} 
                        onChange={(e) => setUniversityForm({...universityForm, world_ranking_band: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                        placeholder="e.g., Top 100, Top 200, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">National Ranking</label>
                      <input 
                        type="number" 
                        value={universityForm.national_ranking || ''} 
                        onChange={(e) => setUniversityForm({...universityForm, national_ranking: e.target.value ? parseInt(e.target.value) : ''})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                        placeholder="e.g., 1, 2, 3..."
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                      <select 
                        value={universityForm.default_currency} 
                        onChange={(e) => setUniversityForm({...universityForm, default_currency: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="CNY">CNY (Chinese Yuan)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                      </select>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aliases</label>
                      <input 
                        type="text" 
                        value={universityForm.aliases} 
                        onChange={(e) => setUniversityForm({...universityForm, aliases: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                        placeholder="Comma-separated aliases (e.g., PKU, Peking University)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter alternative names separated by commas</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Tags</label>
                      <input 
                        type="text" 
                        value={universityForm.project_tags} 
                        onChange={(e) => setUniversityForm({...universityForm, project_tags: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                        placeholder="Comma-separated tags (e.g., 985, 211, C9, Double First Class)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter project tags separated by commas</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={universityForm.description} onChange={(e) => setUniversityForm({...universityForm, description: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2 flex gap-6">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={universityForm.is_partner} onChange={(e) => setUniversityForm({...universityForm, is_partner: e.target.checked})} />
                        <span className="text-sm font-medium text-gray-700">Partner University</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={universityForm.is_active} onChange={(e) => setUniversityForm({...universityForm, is_active: e.target.checked})} />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
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
            <MajorsTable 
              universities={universities} 
              onUpdate={() => {
                loadMajors(selectedUniversity)
                if (activeTab === 'intakes') {
                  loadProgramIntakes()
                }
              }}
            />
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
                        setProgramDocuments([])
                        setDocumentForm({ name: '', is_required: true, rules: '', applies_to: '' })
                        setEditingDocument(null)
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
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Universities</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>{uni.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {showIntakeForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b z-10">
                    <h3 className="text-lg font-semibold">{editingIntake ? 'Edit' : 'Add'} Program Intake</h3>
                    <button onClick={() => { setShowIntakeForm(false); setEditingIntake(null); resetIntakeForm() }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* ========== SECTION 1: Basic Information ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('basic')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">1. Basic Information</h4>
                      {intakeFormSections.basic ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.basic && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                          <select value={intakeForm.university_id} onChange={(e) => {
                            setIntakeForm({...intakeForm, university_id: e.target.value, major_id: ''})
                            setSelectedUniversity(parseInt(e.target.value))
                          }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                            <option value="">Select University</option>
                            {universities.map((uni) => (
                              <option key={uni.id} value={uni.id}>{uni.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Major *</label>
                          <select value={intakeForm.major_id} onChange={(e) => setIntakeForm({...intakeForm, major_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required disabled={!intakeForm.university_id}>
                            <option value="">Select Major</option>
                            {majors.filter(m => m.university_id === parseInt(intakeForm.university_id)).map((major) => (
                              <option key={major.id} value={major.id}>{major.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Intake Term *</label>
                          <select value={intakeForm.intake_term} onChange={(e) => setIntakeForm({...intakeForm, intake_term: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="March">March</option>
                            <option value="September">September</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Intake Year *</label>
                          <input type="number" value={intakeForm.intake_year} onChange={(e) => setIntakeForm({...intakeForm, intake_year: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                          <input type="datetime-local" value={intakeForm.application_deadline} onChange={(e) => setIntakeForm({...intakeForm, application_deadline: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Program Start Date</label>
                          <input type="date" value={intakeForm.program_start_date} onChange={(e) => setIntakeForm({...intakeForm, program_start_date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline Type</label>
                          <select value={intakeForm.deadline_type} onChange={(e) => setIntakeForm({...intakeForm, deadline_type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Select Type</option>
                            <option value="University Deadline">University Deadline</option>
                            <option value="CSC Deadline">CSC Deadline</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 2: Degree & Program Details ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('degree')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">2. Degree & Program Details</h4>
                      {intakeFormSections.degree ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.degree && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Language *</label>
                          <select value={intakeForm.teaching_language} onChange={(e) => setIntakeForm({...intakeForm, teaching_language: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="English">English</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Bilingual">Bilingual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
                          <input type="number" step="0.5" value={intakeForm.duration_years} onChange={(e) => setIntakeForm({...intakeForm, duration_years: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 2.5" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Degree Type</label>
                          <select value={intakeForm.degree_type} onChange={(e) => setIntakeForm({...intakeForm, degree_type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Select Degree Type</option>
                            <option value="Language Program">Language Program</option>
                            <option value="Junior high">Junior high</option>
                            <option value="Senior high">Senior high</option>
                            <option value="Non Degree">Non Degree</option>
                            <option value="Associate">Associate</option>
                            <option value="Vocational College">Vocational College</option>
                            <option value="Bachelor">Bachelor</option>
                            <option value="Master">Master</option>
                            <option value="Phd">Phd</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Process</label>
                          <textarea value={intakeForm.admission_process} onChange={(e) => setIntakeForm({...intakeForm, admission_process: e.target.value})} rows={2} placeholder="Describe the admission process" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 3: Fees ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('fees')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">3. Fees</h4>
                      {intakeFormSections.fees ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.fees && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                          <select value={intakeForm.currency} onChange={(e) => setIntakeForm({...intakeForm, currency: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="CNY">CNY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tuition per Semester</label>
                          <input type="number" step="0.01" value={intakeForm.tuition_per_semester} onChange={(e) => setIntakeForm({...intakeForm, tuition_per_semester: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tuition per Year</label>
                          <input type="number" step="0.01" value={intakeForm.tuition_per_year} onChange={(e) => setIntakeForm({...intakeForm, tuition_per_year: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Application Fee (Non-refundable)</label>
                          <input type="number" step="0.01" value={intakeForm.application_fee} onChange={(e) => setIntakeForm({...intakeForm, application_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Fee</label>
                          <input type="number" step="0.01" value={intakeForm.accommodation_fee} onChange={(e) => setIntakeForm({...intakeForm, accommodation_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 3000" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Fee Period</label>
                          <select value={intakeForm.accommodation_fee_period} onChange={(e) => setIntakeForm({...intakeForm, accommodation_fee_period: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Select Period</option>
                            <option value="month">Per Month</option>
                            <option value="semester">Per Semester</option>
                            <option value="year">Per Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (MalishaEdu)</label>
                          <input type="number" step="0.01" value={intakeForm.service_fee} onChange={(e) => setIntakeForm({...intakeForm, service_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 2000" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Medical Insurance Fee</label>
                          <input type="number" step="0.01" value={intakeForm.medical_insurance_fee} onChange={(e) => setIntakeForm({...intakeForm, medical_insurance_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 1000" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Medical Insurance Fee Period</label>
                          <select value={intakeForm.medical_insurance_fee_period} onChange={(e) => setIntakeForm({...intakeForm, medical_insurance_fee_period: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Select Period</option>
                            <option value="month">Per Month</option>
                            <option value="semester">Per Semester</option>
                            <option value="year">Per Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Medical Checkup Fee (One-time)</label>
                          <input type="number" step="0.01" value={intakeForm.arrival_medical_checkup_fee} onChange={(e) => setIntakeForm({...intakeForm, arrival_medical_checkup_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Visa Extension Fee (Annual)</label>
                          <input type="number" step="0.01" value={intakeForm.visa_extension_fee} onChange={(e) => setIntakeForm({...intakeForm, visa_extension_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.arrival_medical_checkup_is_one_time} onChange={(e) => setIntakeForm({...intakeForm, arrival_medical_checkup_is_one_time: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">Arrival Medical Checkup is One-time</label>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Note</label>
                          <textarea value={intakeForm.accommodation_note} onChange={(e) => setIntakeForm({...intakeForm, accommodation_note: e.target.value})} rows={2} placeholder="Notes about accommodation options" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 4: Requirements ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('requirements')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">4. Requirements</h4>
                      {intakeFormSections.requirements ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.requirements && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Age Minimum</label>
                          <input type="number" value={intakeForm.age_min} onChange={(e) => setIntakeForm({...intakeForm, age_min: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Age Maximum</label>
                          <input type="number" value={intakeForm.age_max} onChange={(e) => setIntakeForm({...intakeForm, age_max: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Min Average Score</label>
                          <input type="number" step="0.01" value={intakeForm.min_average_score} onChange={(e) => setIntakeForm({...intakeForm, min_average_score: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.interview_required} onChange={(e) => setIntakeForm({...intakeForm, interview_required: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">Interview Required</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.written_test_required} onChange={(e) => setIntakeForm({...intakeForm, written_test_required: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">Written Test Required</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.acceptance_letter_required} onChange={(e) => setIntakeForm({...intakeForm, acceptance_letter_required: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">Acceptance Letter Required</label>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Documents Required (comma-separated) *</label>
                          <textarea value={intakeForm.documents_required} onChange={(e) => setIntakeForm({...intakeForm, documents_required: e.target.value})} rows={2} placeholder="e.g., passport, photo, diploma, transcript, bank statement" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 5: Language Requirements ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('language')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">5. Language Requirements</h4>
                      {intakeFormSections.language ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.language && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.hsk_required} onChange={(e) => setIntakeForm({...intakeForm, hsk_required: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">HSK Required</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HSK Level</label>
                          <input type="number" value={intakeForm.hsk_level} onChange={(e) => setIntakeForm({...intakeForm, hsk_level: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 5" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HSK Min Score</label>
                          <input type="number" value={intakeForm.hsk_min_score} onChange={(e) => setIntakeForm({...intakeForm, hsk_min_score: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 180" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.english_test_required} onChange={(e) => setIntakeForm({...intakeForm, english_test_required: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">English Test Required</label>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">English Test Note</label>
                          <input type="text" value={intakeForm.english_test_note} onChange={(e) => setIntakeForm({...intakeForm, english_test_note: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., IELTS 6.0+, TOEFL 80+, PTE 58+" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 6: Bank Statement Requirements ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('bankStatement')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">6. Bank Statement Requirements</h4>
                      {intakeFormSections.bankStatement ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.bankStatement && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.bank_statement_required} onChange={(e) => setIntakeForm({...intakeForm, bank_statement_required: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">Bank Statement Required</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement Amount</label>
                          <input type="number" step="0.01" value={intakeForm.bank_statement_amount} onChange={(e) => setIntakeForm({...intakeForm, bank_statement_amount: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 5000" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement Currency</label>
                          <select value={intakeForm.bank_statement_currency} onChange={(e) => setIntakeForm({...intakeForm, bank_statement_currency: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="USD">USD</option>
                            <option value="CNY">CNY</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement Note</label>
                          <input type="text" value={intakeForm.bank_statement_note} onChange={(e) => setIntakeForm({...intakeForm, bank_statement_note: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., ≥ $5000" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 7: Inside China Applicants ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('insideChina')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">7. Inside China Applicants</h4>
                      {intakeFormSections.insideChina ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.insideChina && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={intakeForm.inside_china_applicants_allowed} onChange={(e) => setIntakeForm({...intakeForm, inside_china_applicants_allowed: e.target.checked})} className="w-4 h-4" />
                          <label className="text-sm font-medium text-gray-700">Inside China Applicants Allowed</label>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Inside China Extra Requirements</label>
                          <textarea value={intakeForm.inside_china_extra_requirements} onChange={(e) => setIntakeForm({...intakeForm, inside_china_extra_requirements: e.target.value})} rows={2} placeholder="Extra requirements for applicants already in China" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 8: Scholarship Information ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('scholarship')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">8. Scholarship Information</h4>
                      {intakeFormSections.scholarship ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.scholarship && (
                      <div className="p-4 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Available</label>
                          <select value={intakeForm.scholarship_available} onChange={(e) => setIntakeForm({...intakeForm, scholarship_available: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Unknown</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Information</label>
                          <textarea value={intakeForm.scholarship_info} onChange={(e) => setIntakeForm({...intakeForm, scholarship_info: e.target.value})} rows={3} placeholder="Available scholarships for this program/intake" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 9: Required Documents ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => {
                        toggleIntakeSection('documents')
                        // Load documents when section is opened
                        if (editingIntake?.id && !intakeFormSections.documents) {
                          loadProgramDocuments(editingIntake.id)
                        } else if (!editingIntake && intakeForm.university_id && intakeForm.major_id && !intakeFormSections.documents) {
                          // For new intake, documents will be added after creation
                        }
                      }}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">9. Required Documents</h4>
                      {intakeFormSections.documents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.documents && (
                      <div className="p-4">
                        {editingIntake?.id ? (
                          <>
                            {/* Document List */}
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Current Documents</h5>
                              {programDocuments.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No documents added yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {programDocuments.map((doc) => (
                                    <div key={doc.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm text-gray-900">{doc.name}</span>
                                          {doc.is_required && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>
                                          )}
                                          {!doc.is_required && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">Optional</span>
                                          )}
                                          {doc.applies_to && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{doc.applies_to}</span>
                                          )}
                                        </div>
                                        {doc.rules && (
                                          <p className="text-xs text-gray-600 mt-1">{doc.rules}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <button onClick={() => startEditDocument(doc)} className="text-blue-600 hover:text-blue-800">
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteDocument(doc.id, editingIntake.id)} className="text-red-600 hover:text-red-800">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Add/Edit Document Form */}
                            <div className="border-t pt-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                {editingDocument ? 'Edit Document' : 'Add New Document'}
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                                  <input 
                                    type="text" 
                                    value={documentForm.name} 
                                    onChange={(e) => setDocumentForm({...documentForm, name: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                    placeholder="e.g., Passport, Transcript, Study Plan"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                                  <select 
                                    value={documentForm.applies_to} 
                                    onChange={(e) => setDocumentForm({...documentForm, applies_to: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                  >
                                    <option value="">All Applicants</option>
                                    <option value="inside_china_only">Inside China Only</option>
                                    <option value="outside_china_only">Outside China Only</option>
                                    <option value="chinese_taught_only">Chinese Taught Only</option>
                                    <option value="english_taught_only">English Taught Only</option>
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Rules/Requirements</label>
                                  <input 
                                    type="text" 
                                    value={documentForm.rules} 
                                    onChange={(e) => setDocumentForm({...documentForm, rules: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                    placeholder="e.g., Study plan 800+ words, Video 3–5 minutes, ≥ $5000 USD"
                                  />
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={documentForm.is_required} 
                                    onChange={(e) => setDocumentForm({...documentForm, is_required: e.target.checked})} 
                                    className="w-4 h-4" 
                                  />
                                  <label className="text-sm font-medium text-gray-700">Required Document</label>
                                </div>
                                <div className="col-span-2 flex gap-2">
                                  {editingDocument ? (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateDocument(editingDocument.id, editingIntake.id)} 
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                      >
                                        Update Document
                                      </button>
                                      <button 
                                        onClick={cancelEditDocument} 
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => handleCreateDocument(editingIntake.id)} 
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                    >
                                      Add Document
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-yellow-800 mb-1">Documents Cannot Be Added Yet</h5>
                                <p className="text-sm text-yellow-700">
                                  Please save the program intake first before adding documents. Once the intake is created, you can edit it and add document requirements.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 10: Program Intake Scholarships ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => {
                        toggleIntakeSection('intakeScholarships')
                        // Load scholarships when section is opened
                        if (editingIntake?.id && !intakeFormSections.intakeScholarships) {
                          loadProgramIntakeScholarships(editingIntake.id)
                          loadScholarships() // Load available scholarships for dropdown
                        } else if (!editingIntake && intakeForm.university_id && intakeForm.major_id && !intakeFormSections.intakeScholarships) {
                          // For new intake, scholarships will be added after creation
                          loadScholarships() // Load available scholarships for dropdown
                        }
                      }}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">10. Program Intake Scholarships</h4>
                      {intakeFormSections.intakeScholarships ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.intakeScholarships && (
                      <div className="p-4">
                        {editingIntake?.id ? (
                          <>
                            {/* Scholarship List */}
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Current Scholarships</h5>
                              {programIntakeScholarships.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No scholarships added yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {programIntakeScholarships.map((pis) => (
                                    <div key={pis.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-sm text-gray-900">{pis.scholarship_name}</span>
                                          {pis.covers_tuition && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Tuition</span>}
                                          {pis.covers_accommodation && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Accommodation</span>}
                                          {pis.covers_insurance && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Insurance</span>}
                                          {pis.first_year_only && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">First Year Only</span>}
                                          {pis.renewal_required && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Renewal Required</span>}
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          {pis.tuition_waiver_percent && <p>Tuition Waiver: {pis.tuition_waiver_percent}%</p>}
                                          {pis.living_allowance_monthly && <p>Living Allowance: {pis.living_allowance_monthly}/month</p>}
                                          {pis.living_allowance_yearly && <p>Living Allowance: {pis.living_allowance_yearly}/year</p>}
                                          {pis.deadline && <p>Deadline: {new Date(pis.deadline).toLocaleDateString()}</p>}
                                          {pis.eligibility_note && <p>Eligibility: {pis.eligibility_note}</p>}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <button onClick={() => startEditProgramIntakeScholarship(pis)} className="text-blue-600 hover:text-blue-800">
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteProgramIntakeScholarship(pis.id, editingIntake.id)} className="text-red-600 hover:text-red-800">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Add/Edit Scholarship Form */}
                            <div className="border-t pt-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                {editingProgramIntakeScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship *</label>
                                  <select 
                                    value={programIntakeScholarshipForm.scholarship_id} 
                                    onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, scholarship_id: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    disabled={!!editingProgramIntakeScholarship}
                                  >
                                    <option value="">Select Scholarship</option>
                                    {scholarships.map((sch) => (
                                      <option key={sch.id} value={sch.id}>{sch.name} {sch.provider ? `(${sch.provider})` : ''}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-3 grid grid-cols-3 gap-2">
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={programIntakeScholarshipForm.covers_tuition} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, covers_tuition: e.target.checked})} className="w-4 h-4" />
                                    <label className="text-sm font-medium text-gray-700">Covers Tuition</label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={programIntakeScholarshipForm.covers_accommodation} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, covers_accommodation: e.target.checked})} className="w-4 h-4" />
                                    <label className="text-sm font-medium text-gray-700">Covers Accommodation</label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={programIntakeScholarshipForm.covers_insurance} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, covers_insurance: e.target.checked})} className="w-4 h-4" />
                                    <label className="text-sm font-medium text-gray-700">Covers Insurance</label>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuition Waiver %</label>
                                  <input type="number" min="0" max="100" value={programIntakeScholarshipForm.tuition_waiver_percent} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, tuition_waiver_percent: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 50" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Living Allowance (Monthly)</label>
                                  <input type="number" step="0.01" value={programIntakeScholarshipForm.living_allowance_monthly} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, living_allowance_monthly: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 3500" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Living Allowance (Yearly)</label>
                                  <input type="number" step="0.01" value={programIntakeScholarshipForm.living_allowance_yearly} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, living_allowance_yearly: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., 36000" />
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={programIntakeScholarshipForm.first_year_only} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, first_year_only: e.target.checked})} className="w-4 h-4" />
                                    <label className="text-sm font-medium text-gray-700">First Year Only</label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={programIntakeScholarshipForm.renewal_required} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, renewal_required: e.target.checked})} className="w-4 h-4" />
                                    <label className="text-sm font-medium text-gray-700">Renewal Required</label>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Deadline</label>
                                  <input type="date" value={programIntakeScholarshipForm.deadline} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, deadline: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Note</label>
                                  <textarea value={programIntakeScholarshipForm.eligibility_note} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, eligibility_note: e.target.value})} rows={2} placeholder="Eligibility requirements and notes" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div className="col-span-2 flex gap-2">
                                  {editingProgramIntakeScholarship ? (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateProgramIntakeScholarship(editingProgramIntakeScholarship.id, editingIntake.id)} 
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                      >
                                        Update Scholarship
                                      </button>
                                      <button 
                                        onClick={cancelEditProgramIntakeScholarship} 
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => handleCreateProgramIntakeScholarship(editingIntake.id)} 
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                    >
                                      Add Scholarship
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-yellow-800 mb-1">Scholarships Cannot Be Added Yet</h5>
                                <p className="text-sm text-yellow-700">
                                  Please save the program intake first before adding scholarships. Once the intake is created, you can edit it and add scholarship information.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 11: Exam Requirements ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => {
                        toggleIntakeSection('examRequirements')
                        // Load exam requirements when section is opened
                        if (editingIntake?.id && !intakeFormSections.examRequirements) {
                          loadProgramExamRequirements(editingIntake.id)
                        }
                      }}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">11. Exam Requirements</h4>
                      {intakeFormSections.examRequirements ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.examRequirements && (
                      <div className="p-4">
                        {editingIntake?.id ? (
                          <>
                            {/* Exam Requirements List */}
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Current Exam Requirements</h5>
                              {programExamRequirements.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No exam requirements added yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {programExamRequirements.map((examReq) => (
                                    <div key={examReq.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm text-gray-900">{examReq.exam_name}</span>
                                          {examReq.required && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>
                                          )}
                                          {!examReq.required && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">Optional</span>
                                          )}
                                          {examReq.exam_language && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{examReq.exam_language}</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 space-y-1">
                                          {examReq.subjects && <p>Subjects: {examReq.subjects}</p>}
                                          {examReq.min_level && <p>Min Level: {examReq.min_level}</p>}
                                          {examReq.min_score && <p>Min Score: {examReq.min_score}</p>}
                                          {examReq.notes && <p>Notes: {examReq.notes}</p>}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <button onClick={() => startEditExamRequirement(examReq)} className="text-blue-600 hover:text-blue-800">
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteExamRequirement(examReq.id, editingIntake.id)} className="text-red-600 hover:text-red-800">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Add/Edit Exam Requirement Form */}
                            <div className="border-t pt-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                {editingExamRequirement ? 'Edit Exam Requirement' : 'Add New Exam Requirement'}
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                                  {examRequirementForm.exam_name && !['HSK', 'HSKK', 'CSCA', 'IELTS', 'TOEFL', 'PTE', 'Duolingo'].includes(examRequirementForm.exam_name) ? (
                                    <input 
                                      type="text" 
                                      value={examRequirementForm.exam_name} 
                                      onChange={(e) => setExamRequirementForm({...examRequirementForm, exam_name: e.target.value})} 
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                      placeholder="Enter exam name"
                                    />
                                  ) : (
                                    <select 
                                      value={examRequirementForm.exam_name} 
                                      onChange={(e) => {
                                        const value = e.target.value
                                        if (value === 'Other') {
                                          setExamRequirementForm({...examRequirementForm, exam_name: ''})
                                        } else {
                                          setExamRequirementForm({...examRequirementForm, exam_name: value})
                                        }
                                      }} 
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    >
                                      <option value="">Select Exam</option>
                                      <option value="HSK">HSK</option>
                                      <option value="HSKK">HSKK</option>
                                      <option value="CSCA">CSCA</option>
                                      <option value="IELTS">IELTS</option>
                                      <option value="TOEFL">TOEFL</option>
                                      <option value="PTE">PTE</option>
                                      <option value="Duolingo">Duolingo</option>
                                      <option value="Other">Other (Custom)</option>
                                    </select>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Language</label>
                                  <input 
                                    type="text" 
                                    value={examRequirementForm.exam_language} 
                                    onChange={(e) => setExamRequirementForm({...examRequirementForm, exam_language: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                    placeholder="e.g., English version CSCA required"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (for CSCA)</label>
                                  <input 
                                    type="text" 
                                    value={examRequirementForm.subjects} 
                                    onChange={(e) => setExamRequirementForm({...examRequirementForm, subjects: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                    placeholder="e.g., Math/Physics/Chemistry"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Level (for HSK)</label>
                                  <input 
                                    type="number" 
                                    value={examRequirementForm.min_level} 
                                    onChange={(e) => setExamRequirementForm({...examRequirementForm, min_level: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                    placeholder="e.g., 5"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
                                  <input 
                                    type="number" 
                                    value={examRequirementForm.min_score} 
                                    onChange={(e) => setExamRequirementForm({...examRequirementForm, min_score: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                    placeholder="e.g., 180 (HSK), 6.5 (IELTS - use notes)"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                  <textarea 
                                    value={examRequirementForm.notes} 
                                    onChange={(e) => setExamRequirementForm({...examRequirementForm, notes: e.target.value})} 
                                    rows={2} 
                                    placeholder="Additional notes about the exam requirement" 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                  />
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={examRequirementForm.required} 
                                    onChange={(e) => setExamRequirementForm({...examRequirementForm, required: e.target.checked})} 
                                    className="w-4 h-4" 
                                  />
                                  <label className="text-sm font-medium text-gray-700">Required Exam</label>
                                </div>
                                <div className="col-span-2 flex gap-2">
                                  {editingExamRequirement ? (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateExamRequirement(editingExamRequirement.id, editingIntake.id)} 
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                      >
                                        Update Exam Requirement
                                      </button>
                                      <button 
                                        onClick={cancelEditExamRequirement} 
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => handleCreateExamRequirement(editingIntake.id)} 
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                    >
                                      Add Exam Requirement
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-yellow-800 mb-1">Exam Requirements Cannot Be Added Yet</h5>
                                <p className="text-sm text-yellow-700">
                                  Please save the program intake first before adding exam requirements. Once the intake is created, you can edit it and add exam requirements.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ========== SECTION 12: Additional Notes ========== */}
                  <div className="mb-4 border rounded-lg">
                    <button 
                      onClick={() => toggleIntakeSection('notes')}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">12. Additional Notes</h4>
                      {intakeFormSections.notes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {intakeFormSections.notes && (
                      <div className="p-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea value={intakeForm.notes} onChange={(e) => setIntakeForm({...intakeForm, notes: e.target.value})} rows={3} placeholder="e.g., Age 18-30, Online interview required" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white">
                    <button onClick={editingIntake ? handleUpdateIntake : handleCreateIntake} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                      {editingIntake ? 'Update' : 'Create'} Program Intake
                    </button>
                    <button onClick={() => { setShowIntakeForm(false); setEditingIntake(null); resetIntakeForm() }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Search and Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <input
                      type="text"
                      value={intakeSearchTerm}
                      onChange={(e) => setIntakeSearchTerm(e.target.value)}
                      placeholder="Search by notes, scholarship info, admission process..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
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
                    value={selectedIntakeTerm || ''}
                    onChange={(e) => {
                      setSelectedIntakeTerm(e.target.value || null)
                      setIntakeCurrentPage(1)
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All Intake Terms</option>
                    <option value="March">March</option>
                    <option value="September">September</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    value={selectedIntakeYear || ''}
                    onChange={(e) => {
                      setSelectedIntakeYear(e.target.value ? parseInt(e.target.value) : null)
                      setIntakeCurrentPage(1)
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4">
                  <select
                    value={selectedTeachingLanguage || ''}
                    onChange={(e) => {
                      setSelectedTeachingLanguage(e.target.value || null)
                      setIntakeCurrentPage(1)
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All Teaching Languages</option>
                    <option value="English">English</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Bilingual">Bilingual</option>
                  </select>
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Teaching Language</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Deadline</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tuition/Year</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">App Fee</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {programIntakes.map((intake) => {
                      const uni = intake.university_name || universities.find(u => u.id === intake.university_id)?.name
                      const major = intake.major_name || majors.find(m => m.id === intake.major_id)?.name
                      const deadline = intake.application_deadline ? new Date(intake.application_deadline) : null
                      return (
                        <tr key={intake.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{uni || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{major || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{intake.intake_term} {intake.intake_year}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{intake.teaching_language || 'N/A'}</td>
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
                    {programIntakes.length === 0 && !loadingStates.intakes && (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          No program intakes found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Pagination Controls */}
                {intakeTotalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(intakeCurrentPage - 1) * intakePageSize + 1} to {Math.min(intakeCurrentPage * intakePageSize, intakeTotal)} of {intakeTotal} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIntakeCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={intakeCurrentPage === 1 || loadingStates.intakes}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {intakeCurrentPage} of {intakeTotalPages}
                      </span>
                      <button
                        onClick={() => setIntakeCurrentPage(prev => Math.min(intakeTotalPages, prev + 1))}
                        disabled={intakeCurrentPage === intakeTotalPages || loadingStates.intakes}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'document-import' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Document Import</h2>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Upload a document (PDF, DOCX, or TXT) describing a university's programs and intake details. 
                  The system will generate a PostgreSQL SQL script that you can review and execute.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setDocumentImportFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {documentImportFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {documentImportFile.name}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleDocumentImport}
                    disabled={!documentImportFile || loadingStates.documentImport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingStates.documentImport ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {sqlGenerationProgress || 'Generating SQL...'}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Generate SQL
                      </>
                    )}
                  </button>
                  
                  {documentTextPreview && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Text Preview
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">{documentTextPreview}</pre>
                      </div>
                    </div>
                  )}
                  
                  {sqlValidation && (
                    <div className="mt-4">
                      <div className={`p-4 rounded-lg ${
                        sqlValidation.valid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <h3 className="text-sm font-semibold mb-2">
                          {sqlValidation.valid ? '✓ SQL Validation Passed' : '✗ SQL Validation Failed'}
                        </h3>
                        {sqlValidation.errors.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {sqlValidation.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        )}
                        {sqlValidation.warnings.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1 mt-2">
                            {sqlValidation.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {generatedSQL && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Generated SQL Script
                        </label>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedSQL)
                            alert('SQL copied to clipboard!')
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Copy SQL
                        </button>
                      </div>
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">{generatedSQL}</pre>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleExecuteSQL()}
                          disabled={executingSQL || !sqlValidation?.valid}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {executingSQL ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Execute SQL
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setGeneratedSQL('')
                            setSqlValidation(null)
                            setDocumentTextPreview('')
                            setDocumentImportFile(null)
                            setSqlExecutionResult(null)
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Manual SQL Paste Field */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual SQL Execution</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste SQL Script
                        </label>
                        <textarea
                          value={manualSQL}
                          onChange={(e) => setManualSQL(e.target.value)}
                          placeholder="Paste your SQL script here..."
                          className="w-full h-48 border border-gray-300 rounded-lg p-3 font-mono text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleExecuteSQL(manualSQL)}
                        disabled={!String(manualSQL || '').trim() || executingSQL}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {executingSQL ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Execute Manual SQL
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {sqlExecutionResult && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Execution Result</h3>
                      <div className={`border rounded-lg p-4 ${
                        sqlExecutionResult.success === false 
                          ? 'bg-red-50 border-red-200' 
                          : sqlExecutionResult.summary?.errors?.length > 0
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        {sqlExecutionResult.error ? (
                          <div className="text-red-700">
                            <span className="font-medium">Error:</span> {sqlExecutionResult.error}
                          </div>
                        ) : sqlExecutionResult.summary ? (
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium">Majors:</span> {sqlExecutionResult.summary.majors_inserted || 0} inserted, {sqlExecutionResult.summary.majors_updated || 0} updated
                              </div>
                              <div>
                                <span className="font-medium">Intakes:</span> {sqlExecutionResult.summary.program_intakes_inserted || 0} inserted, {sqlExecutionResult.summary.program_intakes_updated || 0} updated
                              </div>
                              <div>
                                <span className="font-medium">Documents:</span> {sqlExecutionResult.summary.documents_inserted || 0} inserted, {sqlExecutionResult.summary.documents_updated || 0} updated
                              </div>
                              <div>
                                <span className="font-medium">Scholarships:</span> {sqlExecutionResult.summary.scholarships_inserted || 0} inserted, {sqlExecutionResult.summary.scholarships_updated || 0} updated
                              </div>
                              <div>
                                <span className="font-medium">Links:</span> {sqlExecutionResult.summary.links_inserted || 0} inserted
                              </div>
                            </div>
                            {sqlExecutionResult.summary.errors && Array.isArray(sqlExecutionResult.summary.errors) && sqlExecutionResult.summary.errors.length > 0 && (
                              <div className="mt-4">
                                <span className="font-medium text-red-700">Errors:</span>
                                <ul className="list-disc list-inside text-red-600 space-y-1 mt-1">
                                  {sqlExecutionResult.summary.errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(!sqlExecutionResult.summary.errors || sqlExecutionResult.summary.errors.length === 0) && (
                              <div className="mt-2 text-green-700 font-medium">
                                ✓ All operations completed successfully
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-600">
                            SQL executed, but no summary data returned. Check the results array below.
                            {sqlExecutionResult.results && (
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                {JSON.stringify(sqlExecutionResult.results, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'program-documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Program Documents</h2>
              </div>
              
              {/* Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by University</label>
                  <select 
                    value={selectedUniversity || ''} 
                    onChange={(e) => {
                      setSelectedUniversity(e.target.value ? parseInt(e.target.value) : null)
                    }} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All Universities</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>{uni.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Program Intake</label>
                  <select 
                    value={selectedIntakeForDocuments || ''} 
                    onChange={async (e) => {
                      const intakeId = e.target.value ? parseInt(e.target.value) : null
                      setSelectedIntakeForDocuments(intakeId)
                      if (intakeId) {
                        await loadAllProgramDocuments(intakeId)
                      } else {
                        setAllProgramDocuments([])
                      }
                    }} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Program Intake</option>
                    {(Array.isArray(programIntakes) ? programIntakes : (programIntakes?.items || []))
                      .filter(intake => {
                        if (selectedUniversity && intake.university_id !== selectedUniversity) return false
                        return true
                      })
                      .map((intake) => {
                        const uni = intake.university_name || universities.find(u => u.id === intake.university_id)?.name
                        const major = intake.major_name || majors.find(m => m.id === intake.major_id)?.name
                        return (
                          <option key={intake.id} value={intake.id}>
                            {uni} - {major} ({intake.intake_term} {intake.intake_year})
                          </option>
                        )
                      })}
                  </select>
                </div>
              </div>
              
              {/* Documents Table */}
              {selectedIntakeForDocuments ? (
                <ProgramDocumentsTable 
                  intakeId={selectedIntakeForDocuments}
                  onUpdate={() => loadAllProgramDocuments(selectedIntakeForDocuments)}
                />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Please select a program intake to view and manage documents</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'partners' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Partners</h2>
                <button
                  onClick={() => {
                    resetPartnerForm()
                    setEditingPartner(null)
                    setShowPartnerForm(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Partner
                </button>
              </div>
              
              {/* Add/Edit Partner Form */}
              {showPartnerForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{editingPartner ? 'Edit' : 'Add'} Partner</h3>
                    <button onClick={() => { setShowPartnerForm(false); setEditingPartner(null); resetPartnerForm() }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input type="text" value={partnerForm.name} onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input type="text" value={partnerForm.company_name} onChange={(e) => setPartnerForm({...partnerForm, company_name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" value={partnerForm.email} onChange={(e) => setPartnerForm({...partnerForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingPartner ? '(leave empty to keep current)' : '*'}</label>
                      <input type="password" value={partnerForm.password} onChange={(e) => setPartnerForm({...partnerForm, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required={!editingPartner} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone 1</label>
                      <input type="text" value={partnerForm.phone1} onChange={(e) => setPartnerForm({...partnerForm, phone1: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone 2</label>
                      <input type="text" value={partnerForm.phone2} onChange={(e) => setPartnerForm({...partnerForm, phone2: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input type="text" value={partnerForm.city} onChange={(e) => setPartnerForm({...partnerForm, city: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input type="text" value={partnerForm.country} onChange={(e) => setPartnerForm({...partnerForm, country: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                      <textarea value={partnerForm.full_address} onChange={(e) => setPartnerForm({...partnerForm, full_address: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input type="url" value={partnerForm.website} onChange={(e) => setPartnerForm({...partnerForm, website: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea value={partnerForm.notes} onChange={(e) => setPartnerForm({...partnerForm, notes: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button onClick={editingPartner ? handleUpdatePartner : handleCreatePartner} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingPartner ? 'Update' : 'Create'}
                      </button>
                      <button onClick={() => { setShowPartnerForm(false); setEditingPartner(null); resetPartnerForm() }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Partners Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Company</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">City/Country</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          No partners found. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      partners.map((partner) => (
                        <tr key={partner.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{partner.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{partner.company_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{partner.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{partner.phone1 || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{partner.city || ''}{partner.city && partner.country ? ', ' : ''}{partner.country || ''}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button onClick={() => startEditPartner(partner)} className="text-blue-600 hover:text-blue-800">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeletePartner(partner.id)} className="text-red-600 hover:text-red-800">
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
          )}
          
          {activeTab === 'scholarships' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Scholarships</h2>
                <button
                  onClick={() => {
                    setEditingScholarship(null)
                    setScholarshipForm({ name: '', provider: '', notes: '' })
                    setShowScholarshipForm(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Scholarship
                </button>
              </div>
              
              {/* Add/Edit Scholarship Form */}
              {showScholarshipForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">{editingScholarship ? 'Edit' : 'Add'} Scholarship</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={scholarshipForm.name}
                        onChange={(e) => setScholarshipForm({...scholarshipForm, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., CSC, HuaShan, Freshman Scholarship"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <input
                        type="text"
                        value={scholarshipForm.provider}
                        onChange={(e) => setScholarshipForm({...scholarshipForm, provider: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., University, CSC"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={scholarshipForm.notes}
                        onChange={(e) => setScholarshipForm({...scholarshipForm, notes: e.target.value})}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Additional notes about the scholarship"
                      />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={editingScholarship ? handleUpdateScholarship : handleCreateScholarship}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingScholarship ? 'Update' : 'Create'} Scholarship
                      </button>
                      <button
                        onClick={cancelEditScholarship}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scholarships Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Provider</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scholarships.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          No scholarships found. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      scholarships.map((scholarship) => (
                        <tr key={scholarship.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{scholarship.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{scholarship.provider || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{scholarship.notes || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button onClick={() => startEditScholarship(scholarship)} className="text-blue-600 hover:text-blue-800">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteScholarship(scholarship.id)} className="text-red-600 hover:text-red-800">
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

