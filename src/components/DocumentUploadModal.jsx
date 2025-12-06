import { useState, useEffect } from 'react'
import { X, Upload, FileText, Check } from 'lucide-react'
import api from '../services/api'

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'photo', label: 'White Background Photo' },
  { value: 'diploma', label: 'Highest Diploma' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'non_criminal', label: 'Non-Criminal Certificate' },
  { value: 'physical_exam', label: 'Physical Exam Form' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'recommendation_letter', label: 'Recommendation Letter' },
  { value: 'self_intro_video', label: 'Self-Introduction Video' },
]

export default function DocumentUploadModal({ onClose }) {
  const [selectedType, setSelectedType] = useState('passport')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState([])
  const [status, setStatus] = useState(null)
  
  useEffect(() => {
    loadDocuments()
  }, [])
  
  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents/')
      setDocuments(response.data)
      
      // Get status
      const statusResponse = await api.get('/students/documents/status')
      setStatus(statusResponse.data)
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }
  
  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', selectedType)
      
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      await loadDocuments()
      setFile(null)
      alert('Document uploaded successfully!')
    } catch (error) {
      alert(error.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Document Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {status && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Progress: {status.submitted} / {status.total} documents submitted
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(status.submitted / status.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Click to select file'}
                </span>
              </label>
            </div>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
        
        {documents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Uploaded Documents
            </h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.document_type}
                      </p>
                    </div>
                  </div>
                  {doc.verified && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

