import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([])
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)
  const [partnerForm, setPartnerForm] = useState({
    name: '', company_name: '', phone1: '', phone2: '', email: '', city: '', country: '',
    full_address: '', website: '', notes: '', password: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    try {
      const response = await api.get('/partners')
      setPartners(response.data || [])
    } catch (error) {
      console.error('Error loading partners:', error)
      setPartners([])
    } finally {
      setLoading(false)
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
      password: ''
    })
    setShowPartnerForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Partners</h2>
        <button
          onClick={() => {
            resetPartnerForm()
            setEditingPartner(null)
            setShowPartnerForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

      {/* Add/Edit Partner Form */}
      {showPartnerForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingPartner ? 'Edit' : 'Add'} Partner</h3>
            <button onClick={() => { setShowPartnerForm(false); setEditingPartner(null); resetPartnerForm() }} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea value={partnerForm.full_address} onChange={(e) => setPartnerForm({...partnerForm, full_address: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" value={partnerForm.website} onChange={(e) => setPartnerForm({...partnerForm, website: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={partnerForm.notes} onChange={(e) => setPartnerForm({...partnerForm, notes: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div className="md:col-span-2 flex gap-2">
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
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[900px] px-3 sm:px-0">
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
                      <tr key={partner.id} className="hover:bg-gray-50">
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
        </div>
      )}
    </div>
  )
}
