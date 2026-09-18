/**
 * Role authorization middleware.
 * Supports case-insensitive comparison across roles:
 * e.g., 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'STUDENT'.
 *
 * Example usage:
 *   router.delete("/manage-course", authMiddleware, requireRole("ADMIN"), controller);
 *   router.post("/team-action", authMiddleware, requireRole("ADMIN", "TEAM_LEAD"), controller);
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. User role not identified."
            });
        }

        const userRole = String(req.user.role).trim().toUpperCase();
        const normalizedAllowed = allowedRoles.map(r => String(r).trim().toUpperCase());

        // Admin always has access, or if user's role is in the allowed list
        if (userRole === "ADMIN" || normalizedAllowed.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Forbidden. Required role: ${normalizedAllowed.join(" or ")}. Current role: ${userRole}`
        });
    };
};

module.exports = { requireRole };
