import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Target,
  User,
  Plus,
  CheckSquare,
  Square,
  Settings,
  Bell,
  Home,
  Calendar,
  Users2
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { MenuBar } from '@/components/ui/glow-menu';
import { ThemeProvider, useTheme } from 'next-themes';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useNavigate } from "react-router";

function AdminDashboardContent() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Fetch real event data
  const currentOngoingEvent = useQuery(api.events.getCurrentOngoingEvent);
  const nextUpcomingEvent = useQuery(api.events.getNextUpcomingEvent);
  const allEvents = useQuery(api.events.getAllEventsWithDetails);
  const upcomingEvents = useQuery(api.events.getUpcomingEvents);
  const teamMembers = useQuery(api.team.getAllTeamMembers);
  const createEventAsAdmin = useMutation(api.events.createEventAsAdmin);

  // Calculate real stats
  const totalEvents = allEvents?.length || 0;
  const upcomingEventsCount = upcomingEvents?.length || 0;
  const completedEvents = allEvents?.filter(event => event.status === "completed").length || 0;
  const activeParticipants = 0; // This would need to be calculated from registrations

  const stats = [
    { title: "TOTAL EVENTS", value: totalEvents.toString(), icon: Calendar, color: "bg-yellow-400" },
    { title: "ACTIVE PARTICIPANTS", value: activeParticipants.toString(), icon: Users, color: "bg-green-400" },
    { title: "COMPLETED EVENTS", value: completedEvents.toString(), icon: Target, color: "bg-blue-400" },
    { title: "UPCOMING EVENTS", value: upcomingEventsCount.toString(), icon: Clock, color: "bg-red-400" }
  ];

  // Form state
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [selectedVolunteers, setSelectedVolunteers] = useState<Id<"teamMembers">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  const toggleVolunteer = (volunteerId: Id<"teamMembers">) => {
    setSelectedVolunteers(prev =>
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!eventName.trim() || !venue.trim() || !eventDate || !eventTime) {
        toast.error("Please fill in all required fields");
        return;
      }

      const adminData = sessionStorage.getItem("adminUser");
      if (!adminData) {
        toast.error("Admin session expired. Please log in again.");
        return;
      }

      const admin = JSON.parse(adminData);
      
      const volunteerIds = selectedVolunteers;

      const result = await createEventAsAdmin({
        name: eventName,
        description: description || "",
        venue: venue,
        eventDate: eventDate,
        eventTime: eventTime,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        volunteerIds,
        adminEmail: admin.email,
      });

      if (result.success) {
        toast.success(result.message);
        // Reset form
        setEventName("");
        setDescription("");
        setVenue("");
        setEventDate("");
        setEventTime("");
        setMaxParticipants("");
        setSelectedVolunteers([]);
        setIsCreateEventOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Event creation error:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    
    // Navigate to the corresponding route
    switch (itemName) {
      case 'Dashboard':
        navigate('/admin-dashboard');
        break;
      case 'Events':
        navigate('/admin-events');
        break;
      case 'Team':
        navigate('/admin-team');
        break;
      case 'Settings':
        navigate('/admin-settings');
        break;
      default:
        break;
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  // Helper function to format date and time
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

  // Format events for calendar
  const calendarEvents = allEvents?.map(event => ({
    date: new Date(event.startDate).toISOString().split('T')[0],
    title: event.name
  })) || [];

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10">
        {/* Header Section */}
        <header className="border-b-2 border-black dark:border-white/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">EVENT ADMIN DASHBOARD</h1>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold">{getCurrentDate()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">ADMIN PANEL</div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-lg">
                AB
              </div>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border-2 border-black dark:border-white">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </header>

        {/* Floating Navbar */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        </div>

        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Event - Left Column */}
            <div className="lg:col-span-2">
              <div className="bg-card/80 backdrop-blur-sm border-4 border-black dark:border-white p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 tracking-tighter">CURRENT EVENT</h2>
                {currentOngoingEvent ? (
                  <div className="bg-yellow-400/80 backdrop-blur-sm text-black p-6 border-2 border-black">
                    <h3 className="text-3xl font-bold mb-2 tracking-tighter uppercase">
                      {currentOngoingEvent.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-lg font-bold">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        {formatEventDateTime(currentOngoingEvent.startDate).eventDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {formatEventDateTime(currentOngoingEvent.startDate).eventTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {currentOngoingEvent.venue}
                      </div>
                    </div>
                    {currentOngoingEvent.description && (
                      <p className="mt-3 text-base font-medium">
                        {currentOngoingEvent.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-200/80 backdrop-blur-sm dark:bg-gray-800/80 text-center p-6 border-2 border-black dark:border-white">
                    <h3 className="text-2xl font-bold mb-2 tracking-tighter">
                      NO CURRENT ONGOING EVENT
                    </h3>
                    <p className="text-lg font-medium text-muted-foreground">
                      No events are currently running
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className={`${stat.color} bg-opacity-80 backdrop-blur-sm text-black p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] hover:shadow-[12px_12px_0px_#000] dark:hover:shadow-[12px_12px_0px_#fff] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1`}>
                    <div className="flex flex-col items-center text-center">
                      <stat.icon className="h-12 w-12 mb-3 stroke-[3px]" />
                      <p className="text-xs font-black tracking-tighter uppercase mb-2 leading-tight">{stat.title}</p>
                      <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Upcoming Event */}
              <div className="bg-card/80 backdrop-blur-sm border-4 border-black dark:border-white p-6">
                <h2 className="text-xl font-bold mb-4 tracking-tighter">UPCOMING EVENT</h2>
                {nextUpcomingEvent ? (
                  <div className="bg-blue-400/80 backdrop-blur-sm text-black p-4 border-2 border-black">
                    <h3 className="text-lg font-bold mb-2 tracking-tighter uppercase">
                      {nextUpcomingEvent.name}
                    </h3>
                    <div className="space-y-1 text-sm font-bold">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {formatEventDateTime(nextUpcomingEvent.startDate).eventDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatEventDateTime(nextUpcomingEvent.startDate).eventTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {nextUpcomingEvent.venue}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-200/80 backdrop-blur-sm dark:bg-gray-800/80 text-center p-4 border-2 border-black dark:border-white">
                    <h3 className="text-lg font-bold mb-2 tracking-tighter">
                      NO UPCOMING EVENTS
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground">
                      No events scheduled
                    </p>
                  </div>
                )}
              </div>

              {/* Create New Event */}
              <section className="border-2 border-black dark:border-white/20 p-4 md:p-6 bg-card/80 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 tracking-tight">CREATE NEW EVENT</h2>
                <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-8 py-4 border-2 border-black dark:border-white"
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      CREATE NEW EVENT
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold tracking-tight">CREATE NEW EVENT</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateEvent} className="space-y-6 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="eventName" className="text-sm font-bold mb-2 block">EVENT NAME</Label>
                          <Input 
                            id="eventName"
                            name="eventName"
                            className="border-2 border-black dark:border-white font-mono text-base p-3"
                            placeholder="Enter event name"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <Label htmlFor="venue" className="text-sm font-bold mb-2 block">VENUE</Label>
                          <Input 
                            id="venue"
                            name="venue"
                            className="border-2 border-black dark:border-white font-mono text-base p-3"
                            placeholder="Enter venue"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="eventDate" className="text-sm font-bold mb-2 block">EVENT DATE</Label>
                          <Input 
                            id="eventDate"
                            name="eventDate"
                            type="date"
                            className="border-2 border-black dark:border-white font-mono text-base p-3"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <Label htmlFor="eventTime" className="text-sm font-bold mb-2 block">START TIME</Label>
                          <Input 
                            id="eventTime"
                            name="eventTime"
                            type="time"
                            className="border-2 border-black dark:border-white font-mono text-base p-3"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="maxParticipants" className="text-sm font-bold mb-2 block">MAX PARTICIPANTS</Label>
                        <Input 
                          id="maxParticipants"
                          name="maxParticipants"
                          type="number"
                          className="border-2 border-black dark:border-white font-mono text-base p-3"
                          placeholder="Enter maximum participants"
                          min="1"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-bold mb-2 block">DESCRIPTION</Label>
                        <Textarea 
                          id="description"
                          name="description"
                          className="border-2 border-black dark:border-white font-mono text-base p-3 min-h-[100px]"
                          placeholder="Enter event description"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold mb-3 block">ASSIGN VOLUNTEERS</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-black dark:border-white p-2">
                          {teamMembers === undefined ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading volunteers...</p>
                            </div>
                          ) : !teamMembers || teamMembers.length === 0 ? (
                            <div className="text-center py-4">
                              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                No volunteers available. Please add them under /admin-teams or /admin-settings.
                              </p>
                            </div>
                          ) : (
                            teamMembers.map((volunteer) => (
                              <div key={volunteer._id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <button
                                  type="button"
                                  onClick={() => toggleVolunteer(volunteer._id)}
                                  className="flex-shrink-0"
                                  disabled={isSubmitting}
                                >
                                  {selectedVolunteers.includes(volunteer._id) ? (
                                    <CheckSquare className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Square className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div className="flex-grow">
                                  <div className="font-medium text-sm">
                                    {volunteer.name} ({volunteer.branch} - {volunteer.rollNo})
                                  </div>
                                  <div className="text-xs text-muted-foreground">{volunteer.email}</div>
                                </div>
                                {volunteer.role && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                    {volunteer.role}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {selectedVolunteers.length} volunteer{selectedVolunteers.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button 
                          type="submit"
                          className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-base py-3 border-2 border-black dark:border-white"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'CREATING...' : 'CREATE EVENT'}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCreateEventOpen(false);
                            setSelectedVolunteers([]);
                          }}
                          className="flex-1 border-2 border-black dark:border-white font-mono text-base py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                          disabled={isSubmitting}
                        >
                          CANCEL
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </section>

              {/* Volunteer Assignment Section */}
              <div className="space-y-3">
                <Label className="text-sm font-bold">ASSIGN VOLUNTEERS</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-black dark:border-white p-3 bg-muted/20">
                  {teamMembers === undefined ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading volunteers...</p>
                    </div>
                  ) : !teamMembers || teamMembers.length === 0 ? (
                    <div className="text-center py-4">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No volunteers available. Please add them under /admin-teams or /admin-settings.
                      </p>
                    </div>
                  ) : (
                    teamMembers.map((volunteer) => (
                      <div key={volunteer._id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <button
                          type="button"
                          onClick={() => toggleVolunteer(volunteer._id)}
                          className="flex-shrink-0"
                          disabled={isSubmitting}
                        >
                          {selectedVolunteers.includes(volunteer._id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-grow">
                          <div className="font-medium text-sm">
                            {volunteer.name} ({volunteer.branch} - {volunteer.rollNo})
                          </div>
                          <div className="text-xs text-muted-foreground">{volunteer.email}</div>
                        </div>
                        {volunteer.role && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                            {volunteer.role}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedVolunteers.length} volunteer{selectedVolunteers.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Calendar */}
              <div className="bg-card/80 backdrop-blur-sm border-4 border-black dark:border-white p-6">
                <h2 className="text-xl font-bold mb-4 tracking-tighter">CALENDAR</h2>
                <div className="grid grid-cols-7 gap-2 text-center font-bold text-sm">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const day = i - 3;
                    const date = `2024-12-${String(day).padStart(2, '0')}`;
                    const hasEvent = calendarEvents.find((e: { date: string }) => e.date === date);
                    return (
                      <div
                        key={i}
                        className={`
                          p-2 text-center text-sm border-2 border-black dark:border-white
                          ${day > 0 && day <= 31 ? '' : 'text-muted-foreground'}
                          ${hasEvent ? 'bg-yellow-400 text-black font-bold' : ''}
                        `}
                      >
                        {day > 0 && day <= 31 ? day : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminDashboardContent />
    </ThemeProvider>
  )
}