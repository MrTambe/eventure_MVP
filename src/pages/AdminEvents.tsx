import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, MapPin, Calendar, Clock } from "lucide-react";

export default function AdminEvents() {
  const events = useQuery(api.events.getAllEventsWithDetails);

  if (events === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-background min-h-screen p-8 font-mono">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tighter">ADMIN EVENTS</h1>
        <p className="text-muted-foreground mt-2">Centralized dashboard for all events.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <Card key={event._id} className="border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] flex flex-col">
            <CardHeader className="border-b-4 border-black dark:border-white p-4">
              <CardTitle className="text-2xl font-bold tracking-tighter uppercase">{event.name}</CardTitle>
              <Badge variant={event.status === 'active' ? 'default' : 'secondary'} className="w-fit mt-2">{event.status}</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4 flex-grow">
              <p className="text-muted-foreground">{event.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 font-bold">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                  <Clock className="h-4 w-4" />
                  <span>{new Date(event.startDate).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}</span>
                </div>
              </div>

              <div className="border-t-2 border-black dark:border-white my-4"></div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <Users className="h-5 w-5" />
                    <span>Registered</span>
                  </div>
                  <span className="font-bold text-lg">{event.registrations.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <UserCheck className="h-5 w-5" />
                    <span>Volunteers</span>
                  </div>
                  <span className="font-bold text-lg">{event.volunteers.length}</span>
                </div>
              </div>

              <div className="border-t-2 border-black dark:border-white my-4"></div>

              <div>
                <h3 className="font-bold mb-2 uppercase">Countdown</h3>
                <div className="text-lg font-bold text-primary">
                  <CountdownTimer targetDate={event.startDate} />
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 uppercase">Managing Team</h3>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{event.creator?.name || 'N/A'}</Badge>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 uppercase">Volunteers</h3>
                <div className="flex flex-wrap gap-2">
                  {event.volunteers.length > 0 ? event.volunteers.map(v => (
                    <Badge key={v._id} variant="secondary">{v.name}</Badge>
                  )) : <p className="text-sm text-muted-foreground">No volunteers assigned.</p>}
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
