import React, { useState, useEffect } from 'react'
import { FileText, Trash2, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function AdminRagPage() {
  const [ragDocuments, setRagDocuments] = useState([])
  const [ragFile, setRagFile] = useState(null)
  const [ragText, setRagText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [ragUploadMetadata, setRagUploadMetadata] = useState({
    doc_type: 'b2c_study',
    audience: 'student',
    version: '',
    source_url: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRAGDocuments()
  }, [])

  const loadRAGDocuments = async () => {
    setLoading(true)
    try {
      const response = await api.get('/rag/documents')
      setRagDocuments(response.data || [])
    } catch (error) {
      console.error('Error loading RAG documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRAGUpload = async () => {
    if (!ragFile && !ragText.trim()) {
      alert('Please provide either a file or text content')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      if (ragFile) formData.append('file', ragFile)
      if (ragText.trim()) formData.append('text', ragText)
      formData.append('doc_type', ragUploadMetadata.doc_type)
      formData.append('audience', ragUploadMetadata.audience)
      if (ragUploadMetadata.version) formData.append('version', ragUploadMetadata.version)
      if (ragUploadMetadata.source_url) formData.append('source_url', ragUploadMetadata.source_url)

      await api.post('/rag/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('RAG document uploaded and processed successfully!')
      setRagFile(null)
      setRagText('')
      loadRAGDocuments()
    } catch (error) {
      console.error('Error uploading RAG document:', error)
      alert(error.response?.data?.detail || 'Failed to upload RAG document')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteRAGDocument = async (id) => {
    if (!confirm('Are you sure you want to delete this RAG document?')) return
    try {
      await api.delete(`/rag/documents/${id}`)
      alert('RAG document deleted successfully!')
      loadRAGDocuments()
    } catch (error) {
      console.error('Error deleting RAG document:', error)
      alert(error.response?.data?.detail || 'Failed to delete RAG document')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">RAG Documents Management</h2>
        <button
          onClick={loadRAGDocuments}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full sm:w-auto"
        >
          Refresh
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New RAG Document</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
              <select
                value={ragUploadMetadata.doc_type}
                onChange={(e) => setRagUploadMetadata({...ragUploadMetadata, doc_type: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="csca">CSCA</option>
                <option value="b2c_study">B2C Study</option>
                <option value="b2b_partner">B2B Partner</option>
                <option value="people_contact">People/Contact</option>
                <option value="service_policy">Service Policy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience *</label>
              <select
                value={ragUploadMetadata.audience}
                onChange={(e) => setRagUploadMetadata({...ragUploadMetadata, audience: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="student">Student</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version (Optional)</label>
              <input
                type="text"
                value={ragUploadMetadata.version}
                onChange={(e) => setRagUploadMetadata({...ragUploadMetadata, version: e.target.value})}
                placeholder="e.g., 2026, v1.0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source URL (Optional)</label>
              <input
                type="url"
                value={ragUploadMetadata.source_url}
                onChange={(e) => setRagUploadMetadata({...ragUploadMetadata, source_url: e.target.value})}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter Plain Text</label>
            <textarea
              value={ragText}
              onChange={(e) => setRagText(e.target.value)}
              placeholder="Enter text content here..."
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Or Select File (PDF, DOCX, TXT, CSV)</label>
            <input
              type="file"
              onChange={(e) => setRagFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.txt,.csv"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <button
            onClick={handleRAGUpload}
            disabled={(!ragFile && !ragText.trim()) || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading & Processing...' : 'Upload & Process'}
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">Existing RAG Documents</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[900px] px-3 sm:px-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Audience</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Version</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Chunks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ragDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{doc.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{doc.doc_type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{doc.audience}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.version || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          doc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.chunk_count || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteRAGDocument(doc.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ragDocuments.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        No RAG documents found. Upload one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
