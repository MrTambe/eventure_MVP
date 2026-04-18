import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router";

type RegisteredEvent = { _id: string; name: string; venue: string; startDate: number; endDate: number; registrationType: string };

export function RegisteredEventsWidget() {
  const registeredEvents = useQuery(api.dashboard.getAllUserRegisteredEvents);
  const navigate = useNavigate();

  return (
    <div className="space-y-2 min-h-[120px]">
      {!registeredEvents ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : registeredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Calendar className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
            NO REGISTERED EVENTS
          </p>
        </div>
      ) : (
        (registeredEvents as RegisteredEvent[]).slice(0, 4).map((event: RegisteredEvent) => (
          <div
            key={event._id}
            className="border-2 border-black dark:border-white p-2 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => navigate(`/event/${event._id}`)}
          >
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-bold text-xs truncate flex-1">{event.name}</h4>
              {event.registrationType !== "individual" && (
                <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
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