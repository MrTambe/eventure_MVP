// @ts-nocheck
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // Consider loading complete when auth state is determined
  // If authenticated, wait for user data to load
  const isLoading = isAuthLoading || (isAuthenticated && user === undefined);

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}