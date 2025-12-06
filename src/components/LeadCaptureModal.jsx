import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../services/api'

const DEGREE_TYPES = [
  "Non-degree",
  "Associate",
  "Bachelor",
  "Master",
  "Doctoral (PhD)",
  "Language",
  "Short Program",
  "Study Tour Program",
  "Upgrade from Junior College Student to University Student"
]

const INTAKE_OPTIONS = [
  "March",
  "September",
  "Other"
]

export default function LeadCaptureModal({ onClose, deviceFingerprint, chatSessionId }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    nationality: '',
    subject_major: '',
    degree_type: '',
    preferred_city: '',
    intake: '',
    intake_year: '',
    university: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [universities, setUniversities] = useState([])
  const [majors, setMajors] = useState([])
  const [loadingUniversities, setLoadingUniversities] = useState(false)
  const [loadingMajors, setLoadingMajors] = useState(false)
  
  // Map degree types from form to backend format
  const degreeTypeMap = {
    "Non-degree": "Non-degree",
    "Associate": "Associate",
    "Bachelor": "Bachelor",
    "Master": "Master",
    "Doctoral (PhD)": "Doctoral (PhD)",
    "Language": "Language",
    "Short Program": "Non-degree",
    "Study Tour Program": "Non-degree",
    "Upgrade from Junior College Student to University Student": "Bachelor"
  }
  
  // Fetch universities on component mount
  useEffect(() => {
    const fetchUniversities = async () => {
      setLoadingUniversities(true)
      try {
        const response = await api.get('/universities?is_partner=true')
        setUniversities(response.data || [])
      } catch (err) {
        console.error('Error fetching universities:', err)
        setUniversities([])
      } finally {
        setLoadingUniversities(false)
      }
    }
    fetchUniversities()
  }, [])
  
  // Fetch majors when university or degree_type changes
  useEffect(() => {
    const fetchMajors = async () => {
      if (!formData.university || !formData.degree_type) {
        setMajors([])
        setFormData(prev => ({ ...prev, subject_major: '' })) // Clear major if university or degree type is cleared
        return
      }
      
      setLoadingMajors(true)
      // Clear major when filters change
      setFormData(prev => ({ ...prev, subject_major: '' }))
      
      try {
        // Find university ID from selected university name
        const selectedUni = universities.find(u => u.name === formData.university)
        if (!selectedUni) {
          setMajors([])
          return
        }
        
        // Map degree type to backend format
        const backendDegreeType = degreeTypeMap[formData.degree_type] || formData.degree_type
        
        const response = await api.get(`/majors?university_id=${selectedUni.id}&degree_level=${encodeURIComponent(backendDegreeType)}`)
        console.log('DEBUG: Fetched majors:', response.data)
        setMajors(response.data || [])
      } catch (err) {
        console.error('Error fetching majors:', err)
        setMajors([])
      } finally {
        setLoadingMajors(false)
      }
    }
    
    fetchMajors()
  }, [formData.university, formData.degree_type, universities])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Submit lead form with fuzzy matching
      const response = await api.post('/leads/submit', {
        name: formData.name,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        nationality: formData.nationality,
        subject_major: formData.subject_major,
        degree_type: formData.degree_type,
        preferred_city: formData.preferred_city || null,
        intake: formData.intake,
        intake_year: formData.intake_year ? parseInt(formData.intake_year) : null,
        university: formData.university || null,
        device_fingerprint: deviceFingerprint,
        chat_session_id: chatSessionId,
      })
      
      // Store lead info locally and mark as submitted
      localStorage.setItem('lead_info', JSON.stringify(formData))
      localStorage.setItem('lead_submitted', 'true')
      
      // Close modal after successful submission
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit information')
      setLoading(false)
    }
  }
  
  const handleMaybeLater = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Mark that user dismissed the modal
    localStorage.setItem('lead_dismissed', 'true')
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Get Started with MalishaEdu
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-4 text-sm">
            Share your information so we can provide personalized guidance for studying in China!
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., +1234567890 or 0123456789"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Nationality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="Any language accepted"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">You can type in any language - we'll match it automatically</p>
            </div>
            
            {/* Degree Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applying Degree Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.degree_type}
                onChange={(e) => setFormData({ ...formData, degree_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select degree type</option>
                {DEGREE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Preferred City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred City (Optional)
              </label>
              <input
                type="text"
                value={formData.preferred_city}
                onChange={(e) => setFormData({ ...formData, preferred_city: e.target.value })}
                placeholder="e.g., Beijing, Shanghai, Guangzhou..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Any language accepted - we'll match it automatically</p>
            </div>
            
            {/* Intake */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intake <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.intake}
                onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select intake</option>
                {INTAKE_OPTIONS.map((intake) => (
                  <option key={intake} value={intake}>
                    {intake}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Intake Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intake Year (Optional)
              </label>
              <input
                type="number"
                min="2024"
                max="2030"
                value={formData.intake_year}
                onChange={(e) => setFormData({ ...formData, intake_year: e.target.value })}
                placeholder="e.g., 2025"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* University */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                University (Optional)
              </label>
              <select
                value={formData.university}
                onChange={(e) => {
                  const selectedUni = e.target.value
                  setFormData({ ...formData, university: selectedUni, subject_major: '' }) // Clear major when university changes
                  setMajors([]) // Reset majors
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingUniversities}
              >
                <option value="">Any / Not Certain</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.name}>
                    {uni.name} {uni.city ? `(${uni.city})` : ''}
                  </option>
                ))}
              </select>
              {loadingUniversities && (
                <p className="text-xs text-gray-500 mt-1">Loading universities...</p>
              )}
              {!loadingUniversities && universities.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No partner universities found</p>
              )}
            </div>
            
            {/* Subject/Major */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject/Major <span className="text-red-500">*</span>
              </label>
              {formData.university && formData.degree_type ? (
                loadingMajors ? (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">
                    Loading majors...
                  </div>
                ) : majors.length > 0 ? (
                  <select
                    value={formData.subject_major}
                    onChange={(e) => setFormData({ ...formData, subject_major: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select major</option>
                    {majors.map((major) => (
                      <option key={major.id} value={major.name}>
                        {major.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.subject_major}
                    onChange={(e) => setFormData({ ...formData, subject_major: e.target.value })}
                    placeholder="No majors found. Type major name manually..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )
              ) : (
                <input
                  type="text"
                  value={formData.subject_major}
                  onChange={(e) => setFormData({ ...formData, subject_major: e.target.value })}
                  placeholder="e.g., Computer Science, Engineering, Medicine... (Select university and degree type to filter)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.university && formData.degree_type 
                  ? loadingMajors 
                    ? "Loading available majors..." 
                    : majors.length > 0 
                      ? `${majors.length} major(s) available for ${formData.university} (${formData.degree_type})`
                      : "No majors found. You can type the major name manually."
                  : "Select university and degree type to see filtered majors, or type any major name"}
              </p>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleMaybeLater}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
