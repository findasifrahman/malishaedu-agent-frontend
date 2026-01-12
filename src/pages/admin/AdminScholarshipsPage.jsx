import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminScholarshipsPage() {
  const [scholarships, setScholarships] = useState([])
  const [showScholarshipForm, setShowScholarshipForm] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState(null)
  const [scholarshipForm, setScholarshipForm] = useState({
    name: '', provider: '', notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadScholarships()
  }, [])

  const loadScholarships = async () => {
    setLoading(true)
    try {
      const response = await api.get('/scholarships')
      setScholarships(response.data || [])
    } catch (error) {
      console.error('Error loading scholarships:', error)
      setScholarships([])
    } finally {
      setLoading(false)
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
      alert(error.response?.data?.detail || 'Failed to create scholarship')
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
      alert(error.response?.data?.detail || 'Failed to update scholarship')
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
      alert(error.response?.data?.detail || 'Failed to delete scholarship')
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Scholarships</h2>
        <button
          onClick={() => {
            setEditingScholarship(null)
            setScholarshipForm({ name: '', provider: '', notes: '' })
            setShowScholarshipForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Scholarship
        </button>
      </div>

      {/* Add/Edit Scholarship Form */}
      {showScholarshipForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingScholarship ? 'Edit' : 'Add'} Scholarship</h3>
            <button onClick={cancelEditScholarship} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={scholarshipForm.name}
                onChange={(e) => setScholarshipForm({...scholarshipForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., CSC, HuaShan, Freshman Scholarship"
                required
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={scholarshipForm.notes}
                onChange={(e) => setScholarshipForm({...scholarshipForm, notes: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Additional notes about the scholarship"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
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
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[800px] px-3 sm:px-0">
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
                      <tr key={scholarship.id} className="hover:bg-gray-50">
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
        </div>
      )}
    </div>
  )
}
