import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/complaints')
      setComplaints(response.data)
    } catch (error) {
      console.error('Error loading complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{complaint.subject}</h3>
                <span className={`px-2 py-1 text-xs rounded ${
                  complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {complaint.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{complaint.message}</p>
              {complaint.admin_response && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                  <strong>Response:</strong> {complaint.admin_response}
                </div>
              )}
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              No complaints found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
