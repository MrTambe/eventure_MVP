import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/use-auth";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { Spinner } from "@/components/ui/spinner";

function SignIn() {
  const { isLoading, isAuthenticated } = useAuth();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  
  useEffect(() => {
    // Handle magic link token and email from URL parameters
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (token && email && !isAuthenticated && !isProcessingToken) {
      setIsProcessingToken(true);
      // Process the magic link token
      (async () => {
        try {
          await signIn("magic-link", { token, email });
          // Wait a moment for auth state to update
          setTimeout(() => {
            navigate("/dashboard");
          }, 500);
        } catch (error) {
          console.error("Magic link authentication failed:", error);
          setIsProcessingToken(false);
        }
      })();
    }
  }, [searchParams, isAuthenticated, signIn, navigate, isProcessingToken]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !searchParams.get("token")) {
      navigate(searchParams.get("redirect") || "/dashboard");
    }
  }, [isLoading, isAuthenticated, searchParams, navigate]);

  // Show loading spinner while processing magic link token
  if (isProcessingToken || (searchParams.get("token") && !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Signing you in...</p>
        </div>
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