import React, { useId } from "react";
import { Link } from "react-router-dom";

// ============================================================================
// TYPES & CONFIGURATION
// ============================================================================

export type LogoVariant = "full" | "icon";
export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface LogoProps {
  /**
   * - `full`: Displays the custom CollabSphere orbital sphere icon + "CollabSphere" wordmark
   * - `icon`: Displays only the abstract sphere + connected nodes symbol
   * @default "full"
   */
  variant?: LogoVariant;

  /**
   * Preset size scale for the icon and typography.
   * @default "md"
   */
  size?: LogoSize;

  /**
   * Optional subtitle tag shown beneath the CollabSphere wordmark on larger sizes.
   */
  subtitle?: string;

  /**
   * Optional route path if the logo should render as an interactive React Router `<Link>`.
   */
  to?: string;

  /**
   * Optional click handler.
   */
  onClick?: () => void;

  /**
   * Optional className for the outer wrapper.
   */
  className?: string;

  /**
   * Optional className for the wordmark text (e.g. responsive visibility).
   */
  textClassName?: string;

  /**
   * Optional inline styles.
   */
  style?: React.CSSProperties;
}

const SIZE_PRESETS: Record<
  LogoSize,
  {
    box: number;
    fontSize: string;
    subtitleSize: string;
    gap: string;
    radius: number;
  }
> = {
  xs: {
    box: 26,
    fontSize: "0.92rem",
    subtitleSize: "0.65rem",
    gap: "0.5rem",
    radius: 8,
  },
  sm: {
    box: 32,
    fontSize: "1.02rem",
    subtitleSize: "0.68rem",
    gap: "0.6rem",
    radius: 9,
  },
  md: {
    box: 36,
    fontSize: "1.12rem",
    subtitleSize: "0.72rem",
    gap: "0.68rem",
    radius: 11,
  },
  lg: {
    box: 46,
    fontSize: "1.38rem",
    subtitleSize: "0.78rem",
    gap: "0.8rem",
    radius: 14,
  },
  xl: {
    box: 58,
    fontSize: "1.7rem",
    subtitleSize: "0.85rem",
    gap: "0.95rem",
    radius: 17,
  },
};

// ============================================================================
// REUSABLE COLLABSPHERE LOGO COMPONENT
// ============================================================================

export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  size = "md",
  subtitle,
  to,
  onClick,
  className = "",
  textClassName = "",
  style,
}) => {
  const uid = useId().replace(/:/g, "");
  const preset = SIZE_PRESETS[size];

  const bgGradId = `cs-logo-bg-${uid}`;
  const ringGradId = `cs-logo-ring-${uid}`;
  const nodeGradId = `cs-logo-node-${uid}`;

  const content = (
    <span
      className={`cs-logo cs-logo-${variant} cs-logo-${size} ${className}`.trim()}
      onClick={!to ? onClick : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: preset.gap,
        userSelect: "none",
        textDecoration: "none",
        color: "var(--text-primary)",
        cursor: to || onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {/* Abstract Orbital Sphere + Connected Collaboration Nodes Symbol */}
      <span
        className="cs-logo-mark"
        style={{
          width: `${preset.box}px`,
          height: `${preset.box}px`,
          borderRadius: `${preset.radius}px`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          boxShadow: "0 4px 14px rgba(79, 70, 229, 0.22)",
        }}
      >
        <svg
          width={preset.box}
          height={preset.box}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={bgGradId}
              x1="4"
              y1="4"
              x2="60"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="52%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#090D1A" />
            </linearGradient>
            <linearGradient
              id={ringGradId}
              x1="8"
              y1="8"
              x2="56"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient
              id={nodeGradId}
              x1="16"
              y1="16"
              x2="48"
              y2="48"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>

          {/* Outer Squircle Container */}
          <rect
            x="2.5"
            y="2.5"
            width="59"
            height="59"
            rx="16"
            fill={`url(#${bgGradId})`}
            stroke={`url(#${ringGradId})`}
            strokeWidth="2.2"
          />

          {/* Subtle Inner Glass Highlight */}
          <path
            d="M12 6.5H52C55.5 6.5 57.5 8.5 57.5 12"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Global Sphere Horizon & Tilted Orbital Rings */}
          <circle
            cx="32"
            cy="32"
            r="19.5"
            stroke={`url(#${ringGradId})`}
            strokeWidth="1.65"
            strokeOpacity="0.52"
          />
          <ellipse
            cx="32"
            cy="32"
            rx="19.5"
            ry="8.6"
            transform="rotate(-28 32 32)"
            stroke={`url(#${ringGradId})`}
            strokeWidth="1.75"
          />
          <ellipse
            cx="32"
            cy="32"
            rx="8.6"
            ry="19.5"
            transform="rotate(-28 32 32)"
            stroke="#8B5CF6"
            strokeWidth="1.45"
            strokeOpacity="0.68"
          />

          {/* Connected Collaboration Pathways (Projects, Teams, Learning, Chat) */}
          <path
            d="M18.5 24.5L32 32L45.5 24.5M32 32V47.5M20.5 41.5L32 32L43.5 41.5"
            stroke={`url(#${nodeGradId})`}
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 4 Interconnected Satellite Nodes */}
          <circle
            cx="18.5"
            cy="24.5"
            r="3.5"
            fill="#3B82F6"
            stroke="#0B0F1D"
            strokeWidth="1.4"
          />
          <circle
            cx="45.5"
            cy="24.5"
            r="3.5"
            fill="#8B5CF6"
            stroke="#0B0F1D"
            strokeWidth="1.4"
          />
          <circle
            cx="20.5"
            cy="41.5"
            r="3.1"
            fill="#6366F1"
            stroke="#0B0F1D"
            strokeWidth="1.4"
          />
          <circle
            cx="43.5"
            cy="41.5"
            r="3.1"
            fill="#38BDF8"
            stroke="#0B0F1D"
            strokeWidth="1.4"
          />

          {/* Central Nexus Sphere Core */}
          <circle
            cx="32"
            cy="32"
            r="5.2"
            fill={`url(#${nodeGradId})`}
            stroke="#F8FAFC"
            strokeWidth="1.65"
          />
        </svg>
      </span>

      {/* Brand Wordmark */}
      {variant === "full" && (
        <span
          className={`cs-logo-wordmark ${textClassName}`.trim()}
          style={{
            display: "flex",
            flexDirection: "column",
            lineHeight: 1.12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display, var(--font-sans))",
              fontSize: preset.fontSize,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span>Collab</span>
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent, #3b82f6) 0%, var(--primary, #6366f1) 50%, var(--secondary, #8b5cf6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Sphere
            </span>
          </span>

          {subtitle && (
            <span
              style={{
                fontSize: preset.subtitleSize,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
                marginTop: "0.12rem",
              }}
            >
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        aria-label="CollabSphere Home"
        style={{ textDecoration: "none", display: "inline-flex" }}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
