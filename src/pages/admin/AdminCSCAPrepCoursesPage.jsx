import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2, Calendar } from 'lucide-react'
import api from '../../services/api'

export default function AdminCSCAPrepCoursesPage() {
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedExamId, setSelectedExamId] = useState('')
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [courseForm, setCourseForm] = useState({
    exam_id: '',
    start_date: '',
    end_date: '',
    course_description: '',
    fee_cny: '',
    register_before_date: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadExams()
    loadCourses()
  }, [selectedExamId, upcomingOnly])

  const loadExams = async () => {
    try {
      const response = await api.get('/admin/csca-exams?upcoming_only=false')
      setExams(response.data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
    }
  }

  const loadCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedExamId) params.append('exam_id', selectedExamId)
      if (upcomingOnly) params.append('upcoming_only', 'true')
      const response = await api.get(`/admin/csca-prep-courses?${params.toString()}`)
      setCourses(response.data || [])
    } catch (error) {
      console.error('Error loading prep courses:', error)
      alert(error.response?.data?.detail || 'Failed to load prep courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async () => {
    try {
      await api.post('/admin/csca-prep-courses', courseForm)
      alert('Prep course created successfully!')
      setShowCourseForm(false)
      resetCourseForm()
      loadCourses()
    } catch (error) {
      console.error('Error creating prep course:', error)
      alert(error.response?.data?.detail || 'Failed to create prep course')
    }
  }

  const handleUpdateCourse = async () => {
    try {
      await api.put(`/admin/csca-prep-courses/${editingCourse.id}`, courseForm)
      alert('Prep course updated successfully!')
      setShowCourseForm(false)
      setEditingCourse(null)
      resetCourseForm()
      loadCourses()
    } catch (error) {
      console.error('Error updating prep course:', error)
      alert(error.response?.data?.detail || 'Failed to update prep course')
    }
  }

  const handleDeleteCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this prep course?')) return
    try {
      await api.delete(`/admin/csca-prep-courses/${id}`)
      alert('Prep course deleted successfully!')
      loadCourses()
    } catch (error) {
      console.error('Error deleting prep course:', error)
      alert(error.response?.data?.detail || 'Failed to delete prep course')
    }
  }

  const resetCourseForm = () => {
    setCourseForm({
      exam_id: '',
      start_date: '',
      end_date: '',
      course_description: '',
      fee_cny: '',
      register_before_date: ''
    })
  }

  const startEditCourse = (course) => {
    setEditingCourse(course)
    setCourseForm({
      exam_id: course.exam_id || '',
      start_date: course.start_date ? course.start_date.split('T')[0] : '',
      end_date: course.end_date ? course.end_date.split('T')[0] : '',
      course_description: course.course_description || '',
      fee_cny: course.fee_cny || '',
      register_before_date: course.register_before_date ? course.register_before_date.split('T')[0] : ''
    })
    setShowCourseForm(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">CSCA Prep Courses</h2>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {formatDate(exam.csca_exam_date)}
              </option>
            ))}
          </select>
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
              resetCourseForm()
              setEditingCourse(null)
              setShowCourseForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {showCourseForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingCourse ? 'Edit' : 'Add'} Prep Course</h3>
            <button
              onClick={() => {
                setShowCourseForm(false)
                setEditingCourse(null)
                resetCourseForm()
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Exam *
              </label>
              <select
                value={courseForm.exam_id}
                onChange={(e) => setCourseForm({ ...courseForm, exam_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Select Exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {formatDate(exam.csca_exam_date)} - {exam.csca_registration_deadline ? formatDate(exam.csca_registration_deadline) : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={courseForm.start_date}
                onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={courseForm.end_date}
                onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Register Before Date *
              </label>
              <input
                type="date"
                value={courseForm.register_before_date}
                onChange={(e) => setCourseForm({ ...courseForm, register_before_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Fee (CNY) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={courseForm.fee_cny}
                onChange={(e) => setCourseForm({ ...courseForm, fee_cny: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Description
              </label>
              <textarea
                value={courseForm.course_description}
                onChange={(e) => setCourseForm({ ...courseForm, course_description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows="3"
                placeholder="Course details, curriculum, etc."
              />
            </div>
            <div className="col-span-2 flex gap-3 pt-4">
              <button
                onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingCourse ? 'Update' : 'Create'} Course
              </button>
              <button
                onClick={() => {
                  setShowCourseForm(false)
                  setEditingCourse(null)
                  resetCourseForm()
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register Before</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee (CNY)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(course.exam_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(course.start_date)} - {formatDate(course.end_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(course.register_before_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{course.fee_cny?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{course.course_description || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditCourse(course)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No prep courses found
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
