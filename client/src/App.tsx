import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useLocation,
  useParams,
} from "react-router-dom";
import Chat from "./chat";

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

const LoginPage = createLazyPlaceholder(
  "Sign In to CollabSphere",
  "Authenticate with your student, team lead, or admin account."
);

const RegisterPage = createLazyPlaceholder(
  "Create Your CollabSphere Account",
  "Join projects, collaborate with teams, and start learning tracks."
);

// Protected Pages (Lazy Loaded)
const DashboardPage = createLazyPlaceholder(
  "Dashboard",
  "Overview of your projects, courses, recent quizzes, and certificates."
);
const ProjectsPage = createLazyPlaceholder(
  "Projects",
  "Discover, create, and manage collaborative software projects."
);
const ProjectDetailsPage = createLazyPlaceholder(
  "Project Details",
  "Detailed view of project specifications, teams, and applications."
);
const TeamsPage = createLazyPlaceholder(
  "Teams",
  "Manage project teams, team leads, and member collaboration."
);
const TeamDetailsPage = createLazyPlaceholder(
  "Team Workspace",
  "Team members, tasks, shared files, and activity logs."
);
const TasksPage = createLazyPlaceholder(
  "Tasks",
  "Track TODO, IN_PROGRESS, and COMPLETED tasks across your teams."
);
const ApplicationsPage = createLazyPlaceholder(
  "Applications",
  "Review and manage project join requests and applications."
);
const LearningPage = createLazyPlaceholder(
  "Learning Hub",
  "Explore categories, structured learning tracks, and interactive courses."
);
const CourseDetailsPage = createLazyPlaceholder(
  "Course Viewer",
  "Study course modules, lessons, and downloadable learning resources."
);
const QuizPage = createLazyPlaceholder(
  "Quiz Assessment",
  "Complete course quizzes and track your score attempts."
);
const CertificatesPage = createLazyPlaceholder(
  "Certificates",
  "View and download your earned course completion certificates."
);
const NotificationsPage = createLazyPlaceholder(
  "Notifications",
  "Stay updated on task assignments, messages, and team alerts."
);
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
// REUSABLE PROTECTED ROUTE GUARD
// Can later be moved to src/components/ProtectedRoute.tsx and connected to AuthContext
// ============================================================================

interface ProtectedRouteProps {
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = "/login",
}) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // During incremental development, if a token is strictly required:
  // Uncomment the redirect check below once LoginPage stores the JWT token.
  const isAuthenticated = Boolean(token) || true;

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// ============================================================================
// PROTECTED APPLICATION SHELL LAYOUT
// ============================================================================

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Projects", path: "/projects" },
  { label: "Teams", path: "/teams" },
  { label: "Tasks", path: "/tasks" },
  { label: "Applications", path: "/applications" },
  { label: "Learning", path: "/learning" },
  { label: "Certificates", path: "/certificates" },
  { label: "Files", path: "/files" },
  { label: "Chat", path: "/chat" },
  { label: "Activity", path: "/activity" },
  { label: "Notifications", path: "/notifications" },
  { label: "AI Assistant", path: "/ai-assistant" },
  { label: "Profile", path: "/profile" },
];

const AppShellLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/dashboard"
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            CollabSphere
          </Link>
          <span className="badge badge-primary">v1.0</span>
        </div>

        <nav
          style={{
            padding: "1rem 0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: "0.6rem 0.9rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--text)" : "var(--text-muted)",
                  backgroundColor: isActive
                    ? "var(--primary-soft)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--primary)"
                    : "3px solid transparent",
                  transition: "all var(--transition-fast)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              Workspace
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link to="/notifications" className="btn btn-secondary btn-sm">
              Notifications
            </Link>
            <Link to="/profile" className="btn btn-primary btn-sm">
              Profile
            </Link>
          </div>
        </header>

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
  );
}

export default App;