import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Layers,
  LogOut,
  Menu,
  Search,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.full_name || "CollabSphere User";
  const displayEmail = user?.email || "user@collabsphere.dev";
  const displayRole = (user?.role || "STUDENT").toString().toUpperCase();

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  // Close profile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/projects?q=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      {/* Left Section: Mobile Menu Trigger + Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <button
          type="button"
          className="btn-ghost btn-icon"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title="Toggle Menu"
        >
          <Menu size={20} />
        </button>

        <Link
          to="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
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
              boxShadow: "0 2px 10px var(--primary-glow)",
            }}
          >
            <Layers size={18} />
          </span>
          <span>CollabSphere</span>
        </Link>
      </div>

      {/* Center Section: Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        style={{
          flex: 1,
          maxWidth: "460px",
          margin: "0 1rem",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Search
          size={16}
          style={{
            position: "absolute",
            left: "0.85rem",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects, teams, or learning tracks..."
          aria-label="Search CollabSphere"
          style={{
            paddingLeft: "2.4rem",
            paddingRight: "0.9rem",
            paddingTop: "0.45rem",
            paddingBottom: "0.45rem",
            fontSize: "0.875rem",
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-full)",
          }}
        />
      </form>

      {/* Right Section: Quick Actions + Notifications + User Menu */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => navigate("/ai-assistant")}
          aria-label="Open AI Assistant"
          title="CollabSphere AI Assistant"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-full)",
          }}
        >
          <Sparkles size={15} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "0.8rem" }}>AI Help</span>
        </button>

        {/* Notification Icon Button */}
        <button
          type="button"
          className="btn-ghost btn-icon"
          onClick={() => navigate("/notifications")}
          aria-label="View notifications"
          title="Notifications"
          style={{
            position: "relative",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-full)",
            width: "38px",
            height: "38px",
          }}
        >
          <Bell size={18} />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "7px",
              right: "8px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              boxShadow: "0 0 8px var(--primary)",
            }}
          />
        </button>

        {/* User Profile Dropdown */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-label="User account menu"
            style={{
              padding: "0.3rem 0.6rem 0.3rem 0.35rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
            }}
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={displayName}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-soft)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  color: "var(--primary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {initials || "CS"}
              </span>
            )}

            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text)",
                maxWidth: "120px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </span>

            <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
          </button>

          {isProfileMenuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.55rem)",
                width: "240px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "0.5rem",
                zIndex: 60,
              }}
            >
              {/* User Info Header */}
              <div
                style={{
                  padding: "0.65rem 0.75rem",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: "0.35rem",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--text)",
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayEmail}
                </div>
                <span
                  className="badge badge-primary"
                  style={{ marginTop: "0.45rem", fontSize: "0.7rem" }}
                >
                  {displayRole}
                </span>
              </div>

              {/* Profile Link */}
              <button
                type="button"
                role="menuitem"
                className="btn-ghost"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate("/profile");
                }}
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                }}
              >
                <UserIcon size={16} />
                <span>My Profile</span>
              </button>

              {/* Notifications Link */}
              <button
                type="button"
                role="menuitem"
                className="btn-ghost"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate("/notifications");
                }}
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                }}
              >
                <Bell size={16} />
                <span>Notifications</span>
              </button>

              <div
                style={{
                  height: "1px",
                  backgroundColor: "var(--border)",
                  margin: "0.35rem 0",
                }}
              />

              {/* Logout Button */}
              <button
                type="button"
                role="menuitem"
                className="btn-ghost"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                  color: "var(--danger)",
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
