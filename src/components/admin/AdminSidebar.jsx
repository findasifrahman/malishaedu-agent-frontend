import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Users,
  MessageSquare,
  MessageCircle,
  User as UserIcon,
  FileText,
  Building2,
  GraduationCap,
  Calendar,
  Upload,
  Settings,
  Bot,
  LogOut,
  Loader2,
  Home,
  BookOpen,
  ClipboardList
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/admin', label: 'Overview', icon: BarChart3 },
    { path: '/admin/leads', label: 'Leads', icon: Users },
    { path: '/admin/csca-exams', label: 'CSCA Exams', icon: BookOpen },
    { path: '/admin/csca-prep-courses', label: 'CSCA Prep Courses', icon: ClipboardList },
    { path: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
    { path: '/admin/chat', label: 'Chat', icon: MessageCircle },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/students', label: 'Students', icon: UserIcon },
    { path: '/admin/applications', label: 'Applications', icon: FileText },
    { path: '/admin/universities', label: 'Universities', icon: Building2 },
    { path: '/admin/majors', label: 'Majors', icon: GraduationCap },
    { path: '/admin/intakes', label: 'Program Intakes', icon: Calendar },
    { path: '/admin/program-documents', label: 'Program Documents', icon: FileText },
    { path: '/admin/rag', label: 'RAG Upload', icon: Upload },
    { path: '/admin/scholarships', label: 'Scholarships', icon: GraduationCap },
    { path: '/admin/partners', label: 'Partners', icon: Users },
    { path: '/admin/ops-users', label: 'Ops Users', icon: Users },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
    { path: '/admin/automation', label: 'Automation', icon: Bot },
    { path: '/admin/document-import', label: 'Document Import', icon: Upload },
  ]

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:static lg:translate-x-0 z-30 w-72 max-w-[85vw] bg-white border-r border-gray-200 min-h-screen transition-transform duration-300 ease-in-out`}
      >
        <nav className="p-4 space-y-2 h-full flex flex-col">
          <div className="flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              )
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mt-auto"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      </aside>
    </>
  )
}
