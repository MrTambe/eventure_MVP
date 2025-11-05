import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, Calendar, Trophy } from "lucide-react";

export function QuickStatsWidget() {
  const stats = useQuery(api.dashboard.getUserStats);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
        <div className="text-2xl font-black">{stats?.totalEventsJoined || 0}</div>
        <p className="text-xs text-muted-foreground uppercase">Events</p>
      </div>
      <div className="text-center">
        <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
        <div className="text-2xl font-black">{stats?.totalCertificates || 0}</div>
        <p className="text-xs text-muted-foreground uppercase">Certificates</p>
      </div>
      <div className="text-center">
        <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
        <div className="text-2xl font-black">Active</div>
        <p className="text-xs text-muted-foreground uppercase">Status</p>
      </div>
    </div>
  );
}
