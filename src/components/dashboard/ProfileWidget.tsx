import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { User, Calendar, Trophy, Sparkles } from "lucide-react";

export function ProfileWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const registeredEvents = useQuery(api.dashboard.getAllUserRegisteredEvents);
  const certificates = useQuery(api.dashboard.getCompletedEvents);

  const isProfileComplete = !!(
    user?.name &&
    user?.email &&
    user?.rollNo &&
    user?.branch &&
    user?.mobileNumber
  );

  const fields = [user?.name, user?.email, user?.rollNo, user?.branch, user?.mobileNumber];
  const filledFields = fields.filter(Boolean).length;
  const completionPercent = Math.round((filledFields / fields.length) * 100);

  const registeredCount = registeredEvents?.length ?? 0;
  const certificateCount = certificates?.length ?? 0;

  const nextEvent = (registeredEvents as any[])
    ?.filter((e) => e.startDate > Date.now())
    ?.sort((a, b) => a.startDate - b.startDate)?.[0];

  const daysUntil = nextEvent
    ? Math.max(0, Math.ceil((nextEvent.startDate - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="h-20 w-20 rounded-full bg-[#e8c4a0] dark:bg-amber-800 flex items-center justify-center border-2 border-black dark:border-white overflow-hidden">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
        ) : (
          <User className="h-10 w-10 text-black/60 dark:text-white/60" />
        )}
      </div>

      {/* Name & Email */}
      <div className="text-center w-full">
        <h4 className="font-bold text-base">{user?.name || "User"}</h4>
        <p className="text-xs text-muted-foreground break-all">{user?.email || "—"}</p>
      </div>

      {/* Completion nudge only when incomplete */}
      {!isProfileComplete && (
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
      )}

      {/* Quick stats (shown instead of the completion bar once complete) */}
      {isProfileComplete && (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="border-2 border-black dark:border-white bg-[#c8f0e0] dark:bg-emerald-900/30 p-2 text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1" />
            <p className="text-lg font-black leading-none">{registeredCount}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60">
              Registered
            </p>
          </div>
          <div className="border-2 border-black dark:border-white bg-[#f5c8e8] dark:bg-pink-900/30 p-2 text-center">
            <Trophy className="h-4 w-4 mx-auto mb-1" />
            <p className="text-lg font-black leading-none">{certificateCount}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60">
              Certificates
            </p>
          </div>
        </div>
      )}

      {/* What's next - only when there is an upcoming registered event */}
      {nextEvent && (
        <button
          onClick={() => navigate(`/event/${nextEvent._id}`)}
          className="w-full text-left border-2 border-black dark:border-white bg-[#fff8e8] dark:bg-amber-900/20 p-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all cursor-pointer"
        >
          <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-black/60 dark:text-white/60 mb-1">
            <Sparkles className="h-3 w-3" /> Upcoming
          </p>
          <p className="text-xs font-black uppercase truncate">{nextEvent.name}</p>
          <p className="text-[10px] text-muted-foreground font-bold">
            {daysUntil === 0 ? "Today!" : `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
          </p>
        </button>
      )}

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
