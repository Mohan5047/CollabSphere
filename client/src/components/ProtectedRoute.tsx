import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageLoader } from "./Loading";

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = "/login",
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <FullPageLoader
        minHeight="100vh"
        label="Verifying Session"
        sublabel="Checking your CollabSphere authentication credentials..."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
