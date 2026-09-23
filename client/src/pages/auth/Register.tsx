import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] =
  [
    {
      value: "student",
      label: "Student / Learner",
      description: "Enroll in courses, join projects, and earn certificates",
    },
    {
      value: "member",
      label: "Team Member",
      description: "Collaborate on tasks, share files, and contribute to teams",
    },
    {
      value: "team_lead",
      label: "Team Lead / Project Creator",
      description: "Create projects, manage teams, and review applications",
    },
  ];

const Register: React.FC = () => {
  const {
    register,
    login,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserRole>("student");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setValidationError("Please enter your full name (at least 2 characters).");
      return false;
    }

    if (!trimmedEmail) {
      setValidationError("Email address is required.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }

    if (!role) {
      setValidationError("Please select your workspace role.");
      return false;
    }

    if (!password || password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match. Please verify both fields.");
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

    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const response = await register({
        full_name: fullName.trim(),
        email: normalizedEmail,
        password,
        role,
      });

      // If register returned a JWT token directly, AuthContext already set the session
      if (response.token) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Otherwise automatically authenticate the newly registered user
      try {
        await login({
          email: normalizedEmail,
          password,
        });
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/login", {
          replace: true,
          state: {
            registeredEmail: normalizedEmail,
            registrationMessage:
              "Account created successfully! Please sign in with your credentials.",
          },
        });
      }
    } catch {
      // Error state is handled and exposed by AuthContext (authError)
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
        padding: "2rem 1.25rem",
        background:
          "radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.14), transparent 42%), radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.12), transparent 42%), var(--bg)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "2.25rem 2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* CollabSphere Branding */}
        <div style={{ textAlign: "center", marginBottom: "1.65rem" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.65rem",
              textDecoration: "none",
              marginBottom: "0.9rem",
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
            Create your account
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Join collaborative software projects, agile teams, and learning
            tracks
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="register-fullname" className="form-label">
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <UserIcon
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
                id="register-fullname"
                name="full_name"
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                value={fullName}
                disabled={isLoading}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (validationError) setValidationError(null);
                  if (authError) clearError();
                }}
                style={{ paddingLeft: "2.55rem" }}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label htmlFor="register-email" className="form-label">
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
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="alex@university.edu"
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

          {/* Role Selection (Required by CollabSphere Backend) */}
          <div className="form-group">
            <label htmlFor="register-role" className="form-label">
              Workspace Role
            </label>
            <div style={{ position: "relative" }}>
              <ShieldCheck
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
              <select
                id="register-role"
                name="role"
                value={role}
                disabled={isLoading}
                onChange={(e) => {
                  setRole(e.target.value as UserRole);
                  if (validationError) setValidationError(null);
                }}
                style={{ paddingLeft: "2.55rem" }}
                required
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="register-password" className="form-label">
              Password
            </label>
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
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
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

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="register-confirm-password" className="form-label">
              Confirm Password
            </label>
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
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                disabled={isLoading}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationError) setValidationError(null);
                  if (authError) clearError();
                }}
                style={{ paddingLeft: "2.55rem", paddingRight: "2.75rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
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
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "0.75rem 1.25rem",
            }}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={18}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create CollabSphere Account</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <hr className="divider" style={{ margin: "1.5rem 0" }} />

        {/* Login Navigation Link */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ fontWeight: 600, color: "var(--primary)" }}
          >
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
