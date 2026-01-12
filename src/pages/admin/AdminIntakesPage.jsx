import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../services/api'

export default function AdminIntakesPage() {
  // Main data state
  const [programIntakes, setProgramIntakes] = useState([])
  const [universities, setUniversities] = useState([])
  const [majors, setMajors] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(false)

  // Filter and search state
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [selectedIntakeTerm, setSelectedIntakeTerm] = useState(null)
  const [selectedIntakeYear, setSelectedIntakeYear] = useState(null)
  const [selectedTeachingLanguage, setSelectedTeachingLanguage] = useState(null)
  const [intakeSearchTerm, setIntakeSearchTerm] = useState('')
  const [intakeSearchDebounced, setIntakeSearchDebounced] = useState('')
  const [intakeCurrentPage, setIntakeCurrentPage] = useState(1)
  const [intakePageSize] = useState(20)
  const [intakeTotal, setIntakeTotal] = useState(0)
  const [intakeTotalPages, setIntakeTotalPages] = useState(0)

  // Form state
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [editingIntake, setEditingIntake] = useState(null)
  const [intakeFormSections, setIntakeFormSections] = useState({
    basic: true, degree: true, fees: true, requirements: true, language: true,
    bankStatement: true, insideChina: true, scholarship: true, documents: true,
    examRequirements: true, intakeScholarships: true, notes: true
  })
  const [intakeForm, setIntakeForm] = useState({
    university_id: '', major_id: '', intake_term: 'September', intake_year: new Date().getFullYear(),
    application_deadline: '', documents_required: '', tuition_per_semester: '', tuition_per_year: '',
    application_fee: '', accommodation_fee: '', service_fee: '', medical_insurance_fee: '',
    teaching_language: 'English', duration_years: '', degree_type: '',
    arrival_medical_checkup_fee: '', admission_process: '', accommodation_note: '', visa_extension_fee: '',
    notes: '', scholarship_info: '', program_start_date: '', deadline_type: '', scholarship_available: '',
    age_min: '', age_max: '', min_average_score: '', interview_required: false, written_test_required: false,
    acceptance_letter_required: false, inside_china_applicants_allowed: false, inside_china_extra_requirements: '',
    bank_statement_required: false, bank_statement_amount: '', bank_statement_currency: 'USD', bank_statement_note: '',
    hsk_required: false, hsk_level: '', hsk_min_score: '', english_test_required: false, english_test_note: '',
    currency: 'CNY', accommodation_fee_period: '', medical_insurance_fee_period: '', arrival_medical_checkup_is_one_time: true
  })

  // Nested management state
  const [programDocuments, setProgramDocuments] = useState([])
  const [programIntakeScholarships, setProgramIntakeScholarships] = useState([])
  const [programExamRequirements, setProgramExamRequirements] = useState([])
  const [documentForm, setDocumentForm] = useState({ name: '', is_required: true, rules: '', applies_to: '' })
  const [editingDocument, setEditingDocument] = useState(null)
  const [programIntakeScholarshipForm, setProgramIntakeScholarshipForm] = useState({
    scholarship_id: '', covers_tuition: false, covers_accommodation: false, covers_insurance: false,
    tuition_waiver_percent: '', living_allowance_monthly: '', living_allowance_yearly: '',
    first_year_only: false, renewal_required: false, deadline: '', eligibility_note: ''
  })
  const [editingProgramIntakeScholarship, setEditingProgramIntakeScholarship] = useState(null)
  const [examRequirementForm, setExamRequirementForm] = useState({
    exam_name: '', required: true, subjects: '', min_level: '', min_score: '', exam_language: '', notes: ''
  })
  const [editingExamRequirement, setEditingExamRequirement] = useState(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntakeSearchDebounced(intakeSearchTerm)
      setIntakeCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [intakeSearchTerm])

  // Load initial data
  useEffect(() => {
    loadUniversities()
    loadMajorsForDropdown()
    loadScholarships()
  }, [])

  // Load intakes when filters change
  useEffect(() => {
    loadProgramIntakes()
  }, [selectedUniversity, selectedIntakeTerm, selectedIntakeYear, selectedTeachingLanguage, intakeSearchDebounced, intakeCurrentPage])

  const loadUniversities = async () => {
    try {
      const response = await api.get('/universities')
      setUniversities(response.data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const loadMajorsForDropdown = async (universityId = null) => {
    try {
      let url = `/majors?page=1&page_size=1000`
      if (universityId) url += `&university_id=${universityId}`
      const response = await api.get(url)
      if (response.data.items) {
        setMajors(response.data.items)
      } else if (Array.isArray(response.data)) {
        setMajors(response.data)
      } else {
        setMajors([])
      }
    } catch (error) {
      console.error('Error loading majors:', error)
      setMajors([])
    }
  }

  const loadScholarships = async () => {
    try {
      const response = await api.get('/scholarships')
      setScholarships(response.data || [])
    } catch (error) {
      console.error('Error loading scholarships:', error)
    }
  }

  const loadProgramIntakes = async () => {
    setLoading(true)
    try {
      let url = `/program-intakes?upcoming_only=false&page=${intakeCurrentPage}&page_size=${intakePageSize}`
      if (selectedUniversity) url += `&university_id=${selectedUniversity}`
      if (selectedIntakeTerm) url += `&intake_term=${selectedIntakeTerm}`
      if (selectedIntakeYear) url += `&intake_year=${selectedIntakeYear}`
      if (selectedTeachingLanguage) url += `&teaching_language=${encodeURIComponent(selectedTeachingLanguage)}`
      if (intakeSearchDebounced) url += `&search=${encodeURIComponent(intakeSearchDebounced)}`

      const response = await api.get(url)
      if (response.data.items) {
        setProgramIntakes(response.data.items)
        setIntakeTotal(response.data.total)
        setIntakeTotalPages(response.data.total_pages)
      } else if (Array.isArray(response.data)) {
        setProgramIntakes(response.data)
        setIntakeTotal(response.data.length)
        setIntakeTotalPages(1)
      } else {
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
      setLoading(false)
    }
  }

  const loadProgramDocuments = async (intakeId) => {
    if (!intakeId) return
    try {
      const response = await api.get(`/program-documents/program-intakes/${intakeId}/documents`)
      setProgramDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading program documents:', error)
      setProgramDocuments([])
    }
  }

  const loadProgramIntakeScholarships = async (intakeId) => {
    if (!intakeId) return
    try {
      const response = await api.get(`/scholarships/program-intakes/${intakeId}/scholarships`)
      setProgramIntakeScholarships(response.data || [])
    } catch (error) {
      console.error('Error loading program intake scholarships:', error)
      setProgramIntakeScholarships([])
    }
  }

  const loadProgramExamRequirements = async (intakeId) => {
    if (!intakeId) return
    try {
      const response = await api.get(`/program-exam-requirements/program-intakes/${intakeId}/exam-requirements`)
      setProgramExamRequirements(response.data || [])
    } catch (error) {
      console.error('Error loading program exam requirements:', error)
      setProgramExamRequirements([])
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
        program_start_date: intakeForm.program_start_date ? new Date(intakeForm.program_start_date).toISOString().split('T')[0] : null,
        tuition_per_semester: intakeForm.tuition_per_semester ? parseFloat(intakeForm.tuition_per_semester) : null,
        tuition_per_year: intakeForm.tuition_per_year ? parseFloat(intakeForm.tuition_per_year) : null,
        application_fee: intakeForm.application_fee ? parseFloat(intakeForm.application_fee) : null,
        accommodation_fee: intakeForm.accommodation_fee ? parseFloat(intakeForm.accommodation_fee) : null,
        service_fee: intakeForm.service_fee ? parseFloat(intakeForm.service_fee) : null,
        medical_insurance_fee: intakeForm.medical_insurance_fee ? parseFloat(intakeForm.medical_insurance_fee) : null,
        duration_years: intakeForm.duration_years ? parseFloat(intakeForm.duration_years) : null,
        arrival_medical_checkup_fee: intakeForm.arrival_medical_checkup_fee ? parseFloat(intakeForm.arrival_medical_checkup_fee) : null,
        visa_extension_fee: intakeForm.visa_extension_fee ? parseFloat(intakeForm.visa_extension_fee) : null,
        age_min: intakeForm.age_min ? parseInt(intakeForm.age_min) : null,
        age_max: intakeForm.age_max ? parseInt(intakeForm.age_max) : null,
        min_average_score: intakeForm.min_average_score ? parseFloat(intakeForm.min_average_score) : null,
        bank_statement_amount: intakeForm.bank_statement_amount ? parseFloat(intakeForm.bank_statement_amount) : null,
        hsk_level: intakeForm.hsk_level ? parseInt(intakeForm.hsk_level) : null,
        hsk_min_score: intakeForm.hsk_min_score ? parseInt(intakeForm.hsk_min_score) : null,
        scholarship_available: intakeForm.scholarship_available === '' ? null : (intakeForm.scholarship_available === 'true'),
        currency: intakeForm.currency || 'CNY'
      }
      const response = await api.post('/program-intakes', data)
      alert('Program intake created successfully!')
      const newIntakeId = response.data.id
      if (intakeFormSections.documents && newIntakeId) {
        setEditingIntake({ ...response.data, id: newIntakeId })
        loadProgramDocuments(newIntakeId)
      } else {
        setShowIntakeForm(false)
        setEditingIntake(null)
        resetIntakeForm()
        loadProgramIntakes()
      }
    } catch (error) {
      console.error('Error creating program intake:', error)
      alert(error.response?.data?.detail || 'Failed to create program intake')
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
        arrival_medical_checkup_fee: intakeForm.arrival_medical_checkup_fee ? parseFloat(intakeForm.arrival_medical_checkup_fee) : null,
        visa_extension_fee: intakeForm.visa_extension_fee ? parseFloat(intakeForm.visa_extension_fee) : null,
        age_min: intakeForm.age_min ? parseInt(intakeForm.age_min) : null,
        age_max: intakeForm.age_max ? parseInt(intakeForm.age_max) : null,
        min_average_score: intakeForm.min_average_score ? parseFloat(intakeForm.min_average_score) : null,
        bank_statement_amount: intakeForm.bank_statement_amount ? parseFloat(intakeForm.bank_statement_amount) : null,
        hsk_level: intakeForm.hsk_level ? parseInt(intakeForm.hsk_level) : null,
        hsk_min_score: intakeForm.hsk_min_score ? parseInt(intakeForm.hsk_min_score) : null,
        scholarship_available: intakeForm.scholarship_available === '' ? null : (intakeForm.scholarship_available === 'true'),
        currency: intakeForm.currency || 'CNY'
      }
      await api.put(`/program-intakes/${editingIntake.id}`, data)
      alert('Program intake updated successfully!')
      if (intakeFormSections.documents) loadProgramDocuments(editingIntake.id)
      if (intakeFormSections.intakeScholarships) loadProgramIntakeScholarships(editingIntake.id)
      if (intakeFormSections.examRequirements) loadProgramExamRequirements(editingIntake.id)
      if (!intakeFormSections.documents && !intakeFormSections.intakeScholarships && !intakeFormSections.examRequirements) {
        setShowIntakeForm(false)
        setEditingIntake(null)
        resetIntakeForm()
        loadProgramIntakes()
      }
    } catch (error) {
      console.error('Error updating program intake:', error)
      alert(error.response?.data?.detail || 'Failed to update program intake')
    }
  }

  const handleDeleteIntake = async (id) => {
    if (!confirm('Are you sure you want to delete this program intake?')) return
    try {
      await api.delete(`/program-intakes/${id}`)
      alert('Program intake deleted successfully!')
      loadProgramIntakes()
    } catch (error) {
      console.error('Error deleting program intake:', error)
      alert(error.response?.data?.detail || 'Failed to delete program intake')
    }
  }

  const resetIntakeForm = () => {
    setIntakeForm({
      university_id: selectedUniversity || '', major_id: '', intake_term: 'September', intake_year: new Date().getFullYear(),
      application_deadline: '', documents_required: '', tuition_per_semester: '', tuition_per_year: '',
      application_fee: '', accommodation_fee: '', service_fee: '', medical_insurance_fee: '',
      teaching_language: 'English', duration_years: '', degree_type: '',
      arrival_medical_checkup_fee: '', admission_process: '', accommodation_note: '', visa_extension_fee: '',
      notes: '', scholarship_info: '', program_start_date: '', deadline_type: '', scholarship_available: '',
      age_min: '', age_max: '', min_average_score: '', interview_required: false, written_test_required: false,
      acceptance_letter_required: false, inside_china_applicants_allowed: false, inside_china_extra_requirements: '',
      bank_statement_required: false, bank_statement_amount: '', bank_statement_currency: 'USD', bank_statement_note: '',
      hsk_required: false, hsk_level: '', hsk_min_score: '', english_test_required: false, english_test_note: '',
      currency: 'CNY', accommodation_fee_period: '', medical_insurance_fee_period: '', arrival_medical_checkup_is_one_time: true
    })
  }

  const startEditIntake = (intake) => {
    setEditingIntake(intake)
    const deadline = intake.application_deadline ? new Date(intake.application_deadline).toISOString().slice(0, 16) : ''
    const startDate = intake.program_start_date ? new Date(intake.program_start_date).toISOString().slice(0, 10) : ''
    setIntakeForm({
      university_id: intake.university_id || '', major_id: intake.major_id || '',
      intake_term: intake.intake_term || 'September', intake_year: intake.intake_year || new Date().getFullYear(),
      application_deadline: deadline, documents_required: intake.documents_required || '',
      tuition_per_semester: intake.tuition_per_semester || '', tuition_per_year: intake.tuition_per_year || '',
      application_fee: intake.application_fee || '', accommodation_fee: intake.accommodation_fee || '',
      service_fee: intake.service_fee || '', medical_insurance_fee: intake.medical_insurance_fee || '',
      teaching_language: intake.teaching_language || 'English', duration_years: intake.duration_years || '',
      degree_type: intake.degree_type || '', arrival_medical_checkup_fee: intake.arrival_medical_checkup_fee || '',
      admission_process: intake.admission_process || '', accommodation_note: intake.accommodation_note || '',
      visa_extension_fee: intake.visa_extension_fee || '', notes: intake.notes || '',
      scholarship_info: intake.scholarship_info || '', program_start_date: startDate,
      deadline_type: intake.deadline_type || '', scholarship_available: intake.scholarship_available !== undefined ? intake.scholarship_available.toString() : '',
      age_min: intake.age_min || '', age_max: intake.age_max || '', min_average_score: intake.min_average_score || '',
      interview_required: intake.interview_required || false, written_test_required: intake.written_test_required || false,
      acceptance_letter_required: intake.acceptance_letter_required || false,
      inside_china_applicants_allowed: intake.inside_china_applicants_allowed || false,
      inside_china_extra_requirements: intake.inside_china_extra_requirements || '',
      bank_statement_required: intake.bank_statement_required || false,
      bank_statement_amount: intake.bank_statement_amount || '', bank_statement_currency: intake.bank_statement_currency || 'USD',
      bank_statement_note: intake.bank_statement_note || '', hsk_required: intake.hsk_required || false,
      hsk_level: intake.hsk_level || '', hsk_min_score: intake.hsk_min_score || '',
      english_test_required: intake.english_test_required || false, english_test_note: intake.english_test_note || '',
      currency: intake.currency || 'CNY', accommodation_fee_period: intake.accommodation_fee_period || '',
      medical_insurance_fee_period: intake.medical_insurance_fee_period || '',
      arrival_medical_checkup_is_one_time: intake.arrival_medical_checkup_is_one_time !== undefined ? intake.arrival_medical_checkup_is_one_time : true
    })
    setShowIntakeForm(true)
    if (intake.id) {
      loadProgramDocuments(intake.id)
      loadProgramIntakeScholarships(intake.id)
      loadProgramExamRequirements(intake.id)
    }
  }

  const toggleIntakeSection = (section) => {
    setIntakeFormSections(prev => ({ ...prev, [section]: !prev[section] }))
    if (section === 'documents' && editingIntake?.id && !intakeFormSections.documents) {
      loadProgramDocuments(editingIntake.id)
    }
    if (section === 'intakeScholarships' && editingIntake?.id && !intakeFormSections.intakeScholarships) {
      loadProgramIntakeScholarships(editingIntake.id)
      loadScholarships()
    }
    if (section === 'examRequirements' && editingIntake?.id && !intakeFormSections.examRequirements) {
      loadProgramExamRequirements(editingIntake.id)
    }
  }

  // Document management functions
  const handleCreateDocument = async (intakeId) => {
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
      alert(error.response?.data?.detail || 'Failed to add document')
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
      alert(error.response?.data?.detail || 'Failed to update document')
    }
  }

  const handleDeleteDocument = async (documentId, intakeId) => {
    if (!confirm('Are you sure you want to delete this document requirement?')) return
    try {
      await api.delete(`/program-documents/${documentId}`)
      alert('Document deleted successfully!')
      loadProgramDocuments(intakeId)
    } catch (error) {
      console.error('Error deleting document:', error)
      alert(error.response?.data?.detail || 'Failed to delete document')
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

  // Scholarship management functions
  const handleCreateProgramIntakeScholarship = async (intakeId) => {
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
      alert('Scholarship added successfully!')
      setProgramIntakeScholarshipForm({
        scholarship_id: '', covers_tuition: false, covers_accommodation: false, covers_insurance: false,
        tuition_waiver_percent: '', living_allowance_monthly: '', living_allowance_yearly: '',
        first_year_only: false, renewal_required: false, deadline: '', eligibility_note: ''
      })
      loadProgramIntakeScholarships(intakeId)
    } catch (error) {
      console.error('Error creating program intake scholarship:', error)
      alert(error.response?.data?.detail || 'Failed to add scholarship')
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
      alert(error.response?.data?.detail || 'Failed to update scholarship')
    }
  }

  const handleDeleteProgramIntakeScholarship = async (pisId, intakeId) => {
    if (!confirm('Are you sure you want to remove this scholarship from the program intake?')) return
    try {
      await api.delete(`/scholarships/program-intakes/scholarships/${pisId}`)
      alert('Scholarship removed successfully!')
      loadProgramIntakeScholarships(intakeId)
    } catch (error) {
      console.error('Error deleting program intake scholarship:', error)
      alert(error.response?.data?.detail || 'Failed to remove scholarship')
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

  // Exam requirement management functions
  const handleCreateExamRequirement = async (intakeId) => {
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
      alert(error.response?.data?.detail || 'Failed to add exam requirement')
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
      alert(error.response?.data?.detail || 'Failed to update exam requirement')
    }
  }

  const handleDeleteExamRequirement = async (examReqId, intakeId) => {
    if (!confirm('Are you sure you want to delete this exam requirement?')) return
    try {
      await api.delete(`/program-exam-requirements/${examReqId}`)
      alert('Exam requirement deleted successfully!')
      loadProgramExamRequirements(intakeId)
    } catch (error) {
      console.error('Error deleting exam requirement:', error)
      alert(error.response?.data?.detail || 'Failed to delete exam requirement')
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Program Intakes</h2>
        <button
          onClick={() => {
            resetIntakeForm()
            setEditingIntake(null)
            setProgramDocuments([])
            setDocumentForm({ name: '', is_required: true, rules: '', applies_to: '' })
            setEditingDocument(null)
            setShowIntakeForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Program Intake
        </button>
      </div>

      {/* Intake Form Modal */}
      {showIntakeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">{editingIntake ? 'Edit' : 'Add'} Program Intake</h3>
              <button onClick={() => { setShowIntakeForm(false); setEditingIntake(null); resetIntakeForm() }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Section 1: Basic Information */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('basic')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">1. Basic Information</h4>
                  {intakeFormSections.basic ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.basic && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                      <select value={intakeForm.university_id} onChange={(e) => {
                        setIntakeForm({...intakeForm, university_id: e.target.value, major_id: ''})
                        loadMajorsForDropdown(e.target.value ? parseInt(e.target.value) : null)
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
                  </div>
                )}
              </div>

              {/* Section 2: Degree & Program Details */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('degree')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">2. Degree & Program Details</h4>
                  {intakeFormSections.degree ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.degree && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <input type="number" step="0.5" value={intakeForm.duration_years} onChange={(e) => setIntakeForm({...intakeForm, duration_years: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Type</label>
                      <select value={intakeForm.degree_type} onChange={(e) => setIntakeForm({...intakeForm, degree_type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">Select Degree Type</option>
                        <option value="Language Program">Language Program</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="Phd">Phd</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admission Process</label>
                      <textarea value={intakeForm.admission_process} onChange={(e) => setIntakeForm({...intakeForm, admission_process: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Fees */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('fees')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">3. Fees</h4>
                  {intakeFormSections.fees ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.fees && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Application Fee</label>
                      <input type="number" step="0.01" value={intakeForm.application_fee} onChange={(e) => setIntakeForm({...intakeForm, application_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Fee</label>
                      <input type="number" step="0.01" value={intakeForm.accommodation_fee} onChange={(e) => setIntakeForm({...intakeForm, accommodation_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee</label>
                      <input type="number" step="0.01" value={intakeForm.service_fee} onChange={(e) => setIntakeForm({...intakeForm, service_fee: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Requirements */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('requirements')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">4. Requirements</h4>
                  {intakeFormSections.requirements ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.requirements && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documents Required *</label>
                      <textarea value={intakeForm.documents_required} onChange={(e) => setIntakeForm({...intakeForm, documents_required: e.target.value})} rows={2} placeholder="e.g., passport, photo, diploma, transcript" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Language Requirements */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('language')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">5. Language Requirements</h4>
                  {intakeFormSections.language ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.language && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={intakeForm.hsk_required} onChange={(e) => setIntakeForm({...intakeForm, hsk_required: e.target.checked})} className="w-4 h-4" />
                      <label className="text-sm font-medium text-gray-700">HSK Required</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HSK Level</label>
                      <input type="number" value={intakeForm.hsk_level} onChange={(e) => setIntakeForm({...intakeForm, hsk_level: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HSK Min Score</label>
                      <input type="number" value={intakeForm.hsk_min_score} onChange={(e) => setIntakeForm({...intakeForm, hsk_min_score: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={intakeForm.english_test_required} onChange={(e) => setIntakeForm({...intakeForm, english_test_required: e.target.checked})} className="w-4 h-4" />
                      <label className="text-sm font-medium text-gray-700">English Test Required</label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">English Test Note</label>
                      <input type="text" value={intakeForm.english_test_note} onChange={(e) => setIntakeForm({...intakeForm, english_test_note: e.target.value})} placeholder="e.g., IELTS 6.0+, TOEFL 80+" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: Bank Statement */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('bankStatement')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">6. Bank Statement Requirements</h4>
                  {intakeFormSections.bankStatement ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.bankStatement && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={intakeForm.bank_statement_required} onChange={(e) => setIntakeForm({...intakeForm, bank_statement_required: e.target.checked})} className="w-4 h-4" />
                      <label className="text-sm font-medium text-gray-700">Bank Statement Required</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement Amount</label>
                      <input type="number" step="0.01" value={intakeForm.bank_statement_amount} onChange={(e) => setIntakeForm({...intakeForm, bank_statement_amount: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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
                  </div>
                )}
              </div>

              {/* Section 7: Inside China Applicants */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('insideChina')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">7. Inside China Applicants</h4>
                  {intakeFormSections.insideChina ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.insideChina && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={intakeForm.inside_china_applicants_allowed} onChange={(e) => setIntakeForm({...intakeForm, inside_china_applicants_allowed: e.target.checked})} className="w-4 h-4" />
                      <label className="text-sm font-medium text-gray-700">Inside China Applicants Allowed</label>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inside China Extra Requirements</label>
                      <textarea value={intakeForm.inside_china_extra_requirements} onChange={(e) => setIntakeForm({...intakeForm, inside_china_extra_requirements: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 8: Scholarship Information */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('scholarship')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">8. Scholarship Information</h4>
                  {intakeFormSections.scholarship ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.scholarship && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Available</label>
                      <select value={intakeForm.scholarship_available} onChange={(e) => setIntakeForm({...intakeForm, scholarship_available: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">Unknown</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Information</label>
                      <textarea value={intakeForm.scholarship_info} onChange={(e) => setIntakeForm({...intakeForm, scholarship_info: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 9: Required Documents */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('documents')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">9. Required Documents</h4>
                  {intakeFormSections.documents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.documents && (
                  <div className="p-4">
                    {editingIntake?.id ? (
                      <>
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
                                      {doc.is_required && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>}
                                      {doc.applies_to && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{doc.applies_to}</span>}
                                    </div>
                                    {doc.rules && <p className="text-xs text-gray-600 mt-1">{doc.rules}</p>}
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
                        <div className="border-t pt-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">{editingDocument ? 'Edit Document' : 'Add New Document'}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                              <input type="text" value={documentForm.name} onChange={(e) => setDocumentForm({...documentForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                              <select value={documentForm.applies_to} onChange={(e) => setDocumentForm({...documentForm, applies_to: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                <option value="">All Applicants</option>
                                <option value="inside_china_only">Inside China Only</option>
                                <option value="outside_china_only">Outside China Only</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Rules/Requirements</label>
                              <input type="text" value={documentForm.rules} onChange={(e) => setDocumentForm({...documentForm, rules: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                              <input type="checkbox" checked={documentForm.is_required} onChange={(e) => setDocumentForm({...documentForm, is_required: e.target.checked})} className="w-4 h-4" />
                              <label className="text-sm font-medium text-gray-700">Required Document</label>
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                              {editingDocument ? (
                                <>
                                  <button onClick={() => handleUpdateDocument(editingDocument.id, editingIntake.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                    Update Document
                                  </button>
                                  <button onClick={cancelEditDocument} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleCreateDocument(editingIntake.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                  Add Document
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">Please save the program intake first before adding documents.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 10: Program Intake Scholarships */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('intakeScholarships')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">10. Program Intake Scholarships</h4>
                  {intakeFormSections.intakeScholarships ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.intakeScholarships && (
                  <div className="p-4">
                    {editingIntake?.id ? (
                      <>
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Current Scholarships</h5>
                          {programIntakeScholarships.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No scholarships added yet</p>
                          ) : (
                            <div className="space-y-2">
                              {programIntakeScholarships.map((pis) => (
                                <div key={pis.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex-1">
                                    <span className="font-medium text-sm text-gray-900">{pis.scholarship_name}</span>
                                    {pis.tuition_waiver_percent && <span className="ml-2 text-xs text-gray-600">Tuition Waiver: {pis.tuition_waiver_percent}%</span>}
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
                        <div className="border-t pt-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">{editingProgramIntakeScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship *</label>
                              <select value={programIntakeScholarshipForm.scholarship_id} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, scholarship_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!!editingProgramIntakeScholarship}>
                                <option value="">Select Scholarship</option>
                                {scholarships.map((sch) => (
                                  <option key={sch.id} value={sch.id}>{sch.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tuition Waiver %</label>
                              <input type="number" min="0" max="100" value={programIntakeScholarshipForm.tuition_waiver_percent} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, tuition_waiver_percent: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Living Allowance (Monthly)</label>
                              <input type="number" step="0.01" value={programIntakeScholarshipForm.living_allowance_monthly} onChange={(e) => setProgramIntakeScholarshipForm({...programIntakeScholarshipForm, living_allowance_monthly: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                              {editingProgramIntakeScholarship ? (
                                <>
                                  <button onClick={() => handleUpdateProgramIntakeScholarship(editingProgramIntakeScholarship.id, editingIntake.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                    Update Scholarship
                                  </button>
                                  <button onClick={cancelEditProgramIntakeScholarship} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleCreateProgramIntakeScholarship(editingIntake.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                  Add Scholarship
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">Please save the program intake first before adding scholarships.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 11: Exam Requirements */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('examRequirements')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">11. Exam Requirements</h4>
                  {intakeFormSections.examRequirements ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.examRequirements && (
                  <div className="p-4">
                    {editingIntake?.id ? (
                      <>
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Current Exam Requirements</h5>
                          {programExamRequirements.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No exam requirements added yet</p>
                          ) : (
                            <div className="space-y-2">
                              {programExamRequirements.map((examReq) => (
                                <div key={examReq.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex-1">
                                    <span className="font-medium text-sm text-gray-900">{examReq.exam_name}</span>
                                    {examReq.min_score && <span className="ml-2 text-xs text-gray-600">Min Score: {examReq.min_score}</span>}
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
                        <div className="border-t pt-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">{editingExamRequirement ? 'Edit Exam Requirement' : 'Add New Exam Requirement'}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                              <select value={examRequirementForm.exam_name} onChange={(e) => setExamRequirementForm({...examRequirementForm, exam_name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                <option value="">Select Exam</option>
                                <option value="HSK">HSK</option>
                                <option value="IELTS">IELTS</option>
                                <option value="TOEFL">TOEFL</option>
                                <option value="CSCA">CSCA</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
                              <input type="number" value={examRequirementForm.min_score} onChange={(e) => setExamRequirementForm({...examRequirementForm, min_score: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                              <input type="checkbox" checked={examRequirementForm.required} onChange={(e) => setExamRequirementForm({...examRequirementForm, required: e.target.checked})} className="w-4 h-4" />
                              <label className="text-sm font-medium text-gray-700">Required Exam</label>
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                              {editingExamRequirement ? (
                                <>
                                  <button onClick={() => handleUpdateExamRequirement(editingExamRequirement.id, editingIntake.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                    Update Exam Requirement
                                  </button>
                                  <button onClick={cancelEditExamRequirement} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleCreateExamRequirement(editingIntake.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                  Add Exam Requirement
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">Please save the program intake first before adding exam requirements.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 12: Notes */}
              <div className="border rounded-lg">
                <button onClick={() => toggleIntakeSection('notes')} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                  <h4 className="font-semibold text-gray-900">12. Additional Notes</h4>
                  {intakeFormSections.notes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {intakeFormSections.notes && (
                  <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea value={intakeForm.notes} onChange={(e) => setIntakeForm({...intakeForm, notes: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[1000px] px-3 sm:px-0">
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
                        <tr key={intake.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{uni || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{major || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{intake.intake_term} {intake.intake_year}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{intake.teaching_language || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{deadline ? deadline.toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{intake.tuition_per_year ? `${intake.tuition_per_year} ${intake.currency || 'RMB'}` : 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{intake.application_fee ? `${intake.application_fee} ${intake.currency || 'RMB'}` : '-'}</td>
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
                    {programIntakes.length === 0 && (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          No program intakes found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {intakeTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 gap-4">
              <div className="text-sm text-gray-700">
                Showing {(intakeCurrentPage - 1) * intakePageSize + 1} to {Math.min(intakeCurrentPage * intakePageSize, intakeTotal)} of {intakeTotal} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIntakeCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={intakeCurrentPage === 1 || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {intakeCurrentPage} of {intakeTotalPages}
                </span>
                <button
                  onClick={() => setIntakeCurrentPage(prev => Math.min(intakeTotalPages, prev + 1))}
                  disabled={intakeCurrentPage === intakeTotalPages || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
