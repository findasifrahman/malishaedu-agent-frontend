import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminSettingsPage() {
  const [modelSettings, setModelSettings] = useState({ temperature: 0.7, top_k: 5, top_p: 1.0 })
  const [savingSettings, setSavingSettings] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadModelSettings()
  }, [])

  const loadModelSettings = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/settings')
      if (response.data) {
        setModelSettings({
          temperature: response.data.temperature || 0.7,
          top_k: response.data.top_k || 5,
          top_p: response.data.top_p || 1.0
        })
      }
    } catch (error) {
      console.error('Error loading model settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await api.put('/admin/settings', modelSettings)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={modelSettings.temperature}
                onChange={(e) => setModelSettings({...modelSettings, temperature: parseFloat(e.target.value)})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Top K</label>
              <input
                type="number"
                min="1"
                value={modelSettings.top_k}
                onChange={(e) => setModelSettings({...modelSettings, top_k: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Top P</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={modelSettings.top_p}
                onChange={(e) => setModelSettings({...modelSettings, top_p: parseFloat(e.target.value)})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
