import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layouts & Guards
import { PublicLayout } from './components/layout/PublicLayout';
import { PortalLayout } from './components/layout/PortalLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { RootRoute } from './routes/RootRoute';
import { LoginRoute } from './routes/LoginRoute';

// Public Pages
import { PublicCatalog } from './pages/public/PublicCatalog';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentCatalog } from './pages/student/StudentCatalog';
import { StudentHistory } from './pages/student/StudentHistory';
import { StudentFines } from './pages/student/StudentFines';
import { StudentNotifications } from './pages/student/StudentNotifications';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyProfile } from './pages/faculty/FacultyProfile';
import { FacultyCatalog } from './pages/faculty/FacultyCatalog';
import { FacultyHistory } from './pages/faculty/FacultyHistory';
import { FacultyFines } from './pages/faculty/FacultyFines';
import { FacultyNotifications } from './pages/faculty/FacultyNotifications';

// Librarian Pages
import { LibrarianDashboard } from './pages/librarian/LibrarianDashboard';
import { RegisterUser } from './pages/librarian/RegisterUser';
import { UserDirectory } from './pages/librarian/UserDirectory';
import { StudentDetailsPage } from './pages/librarian/StudentDetailsPage';
import { LibrarianInventory } from './pages/librarian/LibrarianInventory';
import { IssueBookPage } from './pages/librarian/IssueBookPage';
import { ReturnBookPage } from './pages/librarian/ReturnBookPage';
import { FinesDepositsPage } from './pages/librarian/FinesDepositsPage';
import { LibrarianReportsPage } from './pages/librarian/LibrarianReportsPage';
import { TcClearancePage } from './pages/librarian/TcClearancePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LibraryManagement } from './pages/admin/LibraryManagement';
import { LibrarianManagement } from './pages/admin/LibrarianManagement';
import AdminFinesDeposits from './pages/admin/AdminFinesDeposits';
import AdminSettings from './pages/admin/AdminSettings';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import { LibraryEntrancePage } from './pages/entrance/LibraryEntrancePage';
import { ThemeProvider } from './context/ThemeContext';
import { ChatbotWidget } from './components/chat/ChatbotWidget';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<RootRoute />} />
              <Route path="/catalog" element={<PublicCatalog />} />
              <Route path="/books" element={<PublicCatalog />} />
              <Route path="/books/:bookId" element={<PublicCatalog />} />
              <Route path="/libraries" element={<RootRoute />} />
              <Route path="/gate" element={<Navigate to="/" replace />} />
              <Route path="/gate-kiosk" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<LoginRoute />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Dedicated Library Entrance Operations Route */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute allowedRoles={['LIBRARY_ENTRANCE', 'ADMIN']} />}>
                <Route path="/library-entrance/dashboard" element={<LibraryEntrancePage />} />
                <Route path="/library-entrance" element={<LibraryEntrancePage />} />
              </Route>
            </Route>

            {/* Protected Routes (Portal Layout) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PortalLayout />}>

                {/* Student Portal Routes */}
                <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/profile" element={<StudentProfile />} />
                  <Route path="/student/books" element={<StudentCatalog />} />
                  <Route path="/student/catalog" element={<StudentCatalog />} />
                  <Route path="/student/history" element={<StudentHistory />} />
                  <Route path="/student/current-books" element={<StudentHistory />} />
                  <Route path="/student/fines" element={<StudentFines />} />
                  <Route path="/student/deposit" element={<Navigate to="/student/fines" replace />} />
                  <Route path="/student/waitlist" element={<Navigate to="/student/dashboard" replace />} />
                  <Route path="/student/notifications" element={<StudentNotifications />} />
                </Route>

                {/* Faculty Portal Routes */}
                <Route element={<RoleRoute allowedRoles={['FACULTY']} />}>
                  <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                  <Route path="/faculty/profile" element={<FacultyProfile />} />
                  <Route path="/faculty/books" element={<FacultyCatalog />} />
                  <Route path="/faculty/catalog" element={<FacultyCatalog />} />
                  <Route path="/faculty/history" element={<FacultyHistory />} />
                  <Route path="/faculty/current-books" element={<FacultyHistory />} />
                  <Route path="/faculty/fines" element={<FacultyFines />} />
                  <Route path="/faculty/notifications" element={<FacultyNotifications />} />
                </Route>

                {/* Librarian Portal Routes */}
                <Route element={<RoleRoute allowedRoles={['LIBRARIAN']} />}>
                  <Route path="/librarian/dashboard" element={<LibrarianDashboard />} />
                  <Route path="/librarian/users/register" element={<RegisterUser />} />
                  <Route path="/librarian/students/register" element={<RegisterUser />} />
                  <Route path="/librarian/users/details/:identifier" element={<StudentDetailsPage />} />
                  <Route path="/librarian/students/:rollNumber" element={<StudentDetailsPage />} />
                  <Route path="/librarian/users" element={<UserDirectory />} />
                  <Route path="/librarian/students" element={<UserDirectory />} />
                  <Route path="/librarian/inventory" element={<LibrarianInventory />} />
                  <Route path="/librarian/books" element={<LibrarianInventory />} />
                  <Route path="/librarian/issue" element={<IssueBookPage />} />
                  <Route path="/librarian/return" element={<ReturnBookPage />} />
                  <Route path="/librarian/gate" element={<Navigate to="/librarian/dashboard" replace />} />
                  <Route path="/librarian/entry-exit" element={<Navigate to="/librarian/dashboard" replace />} />
                  <Route path="/librarian/fines" element={<FinesDepositsPage />} />
                  <Route path="/librarian/fines-deposits" element={<FinesDepositsPage />} />
                  <Route path="/librarian/deposits" element={<Navigate to="/librarian/fines" replace />} />
                  <Route path="/librarian/tc-clearance" element={<TcClearancePage />} />
                  <Route path="/librarian/waitlist" element={<Navigate to="/librarian/dashboard" replace />} />
                  <Route path="/librarian/reports" element={<LibrarianReportsPage />} />
                </Route>

                {/* Admin Portal Routes */}
                <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/libraries" element={<LibraryManagement />} />
                  <Route path="/admin/librarians" element={<LibrarianManagement />} />
                  <Route path="/admin/users/details/:identifier" element={<StudentDetailsPage />} />
                  <Route path="/admin/students/:rollNumber" element={<StudentDetailsPage />} />
                  <Route path="/admin/users" element={<UserDirectory />} />
                  <Route path="/admin/students" element={<UserDirectory />} />
                  <Route path="/admin/users/register" element={<RegisterUser />} />
                  <Route path="/admin/students/register" element={<RegisterUser />} />
                  <Route path="/admin/catalog" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/books" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/transactions" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/fines" element={<AdminFinesDeposits />} />
                  <Route path="/admin/fines-deposits" element={<AdminFinesDeposits />} />
                  <Route path="/admin/tc-clearance" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/reports" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/audit" element={<AuditLogsPage />} />
                  <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                </Route>

              </Route>
            </Route>
          </Routes>
          <ChatbotWidget />
        </AuthProvider>
      </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
