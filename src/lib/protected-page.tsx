import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { AuthButton } from "@/components/auth/AuthButton";

interface ProtectedProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export function Protected({ children, requiredRole }: ProtectedProps) {
  const { isLoading, isAuthenticated, user } = useAuth();
  
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
  
  // User is authenticated and authorized
  return <>{children}</>;
}