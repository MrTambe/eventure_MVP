import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router";

export function RegisteredEventsWidget() {
  const upcomingEvents = useQuery(api.dashboard.getUpcomingEvents);
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {!upcomingEvents ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : upcomingEvents.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No registered events</p>
        </div>
      ) : (
        upcomingEvents.slice(0, 3).map((event) => (
          <div
            key={event._id}
            className="border-2 border-black dark:border-white p-3 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => navigate(`/event/${event._id}`)}
          >
            <h4 className="font-bold text-sm">{event.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
