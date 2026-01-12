import React, { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminAutomationPage() {
  const [automationForm, setAutomationForm] = useState({
    student_id: '',
    apply_url: '',
    username: '',
    password: '',
    portal_type: ''
  })
  const [automationRunning, setAutomationRunning] = useState(false)
  const [automationResult, setAutomationResult] = useState(null)

  const handleRunAutomation = async () => {
    if (!automationForm.student_id || !automationForm.apply_url) {
      alert('Please provide Student ID and Apply URL')
      return
    }

    setAutomationRunning(true)
    setAutomationResult(null)

    try {
      const response = await api.post('/admin/automation/run', {
        student_id: parseInt(automationForm.student_id),
        apply_url: automationForm.apply_url,
        username: automationForm.username || null,
        password: automationForm.password || null,
        portal_type: automationForm.portal_type || null
      })

      setAutomationResult(response.data)
      if (response.data.status === 'ok') {
        alert('Automation completed successfully! Check the logs and screenshot.')
      } else {
        alert(`Automation failed: ${response.data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Automation error:', error)
      setAutomationResult({
        status: 'error',
        error: error.response?.data?.detail || error.message
      })
      alert(`Automation failed: ${error.response?.data?.detail || error.message}`)
    } finally {
      setAutomationRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Application Automation</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Run Automation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
            <input
              type="number"
              value={automationForm.student_id}
              onChange={(e) => setAutomationForm({...automationForm, student_id: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apply URL *</label>
            <input
              type="url"
              value={automationForm.apply_url}
              onChange={(e) => setAutomationForm({...automationForm, apply_url: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
            <input
              type="text"
              value={automationForm.username}
              onChange={(e) => setAutomationForm({...automationForm, username: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (Optional)</label>
            <input
              type="password"
              value={automationForm.password}
              onChange={(e) => setAutomationForm({...automationForm, password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portal Type (Optional)</label>
            <input
              type="text"
              value={automationForm.portal_type}
              onChange={(e) => setAutomationForm({...automationForm, portal_type: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., cucas, studyinchina"
            />
          </div>
          <button
            onClick={handleRunAutomation}
            disabled={automationRunning}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {automationRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Automation
              </>
            )}
          </button>
        </div>
        {automationResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Result:</h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(automationResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
