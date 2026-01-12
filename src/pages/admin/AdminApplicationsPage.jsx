import React, { useState, useEffect } from 'react'
import { X, Play, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [universities, setUniversities] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [applicationFilters, setApplicationFilters] = useState({
    status: '',
    university_id: '',
    student_id: ''
  })
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationUpdateForm, setApplicationUpdateForm] = useState({
    status: '',
    admin_notes: '',
    result: '',
    result_notes: '',
    application_fee_paid: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUniversities()
    loadApplications()
  }, [])

  useEffect(() => {
    loadApplications()
  }, [applicationFilters])

  const loadUniversities = async () => {
    try {
      const response = await api.get('/universities')
      setUniversities(response.data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const loadApplications = async () => {
    setLoading(true)
    try {
      let url = '/admin/applications?'
      if (applicationFilters.status) url += `status=${applicationFilters.status}&`
      if (applicationFilters.university_id) url += `university_id=${applicationFilters.university_id}&`
      if (applicationFilters.student_id) url += `student_id=${applicationFilters.student_id}&`
      const response = await api.get(url)
      setApplications(response.data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewApplication = async (applicationId) => {
    try {
      const response = await api.get(`/admin/applications/${applicationId}`)
      setSelectedApplication(response.data)
      setApplicationUpdateForm({
        status: response.data.status,
        admin_notes: response.data.admin_notes || '',
        result: response.data.result || '',
        result_notes: response.data.result_notes || '',
        application_fee_paid: response.data.application_fee_paid || false
      })
      setShowApplicationModal(true)
    } catch (error) {
      console.error('Error loading application details:', error)
      alert('Failed to load application details')
    }
  }

  const handleUpdateApplication = async () => {
    try {
      await api.put(`/admin/applications/${selectedApplication.id}`, applicationUpdateForm)
      alert('Application updated successfully')
      setShowApplicationModal(false)
      setSelectedApplication(null)
      loadApplications()
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update application')
    }
  }

  const handleOpenAutomationForApplication = (application) => {
    // Navigate to automation page with pre-filled data
    window.location.href = `/admin/automation?student_id=${application.student_id}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Student Applications</h2>
        <button
          onClick={loadApplications}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full sm:w-auto"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={applicationFilters.status}
              onChange={(e) => {
                setApplicationFilters({...applicationFilters, status: e.target.value})
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
            <select
              value={applicationFilters.university_id}
              onChange={(e) => {
                setApplicationFilters({...applicationFilters, university_id: e.target.value})
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Universities</option>
              {universities.map(uni => (
                <option key={uni.id} value={uni.id}>{uni.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="number"
              value={applicationFilters.student_id}
              onChange={(e) => {
                setApplicationFilters({...applicationFilters, student_id: e.target.value})
              }}
              placeholder="Filter by student ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[1000px] px-3 sm:px-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">University</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Major</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intake</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">#{app.id}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{app.student_name || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{app.student_email || ''}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{app.university_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{app.major_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {app.intake_term} {app.intake_year}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          app.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {app.application_fee ? `${app.application_fee} RMB` : '-'}
                        {app.application_fee_paid && (
                          <span className="ml-2 text-green-600 text-xs">✓ Paid</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewApplication(app.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View/Edit
                          </button>
                          <button
                            onClick={() => handleOpenAutomationForApplication(app)}
                            className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                            title="Run Application Automation"
                          >
                            <Play className="w-4 h-4" />
                            Auto-Fill
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        No applications found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                Application #{selectedApplication.id} Details
              </h3>
              <button
                onClick={() => {
                  setShowApplicationModal(false)
                  setSelectedApplication(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                  <div><strong>Name:</strong> {selectedApplication.student?.full_name || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedApplication.student?.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedApplication.student?.phone || 'N/A'}</div>
                  <div><strong>Country:</strong> {selectedApplication.student?.country || 'N/A'}</div>
                </div>
              </div>

              {/* Program Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Program Information</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                  <div><strong>University:</strong> {selectedApplication.program_intake?.university_name}</div>
                  <div><strong>Major:</strong> {selectedApplication.program_intake?.major_name}</div>
                  <div><strong>Intake:</strong> {selectedApplication.program_intake?.intake_term} {selectedApplication.program_intake?.intake_year}</div>
                  <div><strong>Application Fee:</strong> {selectedApplication.program_intake?.application_fee || 0} RMB</div>
                  <div><strong>Tuition (per year):</strong> {selectedApplication.program_intake?.tuition_per_year || 'N/A'}</div>
                </div>
              </div>

              {/* Application Status Update */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Update Application Status</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={applicationUpdateForm.status}
                      onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                    <input
                      type="text"
                      value={applicationUpdateForm.result}
                      onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, result: e.target.value})}
                      placeholder="e.g., Accepted, Rejected, Waitlisted"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                    <textarea
                      value={applicationUpdateForm.admin_notes}
                      onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, admin_notes: e.target.value})}
                      placeholder="Internal notes about this application"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result Notes</label>
                    <textarea
                      value={applicationUpdateForm.result_notes}
                      onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, result_notes: e.target.value})}
                      placeholder="Notes about the result (visible to student)"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fee_paid"
                      checked={applicationUpdateForm.application_fee_paid}
                      onChange={(e) => setApplicationUpdateForm({...applicationUpdateForm, application_fee_paid: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <label htmlFor="fee_paid" className="text-sm text-gray-700">
                      Application fee paid
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleUpdateApplication}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowApplicationModal(false)
                    setSelectedApplication(null)
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
