import React, { Suspense, lazy, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
  useParams,
} from "react-router-dom";
import Chat from "./chat";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// ============================================================================
// LAZY-LOADED PAGE IMPORTS
// Replace each placeholder factory with the direct import as pages are built:
// e.g. const DashboardPage = lazy(() => import("./pages/DashboardPage"));
// ============================================================================

const createLazyPlaceholder = (title: string, subtitle: string) =>
  lazy(() =>
    Promise.resolve({
      default: () => {
        const params = useParams();
        return (
          <div className="page-content">
            <div className="page-header">
              <div className="page-title-group">
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
              <span className="badge badge-primary">Module Ready</span>
            </div>

            <div className="card">
              <h3>{title} Workspace</h3>
              <p style={{ marginTop: "0.5rem" }}>
                This route is configured and protected inside{" "}
                <code>src/App.tsx</code>. Replace this lazy placeholder with the
                dedicated page component in <code>src/pages/</code>.
              </p>
              {Object.keys(params).length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <code>Route Params: {JSON.stringify(params)}</code>
                </div>
              )}
            </div>
          </div>
        );
      },
    })
  );

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
const FilesPage = createLazyPlaceholder(
  "File Sharing",
  "Upload, list, download, and manage shared team files (up to 10 MB)."
);
const ActivityPage = createLazyPlaceholder(
  "Activity Timeline",
  "Audit trail of user, team, and project actions in real time."
);
const AiAssistantPage = createLazyPlaceholder(
  "CollabSphere AI Assistant",
  "Get intelligent help breaking down tasks, planning sprints, and learning."
);
const ProfilePage = createLazyPlaceholder(
  "User Profile",
  "Manage your personal profile, role details, and account settings."
);

// Preserve existing real-time Chat component inside the /chat route
const ChatPage = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="page-content">
        <div className="page-header">
          <div className="page-title-group">
            <h1>Real-Time Chat</h1>
            <p>Instant direct messaging powered by Socket.IO</p>
          </div>
        </div>
        <div className="card" style={{ display: "flex", justifyContent: "center" }}>
          <Chat currentUserId={1} receiverId={2} />
        </div>
      </div>
    ),
  })
);

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