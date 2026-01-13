import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2, Calendar } from 'lucide-react'
import api from '../../services/api'

export default function AdminCSCAExamsPage() {
  const [exams, setExams] = useState([])
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [examForm, setExamForm] = useState({
    csca_exam_date: '',
    csca_registration_deadline: '',
    csca_math_exam_fee_cny: '',
    csca_all_subject_fee_cny: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadExams()
  }, [upcomingOnly])

  const loadExams = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/admin/csca-exams?upcoming_only=${upcomingOnly}`)
      setExams(response.data || [])
    } catch (error) {
      console.error('Error loading CSCA exams:', error)
      alert(error.response?.data?.detail || 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExam = async () => {
    try {
      await api.post('/admin/csca-exams', examForm)
      alert('CSCA exam created successfully!')
      setShowExamForm(false)
      resetExamForm()
      loadExams()
    } catch (error) {
      console.error('Error creating exam:', error)
      alert(error.response?.data?.detail || 'Failed to create exam')
    }
  }

  const handleUpdateExam = async () => {
    try {
      await api.put(`/admin/csca-exams/${editingExam.id}`, examForm)
      alert('CSCA exam updated successfully!')
      setShowExamForm(false)
      setEditingExam(null)
      resetExamForm()
      loadExams()
    } catch (error) {
      console.error('Error updating exam:', error)
      alert(error.response?.data?.detail || 'Failed to update exam')
    }
  }

  const handleDeleteExam = async (id) => {
    if (!confirm('Are you sure you want to delete this CSCA exam?')) return
    try {
      await api.delete(`/admin/csca-exams/${id}`)
      alert('CSCA exam deleted successfully!')
      loadExams()
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert(error.response?.data?.detail || 'Failed to delete exam')
    }
  }

  const resetExamForm = () => {
    setExamForm({
      csca_exam_date: '',
      csca_registration_deadline: '',
      csca_math_exam_fee_cny: '',
      csca_all_subject_fee_cny: '',
      description: ''
    })
  }

  const startEditExam = (exam) => {
    setEditingExam(exam)
    setExamForm({
      csca_exam_date: exam.csca_exam_date ? exam.csca_exam_date.split('T')[0] : '',
      csca_registration_deadline: exam.csca_registration_deadline ? exam.csca_registration_deadline.split('T')[0] : '',
      csca_math_exam_fee_cny: exam.csca_math_exam_fee_cny || '',
      csca_all_subject_fee_cny: exam.csca_all_subject_fee_cny || '',
      description: exam.description || ''
    })
    setShowExamForm(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">CSCA Exams</h2>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => setUpcomingOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Upcoming Only</span>
          </label>
          <button
            onClick={() => {
              resetExamForm()
              setEditingExam(null)
              setShowExamForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Exam
          </button>
        </div>
      </div>

      {showExamForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingExam ? 'Edit' : 'Add'} CSCA Exam</h3>
            <button
              onClick={() => {
                setShowExamForm(false)
                setEditingExam(null)
                resetExamForm()
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Date *
              </label>
              <input
                type="date"
                value={examForm.csca_exam_date}
                onChange={(e) => setExamForm({ ...examForm, csca_exam_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Deadline *
              </label>
              <input
                type="date"
                value={examForm.csca_registration_deadline}
                onChange={(e) => setExamForm({ ...examForm, csca_registration_deadline: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Math Exam Fee (CNY) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={examForm.csca_math_exam_fee_cny}
                onChange={(e) => setExamForm({ ...examForm, csca_math_exam_fee_cny: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                All Subject Fee (CNY) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={examForm.csca_all_subject_fee_cny}
                onChange={(e) => setExamForm({ ...examForm, csca_all_subject_fee_cny: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows="3"
                placeholder="Additional notes or information about this exam"
              />
            </div>
            <div className="col-span-2 flex gap-3 pt-4">
              <button
                onClick={editingExam ? handleUpdateExam : handleCreateExam}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingExam ? 'Update' : 'Create'} Exam
              </button>
              <button
                onClick={() => {
                  setShowExamForm(false)
                  setEditingExam(null)
                  resetExamForm()
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Math Fee (CNY)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">All Subject Fee (CNY)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(exam.csca_exam_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(exam.csca_registration_deadline)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{exam.csca_math_exam_fee_cny?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{exam.csca_all_subject_fee_cny?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{exam.description || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditExam(exam)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No CSCA exams found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
