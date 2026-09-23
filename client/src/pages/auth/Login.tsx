import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Layers,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LocationState {
  from?: {
    pathname?: string;
    search?: string;
  };
  registeredEmail?: string;
  registrationMessage?: string;
}

const Login: React.FC = () => {
  const {
    login,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  const [email, setEmail] = useState<string>(state?.registeredEmail ?? "");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForgotInfo, setShowForgotInfo] = useState<boolean>(false);

  const destination = state?.from?.pathname
    ? `${state.from.pathname}${state.from.search ?? ""}`
    : "/dashboard";

  // Redirect already authenticated users immediately to /dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear stale context errors on mount / unmount
  useEffect(() => {
    clearError();
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setValidationError("Email address is required.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setValidationError("Password is required.");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      navigate(destination, { replace: true });
    } catch {
      // Error state is managed and exposed by AuthContext (authError)
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || authLoading;
  const activeError = validationError || authError;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background:
          "radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.14), transparent 40%), radial-gradient(circle at 85% 85%, rgba(14, 165, 233, 0.12), transparent 40%), var(--bg)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2.25rem 2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* CollabSphere Branding */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.65rem",
              textDecoration: "none",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Layers size={22} />
            </span>
            <span
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.025em",
              }}
            >
              CollabSphere
            </span>
          </Link>

          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Sign in to access your projects, teams, and learning workspace
          </p>
        </div>

        {/* Optional Post-Registration Success Notice */}
        {state?.registrationMessage && !activeError && (
          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--success-muted)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#34d399",
              fontSize: "0.875rem",
            }}
          >
            <CheckCircle2
              size={18}
              style={{ flexShrink: 0, marginTop: "0.1rem" }}
            />
            <span>{state.registrationMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {activeError && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--danger-muted)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#f87171",
              fontSize: "0.875rem",
            }}
          >
            <AlertCircle
              size={18}
              style={{ flexShrink: 0, marginTop: "0.1rem" }}
            />
            <span>{activeError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={17}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-subtle)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={email}
                disabled={isLoading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError(null);
                  if (authError) clearError();
                }}
                style={{ paddingLeft: "2.55rem" }}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.35rem",
              }}
            >
              <label
                htmlFor="login-password"
                className="form-label"
                style={{ marginBottom: 0 }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotInfo((prev) => !prev)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--primary)",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <Lock
                size={17}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-subtle)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={isLoading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
                  if (authError) clearError();
                }}
                style={{ paddingLeft: "2.55rem", paddingRight: "2.75rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
                style={{
                  position: "absolute",
                  right: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  padding: "0.25rem",
                  color: "var(--text-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Placeholder Notice */}
          {showForgotInfo && (
            <div
              role="region"
              aria-label="Password recovery information"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                padding: "0.75rem 0.9rem",
                marginBottom: "1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
              }}
            >
              <Info
                size={16}
                style={{
                  color: "var(--secondary)",
                  flexShrink: 0,
                  marginTop: "0.15rem",
                }}
              />
              <div>
                Self-service password reset is managed by your workspace
                administrator. Please contact your team lead or platform admin
                to reset your credentials.
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: "100%",
              marginTop: "0.75rem",
              padding: "0.75rem 1.25rem",
            }}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={18}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to CollabSphere</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <hr className="divider" style={{ margin: "1.5rem 0" }} />

        {/* Register Navigation Link */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          Don&apos;t have a CollabSphere account?{" "}
          <Link
            to="/register"
            style={{ fontWeight: 600, color: "var(--primary)" }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
