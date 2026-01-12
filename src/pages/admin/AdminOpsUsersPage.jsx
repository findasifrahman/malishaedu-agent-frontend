import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminOpsUsersPage() {
  const [opsUsers, setOpsUsers] = useState([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOpsUsers()
  }, [])

  const loadOpsUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/ops-users')
      setOpsUsers(response.data || [])
    } catch (error) {
      console.error('Error loading OPS users:', error)
      setOpsUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      alert('Name, email, and password are required')
      return
    }
    try {
      await api.post('/admin/ops-users', {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim() || null,
        password: userForm.password
      })
      alert('OPS user created successfully!')
      setShowUserForm(false)
      resetUserForm()
      loadOpsUsers()
    } catch (error) {
      console.error('Error creating OPS user:', error)
      alert(error.response?.data?.detail || 'Failed to create OPS user')
    }
  }

  const handleUpdateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert('Name and email are required')
      return
    }
    try {
      const updateData = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim() || null
      }
      if (userForm.password.trim()) {
        updateData.password = userForm.password
      }
      await api.put(`/admin/ops-users/${editingUser.id}`, updateData)
      alert('OPS user updated successfully!')
      setShowUserForm(false)
      setEditingUser(null)
      resetUserForm()
      loadOpsUsers()
    } catch (error) {
      console.error('Error updating OPS user:', error)
      alert(error.response?.data?.detail || 'Failed to update OPS user')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this OPS user?')) {
      return
    }
    try {
      await api.delete(`/admin/ops-users/${id}`)
      alert('OPS user deleted successfully!')
      loadOpsUsers()
    } catch (error) {
      console.error('Error deleting OPS user:', error)
      alert(error.response?.data?.detail || 'Failed to delete OPS user')
    }
  }

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: ''
    })
  }

  const startEditUser = (user) => {
    setEditingUser(user)
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: ''
    })
    setShowUserForm(true)
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Ops Users</h2>
          <button
            onClick={() => {
              resetUserForm()
              setEditingUser(null)
              setShowUserForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Ops User
          </button>
        </div>

        {/* Add/Edit User Form */}
        {showUserForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingUser ? 'Edit' : 'Add'} Ops User</h3>
              <button onClick={() => { setShowUserForm(false); setEditingUser(null); resetUserForm() }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingUser ? '(leave empty to keep current)' : '*'}</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required={!editingUser} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button onClick={editingUser ? handleUpdateUser : handleCreateUser} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button onClick={() => { setShowUserForm(false); setEditingUser(null); resetUserForm() }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[600px] px-3 sm:px-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {opsUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          No OPS users found. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      opsUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button onClick={() => startEditUser(user)} className="text-blue-600 hover:text-blue-800">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800">
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
