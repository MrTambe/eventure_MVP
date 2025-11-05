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
    <div className="space-y-3 h-full flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-black dark:border-white">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm truncate">{user?.name || "User"}</h4>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      <div className="border-2 border-black dark:border-white p-2.5">
        <div className="flex items-center gap-2 mb-2">
          {isProfileComplete ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
          )}
          <span className="text-xs font-bold">
            {isProfileComplete ? "Profile Complete" : "Complete Your Profile"}
          </span>
        </div>
        {!isProfileComplete && (
          <p className="text-xs text-muted-foreground mb-2">
            Add your details to unlock all features
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-2 border-black dark:border-white font-bold text-xs h-8"
          onClick={() => navigate("/profile")}
        >
          {isProfileComplete ? "VIEW PROFILE" : "COMPLETE PROFILE"}
        </Button>
      </div>
    </div>
  );
}