import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  size?: "sm" | "md" | "lg";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  style,
  size = "md",
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;
  const buttonDimensions =
    size === "sm" ? "32px" : size === "lg" ? "42px" : "38px";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-ghost btn-icon theme-toggle-btn ${className}`.trim()}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: buttonDimensions,
        height: buttonDimensions,
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        color: isDark ? "var(--color-warning, #F59E0B)" : "var(--color-primary, #4F46E5)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        padding: 0,
        ...style,
      }}
    >
      {isDark ? (
        <Sun
          size={iconSize}
          style={{
            transform: "rotate(0deg)",
            transition: "transform var(--transition-normal)",
          }}
        />
      ) : (
        <Moon
          size={iconSize}
          style={{
            transform: "rotate(0deg)",
            transition: "transform var(--transition-normal)",
          }}
        />
      )}
    </button>
  );
};

export default ThemeToggle;
