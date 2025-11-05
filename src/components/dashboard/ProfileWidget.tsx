import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";

export function ProfileWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isProfileComplete = !!(
    user?.name &&
    user?.email &&
    user?.rollNo &&
    user?.branch &&
    user?.mobileNumber
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-black dark:border-white">
          <User className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold">{user?.name || "User"}</h4>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="border-2 border-black dark:border-white p-3">
        <div className="flex items-center gap-2 mb-2">
          {isProfileComplete ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-bold">
            {isProfileComplete ? "Profile Complete" : "Complete Your Profile"}
          </span>
        </div>
        {!isProfileComplete && (
          <p className="text-xs text-muted-foreground mb-3">
            Add your details to unlock all features
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-2 border-black dark:border-white font-bold"
          onClick={() => navigate("/profile")}
        >
          {isProfileComplete ? "VIEW PROFILE" : "COMPLETE PROFILE"}
        </Button>
      </div>
    </div>
  );
}
