import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  FolderKanban,
  BookOpen,
  CheckSquare,
  Users,
  AlertCircle,
  Copy,
  Check,
  User as UserIcon,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { aiService, getErrorMessage } from "../services/api";

interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  category?: string;
}

interface AssistantCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  prompts: string[];
}

const ASSISTANT_CATEGORIES: AssistantCategory[] = [
  {
    id: "PROJECT_HELP",
    title: "Project Help",
    description: "Architecture advice, MVP scoping, and tech stack planning",
    icon: FolderKanban,
    color: "#6366f1",
    prompts: [
      "Help me structure an MVP architecture for a full-stack CollabSphere project.",
      "What database schema and REST endpoints should our project include?",
    ],
  },
  {
    id: "LEARNING_HELP",
    title: "Learning Help",
    description: "Recommended tracks, study roadmaps, and quiz preparation",
    icon: BookOpen,
    color: "#10b981",
    prompts: [
      "Which learning tracks and courses should I take to master full-stack development?",
      "How can I earn verified certificates on CollabSphere?",
    ],
  },
  {
    id: "TASK_PLANNING",
    title: "Task Planning",
    description: "Break down milestones into agile tasks and priorities",
    icon: CheckSquare,
    color: "#38bdf8",
    prompts: [
      "How should I divide our team project into actionable tasks with priorities?",
      "Suggest a 2-week sprint task breakdown for a 4-person student team.",
    ],
  },
  {
    id: "TEAM_COLLABORATION",
    title: "Team Collaboration",
    description: "Role delegation, file sharing workflows, and communication",
    icon: Users,
    color: "#a855f7",
    prompts: [
      "What are the best practices for collaborating with my team on CollabSphere?",
      "How should we organize roles, tasks, and shared files in our team workspace?",
    ],
  },
];

const STORAGE_KEY = "collabsphere_ai_conversation";

const AIAssistant: React.FC = () => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage parse errors
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] =
    useState<string>("PROJECT_HELP");
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Persist messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendPromptToBackend = async (promptText: string, categoryId?: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
      category: categoryId || selectedCategory,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);
    setError(null);
    setLastFailedPrompt(null);

    try {
      const res = await aiService.chat(trimmed);
      const replyContent =
        res.message || "No response text returned from backend.";

      const aiMsg: AssistantMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toISOString(),
        category: categoryId || selectedCategory,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(getErrorMessage(err));
      setLastFailedPrompt(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPromptToBackend(inputPrompt);
  };

  const handleClearConversation = () => {
    setMessages([]);
    setError(null);
    setLastFailedPrompt(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const activeCategoryObj =
    ASSISTANT_CATEGORIES.find((c) => c.id === selectedCategory) ||
    ASSISTANT_CATEGORIES[0];

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
          marginBottom: "1.5rem",
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
            <Sparkles size={14} />
            INTELLIGENT WORKSPACE COPILOT
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            CollabSphere AI Assistant
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.35rem" }}>
            Get tailored guidance on project architecture, agile task breakdown,
            learning tracks, and team collaboration.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClearConversation}
            disabled={isLoading}
          >
            <Trash2 size={15} />
            Clear Conversation
          </button>
        )}
      </div>

      {/* Assistant Categories Selector Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {ASSISTANT_CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className="card"
              style={{
                padding: "1.1rem 1.2rem",
                textAlign: "left",
                cursor: "pointer",
                border: isSelected
                  ? `1px solid ${cat.color}`
                  : "1px solid var(--border)",
                background: isSelected
                  ? "rgba(99, 102, 241, 0.1)"
                  : "var(--card)",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  marginBottom: "0.45rem",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.14)",
                    color: cat.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComponent size={18} />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.94rem",
                    color: "var(--text)",
                  }}
                >
                  {cat.title}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                }}
              >
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Chat Container */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: "520px",
          maxHeight: "calc(100vh - 310px)",
        }}
      >
        {/* Suggested Prompts Bar for Active Category */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            background: "rgba(15, 23, 42, 0.35)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span
            style={{
              fontSize: "0.76rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Quick Prompts ({activeCategoryObj.title}):
          </span>

          {activeCategoryObj.prompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => sendPromptToBackend(prompt, activeCategoryObj.id)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "0.78rem",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Conversation Transcript */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.15rem",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                maxWidth: "480px",
                padding: "2rem 1rem",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "rgba(99, 102, 241, 0.16)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Bot size={34} />
              </div>
              <h3 style={{ marginBottom: "0.4rem" }}>
                How can I help you build today, {user?.name || "Scholar"}?
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.55,
                }}
              >
                Select a category above or type a question below. All requests
                are securely processed by the CollabSphere backend AI service (
                <code>/api/ai/chat</code>).
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    gap: "0.85rem",
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        background: "rgba(99, 102, 241, 0.18)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={20} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "1rem 1.2rem",
                      borderRadius: isUser
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                      background: isUser
                        ? "linear-gradient(135deg, var(--primary), #4f46e5)"
                        : "var(--surface)",
                      color: isUser ? "#fff" : "var(--text)",
                      border: isUser ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        marginBottom: "0.4rem",
                        fontSize: "0.75rem",
                        opacity: 0.8,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>
                        {isUser
                          ? user?.name || "You"
                          : "CollabSphere AI Assistant"}
                      </span>
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>

                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        fontSize: "0.92rem",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content}
                    </div>

                    {!isUser && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: "0.65rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            padding: "0.25rem 0.55rem",
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={12} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy Response
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <UserIcon size={18} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                alignSelf: "flex-start",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.18)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={20} />
              </div>
              <div
                style={{
                  padding: "0.75rem 1.1rem",
                  borderRadius: "14px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  fontSize: "0.86rem",
                  color: "var(--text-muted)",
                }}
              >
                <div
                  className="spinner"
                  style={{ width: "16px", height: "16px" }}
                />
                <span>CollabSphere AI is thinking...</span>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div
              className="error-state"
              style={{
                padding: "0.95rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              {lastFailedPrompt && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                  onClick={() => sendPromptToBackend(lastFailedPrompt)}
                >
                  <RotateCcw size={14} />
                  Retry
                </button>
              )}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Message Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            padding: "1rem 1.35rem",
            borderTop: "1px solid var(--border)",
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder={`Ask CollabSphere AI about ${activeCategoryObj.title.toLowerCase()}...`}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputPrompt.trim() || isLoading}
          >
            <Send size={16} />
            {isLoading ? "Sending..." : "Ask AI"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
