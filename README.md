# MalishaEdu AI Enrollment Agent - Frontend

A modern, responsive React frontend application for managing student enrollment, university programs, and partner relationships.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Query (@tanstack/react-query)** - Data fetching and caching
- **Zustand** - State management
- **Axios** - HTTP client

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── admin/         # Admin-specific components
│   │   ├── AdminSidebar.jsx
│   │   ├── MajorsTable.jsx
│   │   └── ProgramDocumentsTable.jsx
│   ├── DocumentUploadModal.jsx
│   └── LeadCaptureModal.jsx
├── layouts/           # Layout components
│   └── AdminLayout.jsx
├── pages/            # Page components
│   ├── admin/        # Admin pages (refactored)
│   │   ├── AdminRouter.jsx
│   │   ├── AdminOverviewPage.jsx
│   │   ├── AdminLeadsPage.jsx
│   │   ├── AdminComplaintsPage.jsx
│   │   ├── AdminChatPage.jsx
│   │   ├── AdminUsersPage.jsx
│   │   ├── AdminStudentsPage.jsx
│   │   ├── AdminApplicationsPage.jsx
│   │   ├── AdminUniversitiesPage.jsx
│   │   ├── AdminMajorsPage.jsx
│   │   ├── AdminIntakesPage.jsx
│   │   ├── AdminProgramDocumentsPage.jsx
│   │   ├── AdminRagPage.jsx
│   │   ├── AdminScholarshipsPage.jsx
│   │   ├── AdminPartnersPage.jsx
│   │   ├── AdminSettingsPage.jsx
│   │   ├── AdminAutomationPage.jsx
│   │   └── AdminDocumentImportPage.jsx
│   ├── AdminDashboard.jsx  # Legacy (kept for reference)
│   ├── ChatPage.jsx
│   ├── LoginPage.jsx
│   ├── PartnerDashboard.jsx
│   └── StudentDashboard.jsx
├── services/         # API services
│   └── api.js        # Axios instance with interceptors
├── store/           # State management
│   └── authStore.js # Authentication store (Zustand)
├── App.jsx          # Main app component with routes
└── main.jsx         # Entry point
```

## Features

### Admin Dashboard

The admin dashboard has been refactored into a modular, mobile-responsive structure:

#### Responsive Design
- **Mobile**: Hamburger menu opens sidebar overlay with backdrop
- **Desktop**: Fixed sidebar always visible
- **Tables**: Horizontally scrollable on mobile, normal display on desktop
- **Modals**: Scrollable with max-height constraints
- **Forms**: Responsive grid (1 column mobile, 2 columns desktop)

#### Admin Routes

- `/admin` - Overview dashboard with statistics
- `/admin/leads` - Lead management
- `/admin/complaints` - Complaint handling
- `/admin/chat` - Student conversation viewer
- `/admin/users` - User management
- `/admin/students` - Student management with expandable applications
- `/admin/applications` - Application management with filters
- `/admin/universities` - University CRUD operations
- `/admin/majors` - Major management (uses MajorsTable component)
- `/admin/intakes` - Program intake management
- `/admin/program-documents` - Program document management
- `/admin/rag` - RAG document upload and management
- `/admin/scholarships` - Scholarship management
- `/admin/partners` - Partner management
- `/admin/settings` - Model settings configuration
- `/admin/automation` - Application automation tools
- `/admin/document-import` - Document import pipeline

### Authentication

- JWT-based authentication
- Role-based access control (admin, partner, student)
- Protected routes with route guards
- Persistent auth state using Zustand with localStorage

### Student Dashboard

- Personal dashboard for students
- Application management
- Document upload
- Chat interface with AI agent

### Partner Dashboard

- Partner-specific dashboard
- Student management
- Application tracking
- Chat interface

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

For production, set this to your backend API URL:
```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## API Integration

The frontend communicates with the backend API through the `api.js` service:

- Base URL configured via `VITE_API_BASE_URL` environment variable
- Automatic token injection from auth store
- Request/response interceptors for error handling
- Automatic HTTPS enforcement for production

### API Endpoints Used

#### Admin Endpoints
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/leads` - Lead list
- `GET /admin/complaints` - Complaints list
- `GET /admin/conversations` - Chat conversations
- `GET /admin/users` - User list
- `GET /admin/students` - Student list with pagination
- `GET /admin/applications` - Application list with filters
- `POST /admin/students` - Create student
- `PUT /admin/students/:id` - Update student
- `PUT /admin/applications/:id` - Update application
- `GET /admin/settings` - Get model settings
- `PUT /admin/settings` - Update model settings
- `POST /admin/automation/run` - Run automation

#### Public Endpoints
- `GET /universities` - University list
- `GET /majors` - Major list
- `GET /program-intakes` - Program intake list
- `GET /scholarships` - Scholarship list
- `GET /rag/documents` - RAG documents
- `POST /rag/documents` - Upload RAG document

## Responsive Design Guidelines

### Mobile-First Approach

The admin dashboard follows mobile-first responsive design:

1. **Sidebar Navigation**
   - Mobile: Overlay with backdrop (`fixed`, `z-30`)
   - Desktop: Static sidebar (`lg:static`)
   - Transition: `transition-transform duration-300`

2. **Tables**
   - Wrap in: `<div className="overflow-x-auto -mx-3 sm:mx-0"><div className="min-w-[900px] px-3 sm:px-0">`
   - Ensures horizontal scrolling on mobile
   - Normal display on desktop

3. **Modals**
   - Use: `max-w-lg` or `max-w-2xl`
   - Max height: `max-h-[85vh] overflow-y-auto`
   - Padding: `p-4` on mobile, larger on desktop

4. **Forms**
   - Grid: `grid grid-cols-1 md:grid-cols-2 gap-3`
   - Inputs: `w-full` for full width
   - Labels stack vertically on mobile

5. **Spacing**
   - Container: `max-w-screen-2xl mx-auto`
   - Cards: `p-3 sm:p-4 lg:p-6`
   - Text: `text-sm` base, `sm:text-base` for desktop

## Testing Checklist

See `RESPONSIVE_ADMIN_CHECKLIST.md` for a comprehensive testing checklist covering:
- Mobile menu functionality
- Route navigation
- Table responsiveness
- Modal behavior
- Form layouts
- Logout functionality

## Deployment

### Vercel

See `VERCEL_DEPLOYMENT.md` for detailed Vercel deployment instructions.

### Environment Variables for Production

Ensure these are set in your deployment platform:
- `VITE_API_BASE_URL` - Your backend API URL (must include `/api`)

## Code Style

- Use functional components with hooks
- Prefer named exports for components
- Use Tailwind CSS for styling (no custom CSS files)
- Follow React best practices (keys, proper hooks usage)
- Use async/await for API calls
- Handle errors appropriately with try/catch

## Contributing

1. Follow the existing code structure
2. Maintain responsive design principles
3. Preserve API endpoint compatibility
4. Test on multiple screen sizes
5. Update documentation as needed

## License

Private project - All rights reserved
