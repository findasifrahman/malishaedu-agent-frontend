import React, { useState, useEffect } from 'react'
import { Plus, Edit, X, Loader2, User as UserIcon } from 'lucide-react'
import api from '../../services/api'

export default function AdminStudentsPage() {
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentsSearchDebounced(studentsSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [studentsSearch])

  useEffect(() => {
    loadStudents(1, studentsSearchDebounced)
  }, [studentsSearchDebounced])

  const loadStudents = async (page = studentsPage, search = studentsSearchDebounced) => {
    setLoading(true)
    try {
      const response = await api.get(`/admin/students?page=${page}&page_size=${studentsPageSize}&search=${encodeURIComponent(search || '')}`)
      setStudents(response.data.items || [])
      setStudentsTotal(response.data.total || 0)
      setStudentsPage(page)
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([])
    } finally {
      setLoading(false)
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
      password: '',
      full_name: student.full_name || '',
      phone: student.phone || '',
      country_of_citizenship: student.country_of_citizenship || '',
      passport_number: student.passport_number || ''
    })
    setShowStudentModal(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Students</h2>
        <button
          onClick={() => {
            resetStudentForm()
            setEditingStudent(null)
            setShowStudentModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by name, email, phone, passport, or country..."
          value={studentsSearch}
          onChange={(e) => setStudentsSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

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
            </div>
          </div>

          {/* Pagination */}
          {studentsTotal > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 gap-4">
              <div className="text-sm text-gray-700">
                Showing {(studentsPage - 1) * studentsPageSize + 1} to {Math.min(studentsPage * studentsPageSize, studentsTotal)} of {studentsTotal} students
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadStudents(studentsPage - 1, studentsSearchDebounced)}
                  disabled={studentsPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {studentsPage} of {Math.ceil(studentsTotal / studentsPageSize)}
                </span>
                <button
                  onClick={() => loadStudents(studentsPage + 1, studentsSearchDebounced)}
                  disabled={studentsPage >= Math.ceil(studentsTotal / studentsPageSize) || loading}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
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
  )
}
