import React, { Suspense, lazy, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// ============================================================================
// LAZY-LOADED PAGE IMPORTS
// ============================================================================

// Public Pages
const LandingPage = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="container" style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div
          className="card"
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            textAlign: "center",
            padding: "3.5rem 2rem",
          }}
        >
          <span className="badge badge-primary" style={{ marginBottom: "1rem" }}>
            CollabSphere Platform
          </span>
          <h1>Collaborative Learning & Project Management</h1>
          <p style={{ maxWidth: "580px", margin: "1rem auto 2rem" }}>
            Build real-world projects in teams, track agile tasks, share files,
            master structured learning tracks, and earn verified certificates.
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link to="/login" className="btn btn-primary btn-lg">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Create Account
            </Link>
            <Link to="/dashboard" className="btn btn-ghost btn-lg">
              Explore Dashboard
            </Link>
          </div>
        </div>
      </div>
    ),
  })
);

const LoginPage = lazy(() => import("./pages/auth/Login"));
const RegisterPage = lazy(() => import("./pages/auth/Register"));

// Protected Pages (Lazy Loaded)
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const ProjectsPage = lazy(() => import("./pages/Projects"));
const ProjectDetailsPage = lazy(() => import("./pages/ProjectDetails"));
const TeamsPage = lazy(() => import("./pages/Teams"));
const TeamDetailsPage = lazy(() => import("./pages/TeamDetails"));
const TasksPage = lazy(() => import("./pages/Tasks"));
const ApplicationsPage = lazy(() => import("./pages/Applications"));
const LearningPage = lazy(() => import("./pages/Learning"));
const CourseDetailsPage = lazy(() => import("./pages/CourseDetails"));
const QuizPage = lazy(() => import("./pages/Quiz"));
const CertificatesPage = lazy(() => import("./pages/Certificates"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const FilesPage = lazy(() => import("./pages/Files"));
const ActivityPage = lazy(() => import("./pages/Activity"));
const AiAssistantPage = lazy(() => import("./pages/AIAssistant"));
const ChatPage = lazy(() => import("./pages/Chat"));
const ProfilePage = lazy(() => import("./pages/Profile"));

// ============================================================================
// REUSABLE LOADING FALLBACK
// ============================================================================

const PageLoader: React.FC = () => (
  <div className="loading-state">
    <div className="spinner" aria-label="Loading page" />
    <p>Loading workspace...</p>
  </div>
);


// ============================================================================
// PROTECTED APPLICATION SHELL LAYOUT
// ============================================================================

const AppShellLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        className="main-wrapper"
        style={{
          marginLeft: isSidebarCollapsed ? "78px" : undefined,
          transition: "margin-left var(--transition-normal)",
        }}
      >
        <Navbar
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// ============================================================================
// 404 FALLBACK PAGE
// ============================================================================

const NotFoundPage: React.FC = () => (
  <div className="container" style={{ paddingTop: "6rem" }}>
    <div className="empty-state" style={{ maxWidth: "520px", margin: "0 auto" }}>
      <span className="badge badge-danger">404 Error</span>
      <h2>Page Not Found</h2>
      <p>
        The route you requested does not exist or may have been moved.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
        <Link to="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
        <Link to="/" className="btn btn-secondary">
          Back Home
        </Link>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN APP ROUTER
// ============================================================================

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ==========================================
                PUBLIC ROUTES
               ========================================== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ==========================================
                PROTECTED ROUTES
               ========================================== */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShellLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Projects */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailsPage />} />

                {/* Teams */}
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/:id" element={<TeamDetailsPage />} />

                {/* Tasks & Applications */}
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />

                {/* Learning, Quizzes & Certificates */}
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/learning/:id" element={<CourseDetailsPage />} />
                <Route path="/quiz/:id" element={<QuizPage />} />
                <Route path="/certificates" element={<CertificatesPage />} />

                {/* Communication, Files, Activity & AI */}
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/files" element={<FilesPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/ai-assistant" element={<AiAssistantPage />} />

                {/* User Profile */}
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* ==========================================
                404 FALLBACK ROUTE
               ========================================== */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;