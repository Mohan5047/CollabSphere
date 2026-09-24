import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  MessageSquare,
  Send,
  Search,
  Wifi,
  WifiOff,
  Users,
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import {
  messageService,
  teamService,
  getErrorMessage,
  type ChatContact,
} from "../services/api";
import type { ChatMessage } from "../types";

const Chat: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = Number(user?.id || 0);

  // Connection state
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  // Contacts / Conversations list
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(
    null
  );
  const [contactSearch, setContactSearch] = useState<string>("");
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(true);
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Messages for active conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Unread counter per sender ID when message arrives in background
  const [unreadBySender, setUnreadBySender] = useState<Record<number, number>>(
    {}
  );

  // Input & typing state
  const [messageText, setMessageText] = useState<string>("");
  const [isReceiverTyping, setIsReceiverTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom when messages or typing indicator changes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isReceiverTyping, scrollToBottom]);

  // 1. Load Chat Contacts (teammates from GET /api/messages/users/:userId, with fallback to team members)
  const loadContacts = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingContacts(true);
    setContactsError(null);

    try {
      const res = await messageService.getChatUsers(currentUserId);
      const list = Array.isArray(res.data) ? res.data : [];

      // Deduplicate by user id while keeping team names combined
      const contactMap = new Map<number, ChatContact>();
      list.forEach((item) => {
        const id = Number(item.id);
        if (!id || id === currentUserId) return;
        const existing = contactMap.get(id);
        if (existing) {
          if (
            item.team_name &&
            existing.team_name &&
            !existing.team_name.includes(item.team_name)
          ) {
            existing.team_name = `${existing.team_name}, ${item.team_name}`;
          }
        } else {
          contactMap.set(id, {
            id,
            full_name: item.full_name || `User #${id}`,
            email: item.email || "",
            role: item.role,
            team_id: item.team_id,
            team_name: item.team_name,
          });
        }
      });

      // Fallback: if no teammates found via messageService, inspect teams
      if (contactMap.size === 0) {
        try {
          const teamsRes = await teamService.getAllTeams();
          const allTeams = Array.isArray(teamsRes.data) ? teamsRes.data : [];
          for (const team of allTeams.slice(0, 6)) {
            const membersRes = await teamService.getTeamMembers(team.id);
            const members = Array.isArray(membersRes.data)
              ? membersRes.data
              : [];
            members.forEach((m) => {
              const uid = Number(m.user_id);
              if (uid && uid !== currentUserId && !contactMap.has(uid)) {
                contactMap.set(uid, {
                  id: uid,
                  full_name: m.full_name || m.name || `User #${uid}`,
                  email: m.email || "",
                  role: m.role,
                  team_id: team.id,
                  team_name: team.name,
                });
              }
            });
          }
        } catch {
          // Ignore secondary fallback errors
        }
      }

      const uniqueContacts = Array.from(contactMap.values());
      setContacts(uniqueContacts);
      setSelectedContact((prev) => prev ?? uniqueContacts[0] ?? null);
    } catch (err) {
      setContactsError(getErrorMessage(err));
    } finally {
      setIsLoadingContacts(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // 2. Load Conversation History via REST API when selectedContact changes
  const loadConversationHistory = useCallback(async () => {
    if (!currentUserId || !selectedContact?.id) {
      setMessages([]);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);
    setIsReceiverTyping(false);

    try {
      const res = await messageService.getHistory(
        currentUserId,
        selectedContact.id
      );
      const history = Array.isArray(res.data) ? res.data : [];
      setMessages(history);

      // Clear unread badge for this contact & notify backend
      setUnreadBySender((prev) => {
        if (!prev[selectedContact.id]) return prev;
        const next = { ...prev };
        delete next[selectedContact.id];
        return next;
      });

      socket.emit("mark_messages_read", {
        reader_id: currentUserId,
        sender_id: selectedContact.id,
      });
    } catch (err) {
      setHistoryError(getErrorMessage(err));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentUserId, selectedContact?.id]);

  useEffect(() => {
    loadConversationHistory();
  }, [loadConversationHistory]);

  // 3. Socket.IO Connection, Room Join (`join_user`), and Event Listeners
  useEffect(() => {
    if (!currentUserId) return;

    if (!socket.connected) {
      socket.connect();
    }

    // Join authenticated user's personal room (`user_${currentUserId}`)
    socket.emit("join_user", currentUserId);

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_user", currentUserId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleOnlineUsers = (users: number[]) => {
      if (Array.isArray(users)) {
        setOnlineUserIds(users.map((id) => Number(id)));
      }
    };

    const handleReceiveMessage = (incoming: ChatMessage) => {
      const senderId = Number(incoming.sender_id);
      const receiverId = Number(incoming.receiver_id);

      if (receiverId !== currentUserId) return;

      if (selectedContact && senderId === Number(selectedContact.id)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        setIsReceiverTyping(false);

        socket.emit("mark_messages_read", {
          reader_id: currentUserId,
          sender_id: selectedContact.id,
        });
      } else {
        // Increment unread badge for background contact
        setUnreadBySender((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    };

    const handleMessageSent = (sentMessage: ChatMessage) => {
      const senderId = Number(sentMessage.sender_id);
      const receiverId = Number(sentMessage.receiver_id);

      if (
        senderId === currentUserId &&
        selectedContact &&
        receiverId === Number(selectedContact.id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });
      }
    };

    const handleUserTyping = (data: { user_id: number }) => {
      if (
        selectedContact &&
        Number(data?.user_id) === Number(selectedContact.id)
      ) {
        setIsReceiverTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { user_id: number }) => {
      if (
        selectedContact &&
        Number(data?.user_id) === Number(selectedContact.id)
      ) {
        setIsReceiverTyping(false);
      }
    };

    const handleMessagesRead = (data: {
      reader_id: number;
      sender_id: number;
    }) => {
      if (
        selectedContact &&
        Number(data?.reader_id) === Number(selectedContact.id)
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            Number(msg.sender_id) === currentUserId &&
            Number(msg.receiver_id) === Number(selectedContact.id)
              ? { ...msg, is_read: true }
              : msg
          )
        );
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("online_users", handleOnlineUsers);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("online_users", handleOnlineUsers);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [currentUserId, selectedContact]);

  // Handle message input and typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);

    if (!currentUserId || !selectedContact) return;

    if (val.trim().length > 0) {
      socket.emit("typing_start", {
        sender_id: currentUserId,
        receiver_id: selectedContact.id,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing_stop", {
          sender_id: currentUserId,
          receiver_id: selectedContact.id,
        });
      }, 2000);
    } else {
      socket.emit("typing_stop", {
        sender_id: currentUserId,
        receiver_id: selectedContact.id,
      });
    }
  };

  // Send message over Socket.IO (`send_message`)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !currentUserId || !selectedContact) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit("typing_stop", {
      sender_id: currentUserId,
      receiver_id: selectedContact.id,
    });

    socket.emit("send_message", {
      sender_id: currentUserId,
      receiver_id: selectedContact.id,
      message: trimmed,
    });

    setMessageText("");
  };

  const handleReconnect = () => {
    if (!socket.connected) {
      socket.connect();
    }
    if (currentUserId) {
      socket.emit("join_user", currentUserId);
    }
  };

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.team_name || "").toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatMessageDateHeader = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isSelectedOnline = selectedContact
    ? onlineUserIds.includes(Number(selectedContact.id))
    : false;

  return (
    <div className="page-container">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Real-Time Team Chat
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.25rem" }}>
            Direct Socket.IO messaging with your CollabSphere teammates.
          </p>
        </div>

        {/* Socket Connection Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.4rem 0.85rem",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: isConnected
                ? "rgba(16, 185, 129, 0.14)"
                : "rgba(239, 68, 68, 0.14)",
              color: isConnected ? "var(--success)" : "var(--danger)",
              border: `1px solid ${
                isConnected
                  ? "rgba(16, 185, 129, 0.35)"
                  : "rgba(239, 68, 68, 0.35)"
              }`,
            }}
          >
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? "Socket Connected" : "Socket Disconnected"}
          </div>

          {!isConnected && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReconnect}
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }}
            >
              <RefreshCw size={14} />
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Split Layout */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          height: "calc(100vh - 210px)",
          minHeight: "540px",
        }}
      >
        {/* Left Sidebar: Teammate Conversations */}
        <div
          style={{
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(15, 23, 42, 0.45)",
            minWidth: 0,
          }}
        >
          {/* Search Input */}
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ position: "relative" }}>
              <Search
                size={15}
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
                placeholder="Search teammates..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                style={{ paddingLeft: "2.35rem", fontSize: "0.86rem" }}
              />
            </div>
          </div>

          {/* Contacts List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {isLoadingContacts ? (
              <div
                style={{
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.88rem",
                }}
              >
                <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
                Loading teammates...
              </div>
            ) : contactsError ? (
              <div
                style={{
                  padding: "1.5rem 1rem",
                  textAlign: "center",
                  color: "var(--danger)",
                  fontSize: "0.85rem",
                }}
              >
                <AlertCircle
                  size={22}
                  style={{ margin: "0 auto 0.5rem", display: "block" }}
                />
                <p>{contactsError}</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: "0.5rem", fontSize: "0.78rem" }}
                  onClick={loadContacts}
                >
                  Retry
                </button>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div
                style={{
                  padding: "2.5rem 1.25rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.86rem",
                }}
              >
                <Users
                  size={30}
                  style={{
                    margin: "0 auto 0.6rem",
                    display: "block",
                    opacity: 0.6,
                  }}
                />
                {contactSearch
                  ? "No matching teammates found."
                  : "Join a project team to start direct messaging with teammates."}
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                const isOnline = onlineUserIds.includes(Number(contact.id));
                const unreadCount = unreadBySender[contact.id] || 0;

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedContact(contact)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.8rem 0.9rem",
                      borderRadius: "10px",
                      border: isSelected
                        ? "1px solid rgba(99, 102, 241, 0.45)"
                        : "1px solid transparent",
                      background: isSelected
                        ? "rgba(99, 102, 241, 0.16)"
                        : "transparent",
                      color: "var(--text)",
                      textAlign: "left",
                      cursor: "pointer",
                      marginBottom: "0.25rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Avatar with online indicator */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, var(--primary), #4f46e5)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                        }}
                      >
                        {getInitials(contact.full_name)}
                      </div>
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: "11px",
                          height: "11px",
                          borderRadius: "50%",
                          background: isOnline ? "#10b981" : "#64748b",
                          border: "2px solid var(--surface)",
                        }}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    {/* Name & Team */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.92rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {contact.full_name}
                        </span>
                        {unreadCount > 0 && (
                          <span
                            style={{
                              background: "var(--primary)",
                              color: "#fff",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "0.1rem 0.45rem",
                              borderRadius: "999px",
                            }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "0.15rem",
                        }}
                      >
                        {contact.team_name || contact.email || "Teammate"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Conversation Window */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minWidth: 0,
          }}
        >
          {!selectedContact ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <MessageSquare
                size={48}
                style={{
                  color: "var(--primary)",
                  opacity: 0.75,
                  marginBottom: "1rem",
                }}
              />
              <h3 style={{ color: "var(--text)", marginBottom: "0.35rem" }}>
                Select a Conversation
              </h3>
              <p style={{ maxWidth: "380px", fontSize: "0.9rem" }}>
                Choose a teammate from the sidebar to view your conversation
                history and send real-time messages.
              </p>
            </div>
          ) : (
            <>
              {/* Active Conversation Top Bar */}
              <div
                style={{
                  padding: "0.95rem 1.35rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(15, 23, 42, 0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, var(--primary), #4f46e5)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    {getInitials(selectedContact.full_name)}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.98rem",
                        color: "var(--text)",
                      }}
                    >
                      {selectedContact.full_name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: isSelectedOnline
                          ? "var(--success)"
                          : "var(--text-muted)",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: isSelectedOnline ? "#10b981" : "#64748b",
                        }}
                      />
                      {isReceiverTyping
                        ? "Typing a message..."
                        : isSelectedOnline
                        ? "Online"
                        : "Offline"}
                      {selectedContact.team_name &&
                        ` • ${selectedContact.team_name}`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "0.4rem 0.7rem", fontSize: "0.78rem" }}
                  onClick={loadConversationHistory}
                  disabled={isLoadingHistory}
                  title="Reload conversation history"
                >
                  <RefreshCw
                    size={14}
                    className={isLoadingHistory ? "spin" : ""}
                  />
                  Sync
                </button>
              </div>

              {/* Messages Scroll Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                {isLoadingHistory ? (
                  <div
                    style={{
                      margin: "auto",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div
                      className="spinner"
                      style={{ margin: "0 auto 0.75rem" }}
                    />
                    Loading message history...
                  </div>
                ) : historyError ? (
                  <div
                    className="error-state"
                    style={{ margin: "auto", maxWidth: "420px" }}
                  >
                    <p>{historyError}</p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: "0.75rem" }}
                      onClick={loadConversationHistory}
                    >
                      Retry
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    style={{
                      margin: "auto",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Sparkles
                      size={32}
                      style={{
                        color: "var(--primary)",
                        margin: "0 auto 0.6rem",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Start a conversation with {selectedContact.full_name}
                    </div>
                    <p style={{ fontSize: "0.85rem" }}>
                      Messages are delivered in real time via Socket.IO.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = Number(msg.sender_id) === currentUserId;
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const currentDateLabel = formatMessageDateHeader(
                      msg.created_at
                    );
                    const prevDateLabel = prevMsg
                      ? formatMessageDateHeader(prevMsg.created_at)
                      : "";
                    const showDateDivider =
                      currentDateLabel && currentDateLabel !== prevDateLabel;

                    return (
                      <React.Fragment key={msg.id || `${msg.created_at}-${idx}`}>
                        {showDateDivider && (
                          <div
                            style={{
                              textAlign: "center",
                              margin: "0.6rem 0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.2rem 0.75rem",
                                borderRadius: "999px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text-muted)",
                              }}
                            >
                              {currentDateLabel}
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "72%",
                              padding: "0.7rem 1rem",
                              borderRadius: isMine
                                ? "16px 16px 4px 16px"
                                : "16px 16px 16px 4px",
                              background: isMine
                                ? "linear-gradient(135deg, var(--primary), #4f46e5)"
                                : "var(--surface)",
                              color: isMine ? "#fff" : "var(--text)",
                              border: isMine
                                ? "none"
                                : "1px solid var(--border)",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.92rem",
                                lineHeight: 1.45,
                                wordBreak: "break-word",
                              }}
                            >
                              {msg.message}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: "0.35rem",
                                marginTop: "0.3rem",
                                fontSize: "0.7rem",
                                opacity: 0.82,
                              }}
                            >
                              <Clock size={10} />
                              <span>{formatMessageTime(msg.created_at)}</span>
                              {isMine &&
                                (msg.is_read ? (
                                  <span
                                    title="Read"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.15rem",
                                    }}
                                  >
                                    <CheckCheck size={13} />
                                  </span>
                                ) : (
                                  <span
                                    title="Sent"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Check size={13} />
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {isReceiverTyping && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "12px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      alignSelf: "flex-start",
                    }}
                  >
                    <span>{selectedContact.full_name} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Footer */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "1rem 1.35rem",
                  borderTop: "1px solid var(--border)",
                  background: "rgba(15, 23, 42, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Message ${selectedContact.full_name}...`}
                  value={messageText}
                  onChange={handleInputChange}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!messageText.trim() || !isConnected}
                >
                  <Send size={16} />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
