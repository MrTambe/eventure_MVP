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
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    // Handle magic link token and email from URL parameters
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (token && email && !isProcessingToken) {
      setIsProcessingToken(true);
      setAuthError(null);
      
      // Process the magic link token
      (async () => {
        try {
          console.log("Processing magic link with token:", token, "and email:", email);
          
          // Call signIn and wait for it to complete
          const result = await signIn("magic-link", { token, email });
          console.log("Sign in result:", result);
          
          // If signIn didn't throw an error, wait a bit for auth state to update
          // The isAuthenticated state will be checked in the second useEffect
          if (!result || result.signingIn === false) {
            console.error("Sign-in failed or returned unexpected result:", result);
            setAuthError("Authentication failed. The link may have expired. Please request a new one.");
            setIsProcessingToken(false);
          }
        } catch (error) {
          console.error("Magic link authentication error:", error);
          setAuthError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
          setIsProcessingToken(false);
        }
      })();
    }
  }, [searchParams, signIn, isProcessingToken]);

  useEffect(() => {
    // Once authenticated, redirect to dashboard
    if (!isLoading && isAuthenticated && !searchParams.get("token")) {
      console.log("User is authenticated, redirecting to dashboard");
      navigate(searchParams.get("redirect") || "/dashboard");
    }
  }, [isLoading, isAuthenticated, searchParams, navigate]);

  // Show error message if authentication failed
  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 dark:text-red-400 mb-4 text-lg font-semibold">
            Authentication Failed
          </div>
          <p className="text-muted-foreground mb-6">{authError}</p>
          <button
            onClick={() => {
              setAuthError(null);
              navigate("/auth");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while processing magic link token
  if (isProcessingToken || searchParams.get("token")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Verifying your magic link...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we sign you in</p>
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