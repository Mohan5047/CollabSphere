import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  Info,
  CheckSquare,
  Users,
  FolderKanban,
  Award,
  FileText,
  Clock,
  Filter,
  Inbox,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notificationService, getErrorMessage } from "../services/api";
import type { NotificationItem } from "../types";

type ReadFilter = "ALL" | "UNREAD" | "READ";

const Notifications: React.FC = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [readFilter, setReadFilter] = useState<ReadFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await notificationService.getUserNotifications(user.id);
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotifications(items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notification: NotificationItem) => {
    if (notification.is_read) return;
    setBusyId(notification.id);
    setActionError(null);

    try {
      const res = await notificationService.markAsRead(notification.id);
      const updated = res.data?.data;
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? updated || { ...item, is_read: true }
            : item
        )
      );
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    setIsMarkingAll(true);
    setActionError(null);

    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    setBusyId(notificationId);
    setActionError(null);

    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  // Counts & unique notification types
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const readCount = useMemo(
    () => notifications.filter((n) => n.is_read).length,
    [notifications]
  );

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    notifications.forEach((n) => {
      if (n.type) types.add(n.type.toUpperCase());
    });
    return Array.from(types).sort();
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (readFilter === "UNREAD" && item.is_read) return false;
      if (readFilter === "READ" && !item.is_read) return false;

      const normalizedType = (item.type || "INFO").toUpperCase();
      if (typeFilter !== "ALL" && normalizedType !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (item.title || "").toLowerCase().includes(q);
        const matchesMessage = (item.message || "").toLowerCase().includes(q);
        const matchesType = normalizedType.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage && !matchesType) return false;
      }

      return true;
    });
  }, [notifications, readFilter, typeFilter, searchQuery]);

  // Helper for relative + formatted timestamp
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return { relative: "Just now", full: "" };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { relative: dateStr, full: dateStr };

    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let relative = "";
    if (diffSeconds < 60) {
      relative = "Just now";
    } else if (diffSeconds < 3600) {
      relative = `${Math.floor(diffSeconds / 60)}m ago`;
    } else if (diffSeconds < 86400) {
      relative = `${Math.floor(diffSeconds / 3600)}h ago`;
    } else if (diffSeconds < 604800) {
      relative = `${Math.floor(diffSeconds / 86400)}d ago`;
    } else {
      relative = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const full = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return { relative, full };
  };

  // Visual configuration per notification type
  const getTypePresentation = (rawType?: string) => {
    const type = (rawType || "INFO").toUpperCase();

    if (type.includes("TASK")) {
      return {
        label: type,
        icon: CheckSquare,
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.14)",
        border: "rgba(56, 189, 248, 0.3)",
      };
    }
    if (type.includes("TEAM") || type.includes("MEMBER")) {
      return {
        label: type,
        icon: Users,
        color: "#a855f7",
        bg: "rgba(168, 85, 247, 0.14)",
        border: "rgba(168, 85, 247, 0.3)",
      };
    }
    if (type.includes("PROJECT")) {
      return {
        label: type,
        icon: FolderKanban,
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.14)",
        border: "rgba(99, 102, 241, 0.3)",
      };
    }
    if (type.includes("APPLICATION") || type.includes("APPLY")) {
      return {
        label: type,
        icon: FileText,
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.14)",
        border: "rgba(245, 158, 11, 0.3)",
      };
    }
    if (type.includes("CERT") || type.includes("COURSE") || type.includes("QUIZ")) {
      return {
        label: type,
        icon: Award,
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.14)",
        border: "rgba(16, 185, 129, 0.3)",
      };
    }

    return {
      label: type,
      icon: Info,
      color: "var(--primary)",
      bg: "rgba(99, 102, 241, 0.12)",
      border: "rgba(99, 102, 241, 0.25)",
    };
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              background: "rgba(99, 102, 241, 0.12)",
              color: "var(--primary)",
              fontSize: "0.78rem",
              fontWeight: 600,
              marginBottom: "0.6rem",
            }}
          >
            <Bell size={14} />
            ACTIVITY ALERTS
          </div>
          <h1
            className="page-title"
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.7rem",
                  borderRadius: "999px",
                  background: "var(--primary)",
                  color: "#fff",
                }}
              >
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.35rem" }}>
            Stay updated on project tasks, team invitations, applications, and
            course milestones.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || unreadCount === 0}
          >
            <CheckCheck size={16} />
            {isMarkingAll ? "Marking..." : "Mark All as Read"}
          </button>
        </div>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div
          className="error-state"
          style={{
            marginBottom: "1.25rem",
            padding: "0.85rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem" }}
            onClick={() => setActionError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Read/Unread Segment Tabs */}
        <div
          style={{
            display: "inline-flex",
            padding: "0.25rem",
            borderRadius: "10px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            gap: "0.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setReadFilter("ALL")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              background:
                readFilter === "ALL" ? "var(--primary)" : "transparent",
              color: readFilter === "ALL" ? "#fff" : "var(--text-muted)",
            }}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setReadFilter("UNREAD")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              background:
                readFilter === "UNREAD" ? "var(--primary)" : "transparent",
              color: readFilter === "UNREAD" ? "#fff" : "var(--text-muted)",
            }}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setReadFilter("READ")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              background:
                readFilter === "READ" ? "var(--primary)" : "transparent",
              color: readFilter === "READ" ? "#fff" : "var(--text-muted)",
            }}
          >
            Read ({readCount})
          </button>
        </div>

        {/* Right Controls: Search + Type Dropdown */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.75rem",
            flex: "1 1 320px",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 220px",
              maxWidth: "340px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.85rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.4rem" }}
            />
          </div>

          {availableTypes.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Filter size={15} style={{ color: "var(--text-muted)" }} />
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by notification type"
                style={{ minWidth: "150px" }}
              >
                <option value="ALL">All Types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="loading-state" style={{ padding: "4rem 1.5rem" }}>
          <div className="spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
            Loading your notifications...
          </p>
        </div>
      ) : error ? (
        <div className="error-state" style={{ padding: "3rem 1.5rem" }}>
          <AlertCircle size={36} style={{ marginBottom: "0.75rem" }} />
          <h3 style={{ marginBottom: "0.4rem" }}>
            Failed to Load Notifications
          </h3>
          <p style={{ marginBottom: "1.25rem" }}>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchNotifications}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state" style={{ padding: "4rem 1.5rem" }}>
          <Inbox
            size={48}
            style={{
              color: "var(--primary)",
              marginBottom: "1rem",
              opacity: 0.85,
            }}
          />
          <h3 style={{ marginBottom: "0.4rem" }}>
            {notifications.length === 0
              ? "You're All Caught Up!"
              : "No Matching Notifications"}
          </h3>
          <p
            style={{
              maxWidth: "440px",
              margin: "0 auto 1.25rem",
              color: "var(--text-muted)",
            }}
          >
            {notifications.length === 0
              ? "When team members assign tasks, review applications, or issue course certificates, alerts will appear here."
              : "No notifications match your active filters. Try switching back to All notifications."}
          </p>
          {notifications.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setReadFilter("ALL");
                setTypeFilter("ALL");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {filteredNotifications.map((item) => {
            const isUnread = !item.is_read;
            const presentation = getTypePresentation(item.type);
            const IconComponent = presentation.icon;
            const timeInfo = formatTimestamp(item.created_at);
            const isItemBusy = busyId === item.id;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: "1.15rem 1.35rem",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1.1rem",
                  position: "relative",
                  borderLeft: isUnread
                    ? "4px solid var(--primary)"
                    : "4px solid transparent",
                  background: isUnread
                    ? "linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, var(--card) 45%)"
                    : "var(--card)",
                  borderColor: isUnread
                    ? "rgba(99, 102, 241, 0.32)"
                    : "var(--border)",
                  opacity: isUnread ? 1 : 0.82,
                  transition: "all 0.2s ease",
                }}
              >
                {/* Left: Type Icon + Content */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: presentation.bg,
                      border: `1px solid ${presentation.border}`,
                      color: presentation.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "0.1rem",
                    }}
                  >
                    <IconComponent size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Meta row: Type Badge + Unread indicator + Timestamp */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          padding: "0.15rem 0.55rem",
                          borderRadius: "999px",
                          background: presentation.bg,
                          color: presentation.color,
                          border: `1px solid ${presentation.border}`,
                        }}
                      >
                        {presentation.label}
                      </span>

                      {isUnread ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--primary)",
                          }}
                        >
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: "var(--primary)",
                              boxShadow: "0 0 8px var(--primary)",
                            }}
                          />
                          UNREAD
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Read
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          marginLeft: "auto",
                        }}
                        title={timeInfo.full}
                      >
                        <Clock size={12} />
                        {timeInfo.relative}
                        {timeInfo.full && ` • ${timeInfo.full}`}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        margin: "0 0 0.3rem",
                        fontSize: "1rem",
                        fontWeight: isUnread ? 700 : 600,
                        color: "var(--text)",
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Message Body */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color: isUnread
                          ? "var(--text)"
                          : "var(--text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexShrink: 0,
                  }}
                >
                  {isUnread && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.8rem",
                        color: "var(--success)",
                      }}
                      disabled={isItemBusy}
                      onClick={() => handleMarkAsRead(item)}
                      title="Mark as read"
                    >
                      <Check size={15} />
                      Mark Read
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      padding: "0.45rem 0.6rem",
                      color: "var(--danger)",
                    }}
                    disabled={isItemBusy}
                    onClick={() => handleDeleteNotification(item.id)}
                    title="Delete notification"
                    aria-label={`Delete notification ${item.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
