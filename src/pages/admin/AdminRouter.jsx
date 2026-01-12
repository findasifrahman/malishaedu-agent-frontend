import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import AdminOverviewPage from './AdminOverviewPage'
import AdminLeadsPage from './AdminLeadsPage'
import AdminComplaintsPage from './AdminComplaintsPage'
import AdminChatPage from './AdminChatPage'
import AdminUsersPage from './AdminUsersPage'
import AdminStudentsPage from './AdminStudentsPage'
import AdminApplicationsPage from './AdminApplicationsPage'
import AdminUniversitiesPage from './AdminUniversitiesPage'
import AdminMajorsPage from './AdminMajorsPage'
import AdminIntakesPage from './AdminIntakesPage'
import AdminProgramDocumentsPage from './AdminProgramDocumentsPage'
import AdminRagPage from './AdminRagPage'
import AdminScholarshipsPage from './AdminScholarshipsPage'
import AdminPartnersPage from './AdminPartnersPage'
import AdminOpsUsersPage from './AdminOpsUsersPage'
import AdminSettingsPage from './AdminSettingsPage'
import AdminAutomationPage from './AdminAutomationPage'
import AdminDocumentImportPage from './AdminDocumentImportPage'

const routeTitles = {
  '/admin': 'Dashboard',
  '/admin/leads': 'Leads',
  '/admin/complaints': 'Complaints',
  '/admin/chat': 'Chat',
  '/admin/users': 'Users',
  '/admin/students': 'Students',
  '/admin/applications': 'Applications',
  '/admin/universities': 'Universities',
  '/admin/majors': 'Majors',
  '/admin/intakes': 'Program Intakes',
  '/admin/program-documents': 'Program Documents',
  '/admin/rag': 'RAG Upload',
  '/admin/scholarships': 'Scholarships',
  '/admin/partners': 'Partners',
  '/admin/ops-users': 'Ops Users',
  '/admin/settings': 'Settings',
  '/admin/automation': 'Automation',
  '/admin/document-import': 'Document Import',
}

export default function AdminRouter() {
  const location = useLocation()
  const title = routeTitles[location.pathname] || 'Admin'

  return (
    <AdminLayout title={title}>
      <Routes>
        <Route index element={<AdminOverviewPage />} />
        <Route path="leads" element={<AdminLeadsPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="chat" element={<AdminChatPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="universities" element={<AdminUniversitiesPage />} />
        <Route path="majors" element={<AdminMajorsPage />} />
        <Route path="intakes" element={<AdminIntakesPage />} />
        <Route path="program-documents" element={<AdminProgramDocumentsPage />} />
        <Route path="rag" element={<AdminRagPage />} />
        <Route path="scholarships" element={<AdminScholarshipsPage />} />
        <Route path="partners" element={<AdminPartnersPage />} />
        <Route path="ops-users" element={<AdminOpsUsersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="automation" element={<AdminAutomationPage />} />
        <Route path="document-import" element={<AdminDocumentImportPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}
