import React from "react";

// ============================================================================
// TYPES & PROPS
// ============================================================================

export type LoadingVariant = "full-page" | "card" | "button" | "inline";
export type LoadingSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface LoadingProps {
  /**
   * Visual variant of the loader:
   * - `full-page`: Centered viewport/workspace loader with brand pulse ring & dual orbital spinner
   * - `card`: Dark glassmorphic card loader with animated shimmer skeleton bars
   * - `button`: Compact high-contrast spinner for inside buttons during form submission
   * - `inline`: Subtle horizontal spinner + label for inline status updates
   * @default "card"
   */
  variant?: LoadingVariant;

  /**
   * Size preset for the spinner indicator.
   * @default "md"
   */
  size?: LoadingSize;

  /**
   * Primary loading heading or label text.
   */
  label?: string;

  /**
   * Secondary descriptive text (used in `full-page` and `card` variants).
   */
  sublabel?: string;

  /**
   * Number of skeleton shimmer rows to display in `card` mode.
   * @default 3
   */
  skeletonRows?: number;

  /**
   * Whether to render skeleton placeholder bars in `card` mode.
   * @default true
   */
  showSkeleton?: boolean;

  /**
   * Optional custom height or min-height override.
   */
  minHeight?: string | number;

  /**
   * Optional CSS class name.
   */
  className?: string;

  /**
   * Optional inline styles.
   */
  style?: React.CSSProperties;
}

// ============================================================================
// SIZE DIMENSION MAP
// ============================================================================

const SPINNER_DIMENSIONS: Record<
  LoadingSize,
  { px: number; stroke: number; fontSize: string }
> = {
  xs: { px: 14, stroke: 2, fontSize: "0.75rem" },
  sm: { px: 18, stroke: 2.25, fontSize: "0.825rem" },
  md: { px: 28, stroke: 2.75, fontSize: "0.925rem" },
  lg: { px: 42, stroke: 3.25, fontSize: "1.05rem" },
  xl: { px: 56, stroke: 3.75, fontSize: "1.15rem" },
};

// ============================================================================
// CORE ANIMATED SVG ORBITAL SPINNER
// ============================================================================

interface OrbitalSpinnerProps {
  size: LoadingSize;
  light?: boolean;
}

