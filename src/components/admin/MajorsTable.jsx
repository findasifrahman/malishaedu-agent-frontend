import { useState, useEffect } from 'react'
import { Edit, Trash2, Plus, X, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function MajorsTable({ universities, onUpdate }) {
  const [majors, setMajors] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingMajor, setEditingMajor] = useState(null)
  const [selectedUniversity, setSelectedUniversity] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const [majorForm, setMajorForm] = useState({
    university_id: selectedUniversity || '', name: '', name_cn: '', degree_level: '',
    teaching_language: 'English', duration_years: '', description: '', discipline: '', 
    category: '', keywords: '', is_featured: false, is_active: true
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm)
      setCurrentPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load majors with pagination
  useEffect(() => {
    loadMajors()
  }, [selectedUniversity, searchDebounced, currentPage])

  const loadMajors = async () => {
    setLoading(true)
    try {
      let url = `/majors?page=${currentPage}&page_size=${pageSize}`
      if (selectedUniversity) url += `&university_id=${selectedUniversity}`
      if (searchDebounced) url += `&search=${encodeURIComponent(searchDebounced)}`
      
      const response = await api.get(url)
      if (response.data.items) {
        setMajors(response.data.items)
        setTotal(response.data.total)
        setTotalPages(response.data.total_pages)
      } else {
        // Fallback for old API format
        setMajors(Array.isArray(response.data) ? response.data : [])
        setTotal(response.data.length || 0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading majors:', error)
      setMajors([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMajor = async () => {
    try {
      // Convert keywords string to array
      const keywordsArray = majorForm.keywords 
        ? majorForm.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : null
      
      const data = {
        ...majorForm,
        university_id: parseInt(majorForm.university_id),
        duration_years: majorForm.duration_years ? parseFloat(majorForm.duration_years) : null,
        keywords: keywordsArray,
        name_cn: majorForm.name_cn || null,
        category: majorForm.category || null
      }
      await api.post('/majors', data)
      alert('Major created successfully!')
      setShowForm(false)
      resetMajorForm()
      loadMajors()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error creating major:', error)
      alert('Failed to create major')
    }
  }

  const handleUpdateMajor = async () => {
    try {
      // Convert keywords string to array
      const keywordsArray = majorForm.keywords 
        ? majorForm.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : null
      
      const data = {
        ...majorForm,
        duration_years: majorForm.duration_years ? parseFloat(majorForm.duration_years) : null,
        keywords: keywordsArray,
        name_cn: majorForm.name_cn || null,
        category: majorForm.category || null
      }
      await api.put(`/majors/${editingMajor.id}`, data)
      alert('Major updated successfully!')
      setShowForm(false)
      setEditingMajor(null)
      resetMajorForm()
      loadMajors()
      if (onUpdate) onUpdate()
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
      loadMajors()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error deleting major:', error)
      alert('Failed to delete major')
    }
  }

  const resetMajorForm = () => {
    setMajorForm({
      university_id: selectedUniversity || '', name: '', name_cn: '', degree_level: '',
      teaching_language: 'English', duration_years: '', description: '', discipline: '', 
      category: '', keywords: '', is_featured: false, is_active: true
    })
  }

  const startEditMajor = (major) => {
    setEditingMajor(major)
    setMajorForm({
      university_id: major.university_id || '',
      name: major.name || '',
      name_cn: major.name_cn || '',
      degree_level: major.degree_level || '',
      teaching_language: major.teaching_language || 'English',
      duration_years: major.duration_years || '',
      description: major.description || '',
      discipline: major.discipline || '',
      category: major.category || '',
      keywords: Array.isArray(major.keywords) ? major.keywords.join(', ') : (major.keywords || ''),
      is_featured: major.is_featured || false,
      is_active: major.is_active !== undefined ? major.is_active : true
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Majors</h2>
        <button
          onClick={() => {
            resetMajorForm()
            setEditingMajor(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Major
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Majors</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, description, or discipline..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by University</label>
          <select 
            value={selectedUniversity || ''} 
            onChange={(e) => {
              setSelectedUniversity(e.target.value ? parseInt(e.target.value) : null)
              setCurrentPage(1)
            }} 
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Universities</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>{uni.name}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingMajor ? 'Edit' : 'Add'} Major</h3>
            <button onClick={() => { setShowForm(false); setEditingMajor(null); resetMajorForm() }} className="text-gray-500 hover:text-gray-700">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Chinese)</label>
              <input type="text" value={majorForm.name_cn} onChange={(e) => setMajorForm({...majorForm, name_cn: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="中文名称" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree Level *</label>
              <select value={majorForm.degree_level} onChange={(e) => setMajorForm({...majorForm, degree_level: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                <option value="">Select Degree Level</option>
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
              <select value={majorForm.discipline} onChange={(e) => setMajorForm({...majorForm, discipline: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">Select Discipline</option>
                <option value="A. Agriculture & Forestry">A. Agriculture & Forestry</option>
                <option value="B. Architecture & Planning">B. Architecture & Planning</option>
                <option value="C. Business & Management">C. Business & Management</option>
                <option value="D. Communication & Media">D. Communication & Media</option>
                <option value="E. Economics & Finance">E. Economics & Finance</option>
                <option value="F. Education">F. Education</option>
                <option value="G. Engineering & Technology">G. Engineering & Technology</option>
                <option value="H. Environmental & Earth Sciences">H. Environmental & Earth Sciences</option>
                <option value="I. Information & Computer Sciences">I. Information & Computer Sciences</option>
                <option value="J. Journalism">J. Journalism</option>
                <option value="K. Law & Legal Studies">K. Law & Legal Studies</option>
                <option value="L. Life Sciences">L. Life Sciences</option>
                <option value="M. Medical & Health Sciences">M. Medical & Health Sciences</option>
                <option value="N. Natural & Physical Sciences">N. Natural & Physical Sciences</option>
                <option value="O. Public Administration & Policy">O. Public Administration & Policy</option>
                <option value="P. Psychology & Behavioral Sciences">P. Psychology & Behavioral Sciences</option>
                <option value="Q. Quantitative & Statistical Sciences">Q. Quantitative & Statistical Sciences</option>
                <option value="R. Social Sciences">R. Social Sciences</option>
                <option value="S. Sports & Physical Education">S. Sports & Physical Education</option>
                <option value="T. Tourism & Hospitality">T. Tourism & Hospitality</option>
                <option value="U. Urban & Regional Planning">U. Urban & Regional Planning</option>
                <option value="V. Visual & Performing Arts">V. Visual & Performing Arts</option>
                <option value="W. Writing & Literature">W. Writing & Literature</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={majorForm.category} onChange={(e) => setMajorForm({...majorForm, category: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">Select Category</option>
                <option value="Non-degree/Language Program">Non-degree/Language Program</option>
                <option value="Degree Program">Degree Program</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <input 
                type="text" 
                value={majorForm.keywords} 
                onChange={(e) => setMajorForm({...majorForm, keywords: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                placeholder="Comma-separated keywords (e.g., physics, applied physics, mechanics)"
              />
              <p className="text-xs text-gray-500 mt-1">Enter keywords separated by commas for better search matching</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={majorForm.description} onChange={(e) => setMajorForm({...majorForm, description: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={majorForm.is_featured} onChange={(e) => setMajorForm({...majorForm, is_featured: e.target.checked})} />
                <span className="text-sm font-medium text-gray-700">Featured Major</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={majorForm.is_active} onChange={(e) => setMajorForm({...majorForm, is_active: e.target.checked})} />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="col-span-2 flex gap-2">
              <button onClick={editingMajor ? handleUpdateMajor : handleCreateMajor} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingMajor ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingMajor(null); resetMajorForm() }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
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
                    <td className="px-4 py-3 text-sm text-gray-600">{major.university_name || universities.find(u => u.id === major.university_id)?.name || 'N/A'}</td>
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
                {majors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No majors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} majors
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
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

