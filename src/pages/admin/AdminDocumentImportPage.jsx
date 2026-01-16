import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminDocumentImportPage() {
  const [documentImportFile, setDocumentImportFile] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [extractionProgress, setExtractionProgress] = useState('')
  const [ingestingData, setIngestingData] = useState(false)
  const [ingestionResult, setIngestionResult] = useState(null)

  const handleFileUpload = async () => {
    if (!documentImportFile) {
      alert('Please select a file')
      return
    }

    setExtractionProgress('Extracting data...')
    try {
      const formData = new FormData()
      formData.append('file', documentImportFile)

      const response = await api.post('/admin/document-import/extract-data-start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setExtractionProgress(`Uploading: ${percentCompleted}%`)
        }
      })

      setExtractedData(response.data)
      setExtractionProgress('')
      alert('Data extracted successfully! Review and ingest below.')
    } catch (error) {
      console.error('Error extracting data:', error)
      setExtractionProgress('')
      alert(error.response?.data?.detail || 'Failed to extract data')
    }
  }

  const handleIngestData = async () => {
    if (!extractedData) {
      alert('No extracted data to ingest')
      return
    }

    setIngestingData(true)
    try {
      const response = await api.post('/admin/document-import/ingest', extractedData)
      setIngestionResult(response.data)
      alert('Data ingested successfully!')
    } catch (error) {
      console.error('Error ingesting data:', error)
      alert(error.response?.data?.detail || 'Failed to ingest data')
    } finally {
      setIngestingData(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Document Import</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Document</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <input
              type="file"
              onChange={(e) => setDocumentImportFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          {extractionProgress && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              {extractionProgress}
            </div>
          )}
          <button
            onClick={handleFileUpload}
            disabled={!documentImportFile || !!extractionProgress}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Extract Data
          </button>
        </div>
      </div>

      {extractedData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Data</h3>
          <div className="mb-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">
              {JSON.stringify(extractedData, null, 2)}
            </pre>
          </div>
          <button
            onClick={handleIngestData}
            disabled={ingestingData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {ingestingData ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ingesting...
              </>
            ) : (
              'Ingest Data'
            )}
          </button>
          {ingestionResult && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Ingestion Result:</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(ingestionResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