const OrbitalSpinner: React.FC<OrbitalSpinnerProps> = ({
  size,
  light = false,
}) => {
  const { px, stroke } = SPINNER_DIMENSIONS[size];
  const center = px / 2;
  const radius = (px - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      className="cs-orbital-spinner"
      role="status"
      aria-hidden="true"
      style={{
        width: `${px}px`,
        height: `${px}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        style={{
          animation: "cs-spin 0.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
        }}
      >
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={
            light ? "rgba(255, 255, 255, 0.25)" : "rgba(148, 163, 184, 0.16)"
          }
          strokeWidth={stroke}
        />
        {/* Animated Primary Gradient Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={light ? "#ffffff" : "var(--primary, #6366f1)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.68} ${circumference}`}
          strokeDashoffset={circumference * 0.15}
        />
      </svg>
    </span>
  );
};

// ============================================================================
// MAIN REUSABLE LOADING COMPONENT
// ============================================================================

export const Loading: React.FC<LoadingProps> = ({
  variant = "card",
  size,
  label,
  sublabel,
  skeletonRows = 3,
  showSkeleton = true,
  minHeight,
  className = "",
  style,
}) => {
  // --------------------------------------------------------------------------
  // 1. BUTTON LOADING VARIANT
  // --------------------------------------------------------------------------
  if (variant === "button") {
    const resolvedSize = size || "sm";
    return (
      <span
        className={`cs-loading-button ${className}`.trim()}
        role="status"
        aria-live="polite"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          lineHeight: 1,
          ...style,
        }}
      >
        <OrbitalSpinner size={resolvedSize} light />
        {label ? <span>{label}</span> : null}
      </span>
    );
  }

  // --------------------------------------------------------------------------
  // 2. INLINE LOADING VARIANT
  // --------------------------------------------------------------------------
  if (variant === "inline") {
    const resolvedSize = size || "sm";
    return (
      <span
        className={`cs-loading-inline ${className}`.trim()}
        role="status"
        aria-live="polite"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.55rem",
          fontSize: SPINNER_DIMENSIONS[resolvedSize].fontSize,
          fontWeight: 500,
          color: "var(--text-secondary, #cbd5e1)",
          ...style,
        }}
      >
        <OrbitalSpinner size={resolvedSize} />
        <span>{label || "Loading..."}</span>
      </span>
    );
  }

  // --------------------------------------------------------------------------
  // 3. FULL-PAGE LOADING VARIANT
  // --------------------------------------------------------------------------
  if (variant === "full-page") {
    const resolvedSize = size || "lg";
    return (
      <div
        className={`cs-loading-fullpage ${className}`.trim()}
        role="status"
        aria-live="polite"
        aria-busy="true"
        style={{
          minHeight: minHeight || "calc(100vh - var(--topbar-height, 64px))",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          background:
            "radial-gradient(circle at 50% 35%, rgba(99, 102, 241, 0.1) 0%, transparent 55%)",
          ...style,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "76px",
            height: "76px",
            borderRadius: "22px",
            background:
              "linear-gradient(145deg, rgba(20, 25, 37, 0.95), rgba(15, 23, 42, 0.9))",
            border: "1px solid var(--border-light, #2e3750)",
            boxShadow:
              "0 14px 34px rgba(0, 0, 0, 0.48), 0 0 24px rgba(99, 102, 241, 0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <OrbitalSpinner size={resolvedSize} />
        </div>

        <h3
          style={{
            margin: "0 0 0.35rem",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--text, #f3f4f6)",
            letterSpacing: "-0.015em",
          }}
        >
          {label || "Loading CollabSphere Workspace"}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "var(--text-muted, #94a3b8)",
            maxWidth: "380px",
            lineHeight: 1.55,
          }}
        >
          {sublabel || "Synchronizing real-time data and workspace resources..."}
        </p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 4. CARD LOADING VARIANT (DEFAULT)
  // --------------------------------------------------------------------------
  const resolvedSize = size || "md";

  return (
    <div
      className={`card cs-loading-card ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: minHeight || "220px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem 1.5rem",
        gap: "1.1rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.65rem",
        }}
      >
        <OrbitalSpinner size={resolvedSize} />
        <div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text, #f3f4f6)",
            }}
          >
            {label || "Loading content..."}
          </div>
          {sublabel && (
            <div
              style={{
                fontSize: "0.815rem",
                color: "var(--text-muted, #94a3b8)",
                marginTop: "0.2rem",
              }}
            >
              {sublabel}
            </div>
          )}
        </div>
      </div>

      {showSkeleton && skeletonRows > 0 && (
        <div
          aria-hidden="true"
          style={{
            width: "100%",
            maxWidth: "460px",
            display: "flex",
            flexDirection: "column",
            gap: "0.55rem",
            marginTop: "0.35rem",
          }}
        >
          {Array.from({ length: skeletonRows }).map((_, idx) => {
            const widths = ["100%", "84%", "68%", "90%"];
            return (
              <div
                key={idx}
                className="cs-skeleton-bar"
                style={{
                  height: "10px",
                  width: widths[idx % widths.length],
                  margin: "0 auto",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(90deg, rgba(35, 42, 61, 0.45) 25%, rgba(99, 102, 241, 0.18) 50%, rgba(35, 42, 61, 0.45) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "cs-shimmer 1.6s ease-in-out infinite",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CONVENIENCE NAMED WRAPPERS
// ============================================================================

export const FullPageLoader: React.FC<Omit<LoadingProps, "variant">> = (
  props
) => <Loading {...props} variant="full-page" />;

export const CardLoader: React.FC<Omit<LoadingProps, "variant">> = (props) => (
  <Loading {...props} variant="card" />
);

export const ButtonLoader: React.FC<Omit<LoadingProps, "variant">> = (
  props
) => <Loading {...props} variant="button" />;

export const InlineLoader: React.FC<Omit<LoadingProps, "variant">> = (
  props
) => <Loading {...props} variant="inline" />;

export default Loading;
