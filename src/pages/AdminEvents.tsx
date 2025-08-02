import React, { useState } from 'react';
import { MenuBar } from '@/components/ui/glow-menu';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Settings,
  Bell,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider, useTheme } from 'next-themes';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AdminEventsContent() {
  const { theme, setTheme } = useTheme();
  const [activeMenuItem, setActiveMenuItem] = useState("Events");

  // Fetch all events from the database
  const allEvents = useQuery(api.events.getAllEventsWithDetails);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin-dashboard", gradient: "from-blue-500 to-purple-600", iconColor: "text-blue-400" },
    { name: "Events", icon: CalendarIcon, label: "Events", href: "/admin-events", gradient: "from-green-500 to-cyan-600", iconColor: "text-green-400" },
    { name: "Users", icon: Users, label: "Users", href: "#", gradient: "from-red-500 to-orange-600", iconColor: "text-red-400" },
    { name: "Settings", icon: Settings, label: "Settings", href: "#", gradient: "from-yellow-500 to-amber-600", iconColor: "text-yellow-400" },
    { name: "Notifications", icon: Bell, label: "Notifications", href: "#", gradient: "from-pink-500 to-rose-600", iconColor: "text-pink-400" },
  ];

  // Format date and time for display
  const formatEventDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const eventDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const eventTime = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return { eventDate, eventTime };
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>
      <div className="relative z-10">
        <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">
                EVENT MANAGEMENT
              </h1>
              <p className="text-muted-foreground font-medium">
                Manage all events, volunteers, and registrations
              </p>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#fff] hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              CREATE EVENT
            </Button>
          </div>

          {/* Events Grid */}
          <div className="grid gap-6">
            {/* Loading State */}
            {allEvents === undefined && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-lg font-mono">Loading events...</span>
              </div>
            )}

            {/* No Events State */}
            {allEvents && allEvents.length === 0 && (
              <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">No Events Found</h2>
                  <p className="text-muted-foreground text-center mb-6">
                    Create your first event to get started with event management.
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Event
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Events List */}
            {allEvents && allEvents.length > 0 && allEvents.map((event) => {
              const { eventDate, eventTime } = formatEventDateTime(event.startDate);
              
              return (
                <Card 
                  key={event._id} 
                  className="border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] hover:shadow-[12px_12px_0px_#000] dark:hover:shadow-[12px_12px_0px_#fff] hover:-translate-x-1 hover:-translate-y-1 transition-all"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-black tracking-tighter mb-2">
                          {event.name}
                        </CardTitle>
                        <p className="text-muted-foreground font-medium">
                          {event.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`font-bold border-2 ${getStatusColor(event.status)}`}>
                          {event.status.toUpperCase()}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="border-2 border-black dark:border-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-2 border-black dark:border-white text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold text-sm">{eventDate}</p>
                          <p className="text-xs text-muted-foreground">{eventTime}</p>
                        </div>
                      </div>

                      {/* Venue */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold text-sm">Venue</p>
                          <p className="text-xs text-muted-foreground">{event.venue}</p>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold text-sm">Participants</p>
                          <p className="text-xs text-muted-foreground">
                            {event.registrations?.length || 0}
                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                          </p>
                        </div>
                      </div>

                      {/* Volunteers */}
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold text-sm">Volunteers</p>
                          <p className="text-xs text-muted-foreground">
                            {event.volunteers?.length || 0} assigned
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Volunteers List */}
                    {event.volunteers && event.volunteers.length > 0 && (
                      <div className="border-t-2 border-black dark:border-white/20 pt-4">
                        <p className="font-bold text-sm mb-2">Assigned Volunteers:</p>
                        <div className="flex flex-wrap gap-2">
                          {event.volunteers.map((volunteer) => (
                            <Badge 
                              key={volunteer._id} 
                              variant="outline" 
                              className="border-2 border-black dark:border-white font-medium"
                            >
                              {volunteer.name || volunteer.email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEvents() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AdminEventsContent />
    </ThemeProvider>
  );
}