import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState([])
  const [showUniversityForm, setShowUniversityForm] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState(null)
  const [universityForm, setUniversityForm] = useState({
    name: '', name_cn: '', city: '', province: '', country: 'China', is_partner: true,
    university_ranking: '', world_ranking_band: '', national_ranking: '',
    aliases: '', project_tags: '', default_currency: 'CNY', is_active: true,
    logo_url: '', description: '', website: '', contact_email: '', contact_wechat: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUniversities()
  }, [])

  const loadUniversities = async () => {
    setLoading(true)
    try {
      const response = await api.get('/universities')
      setUniversities(response.data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUniversity = async () => {
    try {
      await api.post('/universities', universityForm)
      alert('University created successfully!')
      setShowUniversityForm(false)
      resetUniversityForm()
      loadUniversities()
    } catch (error) {
      console.error('Error creating university:', error)
      alert(error.response?.data?.detail || 'Failed to create university')
    }
  }

  const handleUpdateUniversity = async () => {
    try {
      await api.put(`/universities/${editingUniversity.id}`, universityForm)
      alert('University updated successfully!')
      setShowUniversityForm(false)
      setEditingUniversity(null)
      resetUniversityForm()
      loadUniversities()
    } catch (error) {
      console.error('Error updating university:', error)
      alert(error.response?.data?.detail || 'Failed to update university')
    }
  }

  const handleDeleteUniversity = async (id) => {
    if (!confirm('Are you sure you want to delete this university?')) return
    try {
      await api.delete(`/universities/${id}`)
      alert('University deleted successfully!')
      loadUniversities()
    } catch (error) {
      console.error('Error deleting university:', error)
      alert(error.response?.data?.detail || 'Failed to delete university')
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

  const startEditUniversity = (uni) => {
    setEditingUniversity(uni)
    setUniversityForm({
      name: uni.name || '',
      name_cn: uni.name_cn || '',
      city: uni.city || '',
      province: uni.province || '',
      country: uni.country || 'China',
      is_partner: uni.is_partner !== undefined ? uni.is_partner : true,
      university_ranking: uni.university_ranking || '',
      world_ranking_band: uni.world_ranking_band || '',
      national_ranking: uni.national_ranking || '',
      aliases: uni.aliases || '',
      project_tags: uni.project_tags || '',
      default_currency: uni.default_currency || 'CNY',
      is_active: uni.is_active !== undefined ? uni.is_active : true,
      logo_url: uni.logo_url || '',
      description: uni.description || '',
      website: uni.website || '',
      contact_email: uni.contact_email || '',
      contact_wechat: uni.contact_wechat || ''
    })
    setShowUniversityForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Universities</h2>
        <button
          onClick={() => {
            resetUniversityForm()
            setEditingUniversity(null)
            setShowUniversityForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add University
        </button>
      </div>

      {showUniversityForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingUniversity ? 'Edit' : 'Add'} University</h3>
            <button onClick={() => { setShowUniversityForm(false); setEditingUniversity(null); resetUniversityForm() }} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={universityForm.name} onChange={(e) => setUniversityForm({...universityForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Chinese)</label>
              <input type="text" value={universityForm.name_cn} onChange={(e) => setUniversityForm({...universityForm, name_cn: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input type="url" value={universityForm.logo_url} onChange={(e) => setUniversityForm({...universityForm, logo_url: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="https://example.com/logo.png" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University Ranking</label>
              <input type="number" value={universityForm.university_ranking} onChange={(e) => setUniversityForm({...universityForm, university_ranking: e.target.value ? parseInt(e.target.value) : ''})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">World Ranking Band</label>
              <input type="text" value={universityForm.world_ranking_band} onChange={(e) => setUniversityForm({...universityForm, world_ranking_band: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 301-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">National Ranking</label>
              <input type="number" value={universityForm.national_ranking} onChange={(e) => setUniversityForm({...universityForm, national_ranking: e.target.value ? parseInt(e.target.value) : ''})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select value={universityForm.default_currency} onChange={(e) => setUniversityForm({...universityForm, default_currency: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="CNY">CNY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={universityForm.description} onChange={(e) => setUniversityForm({...universityForm, description: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="University description..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" value={universityForm.website} onChange={(e) => setUniversityForm({...universityForm, website: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="https://example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={universityForm.contact_email} onChange={(e) => setUniversityForm({...universityForm, contact_email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="contact@university.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WeChat</label>
              <input type="text" value={universityForm.contact_wechat} onChange={(e) => setUniversityForm({...universityForm, contact_wechat: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="WeChat ID" />
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
                  {universities.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No universities found
                      </td>
                    </tr>
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
