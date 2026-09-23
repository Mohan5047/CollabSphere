import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Bot,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Send,
  User,
  Users,
  X,
} from "lucide-react";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SidebarNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  section?: string;
}

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    section: "Overview",
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
    section: "Collaboration",
  },
  {
    label: "Teams",
    path: "/teams",
    icon: Users,
    section: "Collaboration",
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: CheckSquare,
    section: "Collaboration",
  },
  {
    label: "Applications",
    path: "/applications",
    icon: Send,
    section: "Collaboration",
  },
  {
    label: "Files",
    path: "/files",
    icon: FileText,
    section: "Collaboration",
  },
  {
    label: "Chat",
    path: "/chat",
    icon: MessageSquare,
    section: "Collaboration",
  },
  {
    label: "Activity",
    path: "/activity",
    icon: Activity,
    section: "Collaboration",
  },
  {
    label: "Learning",
    path: "/learning",
    icon: BookOpen,
    section: "Academy & AI",
  },
  {
    label: "Certificates",
    path: "/certificates",
    icon: Award,
    section: "Academy & AI",
  },
  {
    label: "AI Assistant",
    path: "/ai-assistant",
    icon: Bot,
    section: "Academy & AI",
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
    section: "Account",
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
    section: "Account",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();

  const isRouteActive = (path: string): boolean => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(5, 7, 12, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 35,
          }}
        />
      )}

      <aside
        className={`sidebar ${isOpen ? "open" : ""}`}
        style={{
          width: isCollapsed ? "78px" : "var(--sidebar-width)",
          transition:
            "width var(--transition-normal), transform var(--transition-normal)",
        }}
        aria-label="Primary Sidebar Navigation"
      >
        {/* Sidebar Header */}
        <div
          style={{
            height: "var(--topbar-height)",
            padding: isCollapsed ? "0 0.75rem" : "0 1.25rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
          }}
        >
          <Link
            to="/dashboard"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              color: "var(--text)",
              fontWeight: 800,
              fontSize: "1.05rem",
              letterSpacing: "-0.02em",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                background:
                  "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Layers size={18} />
            </span>

            {!isCollapsed && <span>CollabSphere</span>}
          </Link>

          {!isCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {onToggleCollapse && (
                <button
                  type="button"
                  className="btn-ghost btn-icon"
                  onClick={onToggleCollapse}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              )}

              {onClose && isOpen && (
                <button
                  type="button"
                  className="btn-ghost btn-icon"
                  onClick={onClose}
                  aria-label="Close mobile menu"
                  title="Close menu"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}

          {isCollapsed && onToggleCollapse && (
            <button
              type="button"
              className="btn-ghost btn-icon"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              style={{ marginTop: "0.25rem" }}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.85rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          {SIDEBAR_NAV_ITEMS.map((item, idx) => {
            const IconComponent = item.icon;
            const active = isRouteActive(item.path);
            const prevSection =
              idx > 0 ? SIDEBAR_NAV_ITEMS[idx - 1].section : null;
            const showSectionHeader =
              !isCollapsed && item.section && item.section !== prevSection;

            return (
              <React.Fragment key={item.path}>
                {showSectionHeader && (
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                      padding: idx === 0 ? "0.2rem 0.75rem 0.35rem" : "0.85rem 0.75rem 0.35rem",
                    }}
                  >
                    {item.section}
                  </div>
                )}

                <Link
                  to={item.path}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    gap: "0.75rem",
                    padding: isCollapsed ? "0.65rem" : "0.6rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.88rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--text)" : "var(--text-muted)",
                    backgroundColor: active
                      ? "var(--primary-soft)"
                      : "transparent",
                    borderLeft: active
                      ? "3px solid var(--primary)"
                      : "3px solid transparent",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      color: active ? "var(--primary)" : "inherit",
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={18} />
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer Version Badge */}
        {!isCollapsed && (
          <div
            style={{
              padding: "0.85rem 1.15rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            <span>CollabSphere Workspace</span>
            <span className="badge badge-primary">v1.0</span>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
