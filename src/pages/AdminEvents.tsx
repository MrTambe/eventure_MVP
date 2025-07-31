import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import { Calendar, Users, UserCheck } from "lucide-react";

export default function AdminEvents() {
  const events = useQuery(api.events.getAllEventsWithDetails);

  if (events === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const bentoItems: BentoItem[] = events.map((event, index) => ({
    title: event.name,
    description: (
      <div className="space-y-2">
        <p>{event.description}</p>
        <div className="text-lg font-bold text-primary">
          <CountdownTimer targetDate={event.startDate} />
        </div>
      </div>
    ),
    icon: <Calendar className="w-4 h-4 text-neutral-500" />,
    status: event.status,
    meta: new Date(event.startDate).toLocaleString(),
    tags: [
      `Participants: ${event.registrations.length}`,
      `Volunteers: ${event.volunteers.length}`,
      `Team: ${event.creator?.name || 'N/A'}`,
    ],
    cta: "View Details",
    colSpan: index === 0 ? 2 : 1,
    hasPersistentHover: index === 0,
  }));

  return (
    <div className="bg-background min-h-screen p-8 font-mono">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tighter">ADMIN EVENTS</h1>
        <p className="text-muted-foreground mt-2">Centralized dashboard for all events.</p>
      </header>
      <BentoGrid items={bentoItems} />
    </div>
  );
}