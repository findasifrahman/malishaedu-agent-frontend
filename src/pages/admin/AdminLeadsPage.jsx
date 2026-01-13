import React, { useState, useEffect } from 'react'
import { Loader2, Search, Calendar, User, Phone, Mail, MapPin, Building2, GraduationCap, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react'
import api from '../../services/api'

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateRange, setDateRange] = useState('today')
  const [statusFilter, setStatusFilter] = useState('')
  const [leadTypeFilter, setLeadTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadLeads()
  }, [page, dateRange, statusFilter, leadTypeFilter, searchQuery, startDate, endDate])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('page_size', '20')
      if (dateRange !== 'custom') {
        params.append('date_range', dateRange)
      } else if (startDate && endDate) {
        params.append('date_range', 'custom')
        params.append('start_date', startDate)
        params.append('end_date', endDate)
      }
      if (statusFilter) params.append('status', statusFilter)
      if (leadTypeFilter) params.append('lead_type', leadTypeFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await api.get(`/admin/leads?${params.toString()}`)
      setLeads(response.data.leads || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (error) {
      console.error('Error loading leads:', error)
      alert(error.response?.data?.detail || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (leadId, newStatus) => {
    try {
      await api.put(`/admin/leads/${leadId}`, { status: newStatus })
      loadLeads()
    } catch (error) {
      console.error('Error updating lead status:', error)
      alert(error.response?.data?.detail || 'Failed to update lead status')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      new: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'New' },
      contacted: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Contacted' },
      converted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Converted' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' }
    }
    const badge = badges[status] || badges.new
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getLeadTypeBadge = (leadType) => {
    const badges = {
      university: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'University' },
      csca_exam: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'CSCA Exam' },
      csca_prep: { bg: 'bg-pink-100', text: 'text-pink-800', label: 'CSCA Prep' },
      mixed: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Mixed' }
    }
    const badge = badges[leadType] || badges.university
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setPage(1)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setPage(1)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </>
          )}

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Lead Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Type</label>
            <select
              value={leadTypeFilter}
              onChange={(e) => {
                setLeadTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="university">University</option>
              <option value="csca_exam">CSCA Exam</option>
              <option value="csca_prep">CSCA Prep</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by phone, name, or chat session ID..."
                className="w-full border border-gray-300 rounded-lg px-10 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Leads Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">{lead.name || 'No Name'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(lead.status || 'new')}
                      {getLeadTypeBadge(lead.lead_type || 'university')}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  {lead.country && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{lead.country}</span>
                    </div>
                  )}
                </div>

                {/* Interest Details */}
                <div className="space-y-2 mb-4 text-sm">
                  {lead.university_name && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{lead.university_name}</span>
                    </div>
                  )}
                  {lead.major_name && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span>{lead.major_name}</span>
                    </div>
                  )}
                  {lead.exam_date && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>CSCA Exam: {formatDate(lead.exam_date)}</span>
                    </div>
                  )}
                  {lead.prep_course_start && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Prep Course: {formatDate(lead.prep_course_start)}</span>
                    </div>
                  )}
                  {lead.intake_term && (
                    <div className="text-gray-600">
                      Intake: {lead.intake_term} {lead.intake_year || ''}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {lead.notes && (
                  <div className="mb-4 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    {lead.notes.length > 100 ? `${lead.notes.substring(0, 100)}...` : lead.notes}
                  </div>
                )}

                {/* CSCA Interest Notes */}
                {lead.csca_interest_notes && (
                  <div className="mb-4 p-2 bg-orange-50 rounded text-sm text-gray-700">
                    <strong>CSCA Notes:</strong> {lead.csca_interest_notes.length > 80 ? `${lead.csca_interest_notes.substring(0, 80)}...` : lead.csca_interest_notes}
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(lead.created_at)} {formatTime(lead.created_at)}</span>
                  </div>
                  {lead.chat_session_id && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageSquare className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{lead.chat_session_id}</span>
                    </div>
                  )}
                </div>

                {/* Quick Status Update */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-2 flex-wrap">
                    {lead.status !== 'contacted' && (
                      <button
                        onClick={() => handleStatusUpdate(lead.id, 'contacted')}
                        className="flex-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                      >
                        Contacted
                      </button>
                    )}
                    {lead.status !== 'converted' && (
                      <button
                        onClick={() => handleStatusUpdate(lead.id, 'converted')}
                        className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Converted
                      </button>
                    )}
                    {lead.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusUpdate(lead.id, 'closed')}
                        className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leads.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No leads found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
