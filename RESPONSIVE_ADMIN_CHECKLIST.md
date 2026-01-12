# Responsive Admin Dashboard Checklist

This checklist helps verify that the admin dashboard is fully mobile-responsive and all routes work correctly.

## Mobile Menu Testing

- [ ] **Hamburger menu opens sidebar overlay**
  - On mobile (< 1024px), clicking hamburger icon opens sidebar
  - Sidebar slides in from left with smooth animation
  - Semi-transparent backdrop appears behind sidebar

- [ ] **Sidebar closes correctly**
  - Clicking X button closes sidebar
  - Clicking backdrop closes sidebar
  - Navigating to a route closes sidebar on mobile

- [ ] **Desktop sidebar behavior**
  - On desktop (≥ 1024px), sidebar is always visible
  - No overlay/backdrop on desktop
  - Sidebar is static, not sliding

## Route Testing

Test each route to ensure it renders correctly:

- [ ] `/admin` - Overview page with stats cards
- [ ] `/admin/leads` - Leads table (scrollable on mobile)
- [ ] `/admin/complaints` - Complaints list
- [ ] `/admin/chat` - Chat conversations (responsive grid)
- [ ] `/admin/users` - Users table (scrollable on mobile)
- [ ] `/admin/students` - Students table with expandable rows (scrollable on mobile)
- [ ] `/admin/applications` - Applications table with filters (scrollable on mobile)
- [ ] `/admin/universities` - Universities table (scrollable on mobile)
- [ ] `/admin/majors` - Majors table (scrollable on mobile)
- [ ] `/admin/intakes` - Program Intakes page
- [ ] `/admin/program-documents` - Program Documents table (scrollable on mobile)
- [ ] `/admin/rag` - RAG upload and documents list (scrollable on mobile)
- [ ] `/admin/scholarships` - Scholarships page
- [ ] `/admin/partners` - Partners page
- [ ] `/admin/settings` - Settings form
- [ ] `/admin/automation` - Automation form
- [ ] `/admin/document-import` - Document import form

## Table Responsiveness

For each table page, verify:

- [ ] **Horizontal scrolling works**
  - Tables are wrapped in `overflow-x-auto` container
  - On mobile, tables scroll horizontally
  - On desktop, tables display normally without horizontal scroll

- [ ] **Table wrapper structure**
  - Tables use: `<div className="overflow-x-auto -mx-3 sm:mx-0"><div className="min-w-[900px] px-3 sm:px-0"><table>`
  - Minimum width ensures tables don't compress too much
  - Padding adjusts for mobile vs desktop

## Modal Responsiveness

For modals (Student form, Application details, etc.):

- [ ] **Modals are scrollable**
  - Use `max-h-[85vh] overflow-y-auto`
  - Content scrolls when modal is taller than viewport
  - Header stays sticky at top

- [ ] **Modal sizing**
  - Use `max-w-lg` or `max-w-2xl` for appropriate width
  - Modals are responsive and don't overflow viewport
  - Padding adjusts for mobile (`p-4`) vs desktop

## Form Responsiveness

- [ ] **Form grids**
  - Use `grid grid-cols-1 md:grid-cols-2 gap-3`
  - Single column on mobile, two columns on desktop
  - Inputs are full width

- [ ] **Input fields**
  - All inputs use `w-full` class
  - Labels and inputs stack vertically on mobile
  - Proper spacing between form elements

## Layout Spacing

- [ ] **Container max width**
  - Content uses `max-w-screen-2xl mx-auto`
  - Content doesn't stretch too wide on large screens

- [ ] **Card styling**
  - Cards use: `bg-white rounded-lg shadow-sm border border-gray-200`
  - Consistent padding: `p-3 sm:p-4 lg:p-6`

- [ ] **Text sizing**
  - Use `text-sm` on mobile, `text-base` on desktop with `sm:` prefixes
  - Headings scale appropriately

## Topbar Testing

- [ ] **Topbar is sticky**
  - Topbar stays at top when scrolling
  - Uses `sticky top-0 z-40`

- [ ] **Topbar content**
  - Left: Hamburger (mobile only) + page title
  - Right: Optional actions slot
  - Responsive padding and text sizing

## Logout Functionality

- [ ] **Logout button works**
  - Clicking logout in sidebar calls `useAuthStore.logout()`
  - User is navigated to "/"
  - Auth state is cleared

## Additional Checks

- [ ] **No console errors**
  - Check browser console for any errors
  - All API calls work correctly
  - No missing imports or broken components

- [ ] **Navigation highlights**
  - Active route is highlighted in sidebar
  - Uses `NavLink` with `isActive` styling
  - Blue background for active route

- [ ] **Loading states**
  - Loading spinners appear during API calls
  - Proper loading states for each page

- [ ] **Error handling**
  - Error messages display correctly
  - Failed API calls show appropriate errors
  - Forms validate properly

## Browser Testing

Test on multiple browsers and devices:

- [ ] Chrome (desktop and mobile)
- [ ] Firefox (desktop and mobile)
- [ ] Safari (desktop and mobile)
- [ ] Edge (desktop)

## Device Testing

- [ ] iPhone (various sizes)
- [ ] Android phone (various sizes)
- [ ] iPad / Tablet
- [ ] Desktop (various screen sizes)

## Notes

- All tables should be horizontally scrollable on mobile
- Modals should scroll vertically when content is long
- Forms should stack vertically on mobile, use grid on desktop
- Sidebar should overlay on mobile, be static on desktop
- All API endpoints remain unchanged from original implementation
