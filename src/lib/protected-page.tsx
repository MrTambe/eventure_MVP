import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { AuthButton } from "@/components/auth/AuthButton";
import { useNavigate, useLocation } from "react-router";
import { useEffect } from "react";

interface ProtectedProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export function Protected({ children, requiredRole }: ProtectedProps) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isProfileComplete = !!(
    user?.name &&
    (user as any)?.rollNo &&
    (user as any)?.branch &&
    (user as any)?.mobileNumber
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isProfileComplete) {
      // Only redirect if not already on complete-profile
      if (location.pathname !== "/complete-profile") {
        navigate("/complete-profile", { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, isProfileComplete, navigate, location.pathname]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-4">You need to sign in to access this content</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  // Role-based authorization check
  if (requiredRole && (!user || user.role !== requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Access denied: {requiredRole} privileges required</p>
        </div>
      </div>
    );
  }

  // If profile incomplete, show spinner while redirecting
  if (!isProfileComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}