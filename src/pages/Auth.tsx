import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/use-auth";
import { Suspense, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Spinner } from "@/components/ui/spinner";

function SignIn() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated && !isLoading) {
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      console.log("User authenticated, redirecting to:", redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, searchParams, navigate]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <AuthCard />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}