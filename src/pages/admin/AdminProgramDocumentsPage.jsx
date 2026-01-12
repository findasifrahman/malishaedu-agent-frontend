import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import api from '../../services/api'
import ProgramDocumentsTable from '../../components/admin/ProgramDocumentsTable'

export default function AdminProgramDocumentsPage() {
  const [universities, setUniversities] = useState([])
  const [majors, setMajors] = useState([])
  const [programIntakes, setProgramIntakes] = useState([])
  const [selectedIntakeForDocuments, setSelectedIntakeForDocuments] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUniversities()
    loadMajors()
    loadProgramIntakes()
  }, [])

  const loadUniversities = async () => {
    try {
      const response = await api.get('/universities')
      setUniversities(response.data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const loadMajors = async () => {
    try {
      const response = await api.get('/majors')
      setMajors(response.data || [])
    } catch (error) {
      console.error('Error loading majors:', error)
    }
  }

  const loadProgramIntakes = async () => {
    setLoading(true)
    try {
      const response = await api.get('/program-intakes')
      setProgramIntakes(response.data || [])
    } catch (error) {
      console.error('Error loading program intakes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Program Documents</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by University</label>
            <select
              value={selectedIntakeForDocuments?.university_id || ''}
              onChange={(e) => {
                const uniId = e.target.value ? parseInt(e.target.value) : null
                setSelectedIntakeForDocuments(prev => prev ? {...prev, university_id: uniId} : {university_id: uniId})
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Universities</option>
              {universities.map(uni => (
                <option key={uni.id} value={uni.id}>{uni.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Major</label>
            <select
              value={selectedIntakeForDocuments?.major_id || ''}
              onChange={(e) => {
                const majorId = e.target.value ? parseInt(e.target.value) : null
                setSelectedIntakeForDocuments(prev => prev ? {...prev, major_id: majorId} : {major_id: majorId})
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Majors</option>
              {majors.map(major => (
                <option key={major.id} value={major.id}>{major.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Intake</label>
            <select
              value={selectedIntakeForDocuments?.id || ''}
              onChange={(e) => {
                const intakeId = e.target.value ? parseInt(e.target.value) : null
                const intake = programIntakes.find(i => i.id === intakeId)
                setSelectedIntakeForDocuments(intake || null)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Intakes</option>
              {programIntakes.map(intake => (
                <option key={intake.id} value={intake.id}>
                  {intake.university_name} - {intake.major_name} ({intake.intake_term} {intake.intake_year})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <ProgramDocumentsTable
          selectedIntake={selectedIntakeForDocuments}
          onUpdate={() => loadProgramIntakes()}
        />
      )}
    </div>
  )
}
