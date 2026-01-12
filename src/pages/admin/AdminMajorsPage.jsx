import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import api from '../../services/api'
import MajorsTable from '../../components/admin/MajorsTable'

export default function AdminMajorsPage() {
  const [universities, setUniversities] = useState([])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MajorsTable universities={universities} onUpdate={() => {}} />
    </div>
  )
}
