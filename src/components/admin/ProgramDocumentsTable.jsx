import { useState, useEffect } from 'react'
import { Edit, Trash2, Plus, X } from 'lucide-react'
import api from '../../services/api'

const ProgramDocumentsTable = ({ intakeId, onUpdate }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    is_required: true,
    rules: '',
    applies_to: ''
  })

  useEffect(() => {
    if (intakeId) {
      loadDocuments()
    }
  }, [intakeId])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/program-documents/program-intakes/${intakeId}/documents`)
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Document name is required')
      return
    }
    try {
      await api.post('/program-documents', {
        program_intake_id: intakeId,
        name: formData.name.trim(),
        is_required: formData.is_required,
        rules: formData.rules.trim() || null,
        applies_to: formData.applies_to.trim() || null
      })
      alert('Document added successfully!')
      resetForm()
      loadDocuments()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error creating document:', error)
      alert('Failed to add document')
    }
  }

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      alert('Document name is required')
      return
    }
    try {
      await api.put(`/program-documents/${editingDoc.id}`, {
        name: formData.name.trim(),
        is_required: formData.is_required,
        rules: formData.rules.trim() || null,
        applies_to: formData.applies_to.trim() || null
      })
      alert('Document updated successfully!')
      resetForm()
      loadDocuments()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Failed to update document')
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document requirement?')) {
      return
    }
    try {
      await api.delete(`/program-documents/${docId}`)
      alert('Document deleted successfully!')
      loadDocuments()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }

  const startEdit = (doc) => {
    setEditingDoc(doc)
    setFormData({
      name: doc.name || '',
      is_required: doc.is_required !== undefined ? doc.is_required : true,
      rules: doc.rules || '',
      applies_to: doc.applies_to || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({ name: '', is_required: true, rules: '', applies_to: '' })
    setEditingDoc(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading documents...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Documents for Program Intake</h3>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">{editingDoc ? 'Edit' : 'Add'} Document</h4>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., Passport, Transcript, Study Plan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
              <select
                value={formData.applies_to}
                onChange={(e) => setFormData({...formData, applies_to: e.target.value})}
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
                value={formData.rules}
                onChange={(e) => setFormData({...formData, rules: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., Study plan 800+ words, Video 3–5 minutes, ≥ $5000 USD"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({...formData, is_required: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium text-gray-700">Required Document</label>
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                onClick={editingDoc ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                {editingDoc ? 'Update' : 'Create'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Document Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Required</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Applies To</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rules</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No documents added yet
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{doc.name}</td>
                  <td className="px-4 py-3 text-sm">
                    {doc.is_required ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Required</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {doc.applies_to ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{doc.applies_to}</span>
                    ) : (
                      <span className="text-gray-400">All</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.rules || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(doc)} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-800">
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
  )
}

export default ProgramDocumentsTable

