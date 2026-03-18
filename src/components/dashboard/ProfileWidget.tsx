import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
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

  // Calculate profile completion percentage
  const fields = [user?.name, user?.email, user?.rollNo, user?.branch, user?.mobileNumber];
  const filledFields = fields.filter(Boolean).length;
  const completionPercent = Math.round((filledFields / fields.length) * 100);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="h-20 w-20 rounded-full bg-[#e8c4a0] dark:bg-amber-800 flex items-center justify-center border-2 border-black dark:border-white overflow-hidden">
        <User className="h-10 w-10 text-black/60 dark:text-white/60" />
      </div>

      {/* Name & Email */}
      <div className="text-center w-full">
        <h4 className="font-bold text-base">{user?.name || "User"}</h4>
        <p className="text-xs text-muted-foreground break-all">{user?.email || "—"}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 border border-black dark:border-white">
          <div
            className="h-full bg-black dark:bg-white transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="text-[10px] font-bold uppercase mt-1 text-center text-muted-foreground">
          PROFILE COMPLETION: {completionPercent}%
        </p>
      </div>

      {/* Button */}
      <Button
        variant="default"
        size="sm"
        className="w-full bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white font-black text-xs uppercase h-10 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-[4px_4px_0px_#555] dark:shadow-[4px_4px_0px_#aaa] hover:shadow-[2px_2px_0px_#555] transition-all"
        onClick={() => navigate("/profile")}
      >
        {isProfileComplete ? "VIEW PROFILE" : "COMPLETE PROFILE"}
      </Button>
    </div>
  );
}