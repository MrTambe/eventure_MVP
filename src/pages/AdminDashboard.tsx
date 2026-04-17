/* eslint-disable */
// @ts-nocheck

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
  Users2,
  Ticket,
  ScanLine
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { MenuBar } from '@/components/ui/glow-menu';
import { ThemeProvider, useTheme } from 'next-themes';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useNavigate } from "react-router";
import { CreateAdminModal } from '@/components/admin/CreateAdminModal';

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
  const completedEvents = useQuery(api.events.getCompletedEvents);
  const activeParticipants = 0; // This would need to be calculated from registrations

  const stats = [
    { title: "TOTAL EVENTS", value: totalEvents.toString(), icon: Calendar, color: "bg-yellow-400" },
    { title: "ACTIVE PARTICIPANTS", value: activeParticipants.toString(), icon: Users, color: "bg-green-400" },
    { title: "COMPLETED EVENTS", value: (completedEvents?.length || 0).toString(), icon: Target, color: "bg-blue-400" },
    { title: "UPCOMING EVENTS", value: upcomingEventsCount.toString(), icon: Clock, color: "bg-red-400" }
  ];

  // Form state
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [selectedVolunteers, setSelectedVolunteers] = useState<Id<"users">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const toggleVolunteer = (volunteerId: Id<"users">) => {
    setSelectedVolunteers(prev => {
      if (prev.includes(volunteerId)) {
        return prev.filter(id => id !== volunteerId);
      } else {
        return [...prev, volunteerId];
      }
    });
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim() || !eventVenue.trim() || !eventDate || !eventTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingEvent(true);
    try {
      // Pull admin email from admin session (set by AdminSignIn)
      let adminEmail: string | undefined = undefined;
      try {
        const adminSession = sessionStorage.getItem("adminUser");
        if (adminSession) {
          const parsed = JSON.parse(adminSession);
          if (parsed?.email) adminEmail = parsed.email as string;
        }
      } catch {
        // ignore parse errors
      }

      const result = await createEventAsAdmin({
        name: eventName.trim(),
        description: eventDescription.trim(),
        venue: eventVenue.trim(),
        eventDate: eventDate,
        eventTime: eventTime,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        volunteerIds: selectedVolunteers,
        // Provide adminEmail so backend can validate admin access without relying only on Convex auth identity
        adminEmail,
      });

      if (result?.success) {
        toast.success(result.message);
        // Reset form
        setEventName("");
        setEventDescription("");
        setEventVenue("");
        setEventDate("");
        setEventTime("");
        setMaxParticipants("");
        setSelectedVolunteers([]);
        setIsCreateEventOpen(false);
      } else {
        toast.error(result?.message || "Failed to create event");
      }
    } catch (error) {
      console.error("Event creation error:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsCreatingEvent(false);
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
      case 'Check-In':
        navigate('/admin-checkin');
        break;
      case 'Tickets':
        navigate('/admin-tickets');
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

  // Format events for calendar with status
  const now = Date.now();
  const calendarEvents = allEvents?.map((event: any) => {
    const eventDate = new Date(event.startDate).toISOString().split('T')[0];
    let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
    
    if (event.endDate < now) {
      status = 'completed';
    } else if (event.startDate <= now && event.endDate >= now) {
      status = 'ongoing';
    }
    
    return {
      date: eventDate,
      title: event.name,
      status,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue,
      description: event.description,
    };
  }) || [];

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Check-In', label: 'Check-In', href: '/admin-checkin', icon: ScanLine, gradient: 'from-teal-500 to-cyan-500', iconColor: 'text-teal-500' },
    { name: 'Tickets', label: 'Tickets', href: '/admin-tickets', icon: Ticket, gradient: 'from-amber-500 to-yellow-500', iconColor: 'text-amber-500' },
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
          {/* Add Create New Admin Button - admin only */}
          {(() => {
            try {
              const s = sessionStorage.getItem("adminUser");
              if (s) { const p = JSON.parse(s); if (p?.role === "admin") return (
                <div className="mb-6 flex justify-end">
                  <CreateAdminModal />
                </div>
              ); }
            } catch {}
            return (
              <div className="mb-6 flex justify-end">
                <div className="px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-amber-400 text-black border-2 border-black">
                  Team Member — View Only
                </div>
              </div>
            );
          })()}

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

              {/* Volunteer Assignment Section */}
              <div className="space-y-3 mt-6">
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
                    teamMembers.map((volunteer: any) => (
                      <div key={volunteer.userId} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <button
                          type="button"
                          onClick={() => toggleVolunteer(volunteer.userId)}
                          className="flex-shrink-0"
                          disabled={isSubmitting}
                        >
                          {selectedVolunteers.includes(volunteer.userId) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-grow">
                          <div className="font-medium text-sm">
                            {volunteer.name} ({volunteer.department || volunteer.role || 'N/A'})
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
                <div className="grid grid-cols-7 gap-2 text-center font-bold text-sm mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const currentDate = new Date();
                    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const startOffset = firstDay.getDay();
                    const day = i - startOffset + 1;
                    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    
                    const dateStr = day > 0 && day <= daysInMonth 
                      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      : '';
                    
                    const eventsOnDate = calendarEvents.filter((e: any) => e.date === dateStr);
                    const hasEvent = eventsOnDate.length > 0;
                    
                    // Determine primary status color (if multiple events, prioritize ongoing > upcoming > completed)
                    let bgColor = '';
                    if (hasEvent) {
                      if (eventsOnDate.some((e: any) => e.status === 'ongoing')) {
                        bgColor = 'bg-blue-400/80';
                      } else if (eventsOnDate.some((e: any) => e.status === 'upcoming')) {
                        bgColor = 'bg-yellow-400/80';
                      } else {
                        bgColor = 'bg-green-400/80';
                      }
                    }
                    
                    return (
                      <div
                        key={i}
                        className={`
                          relative p-2 text-center text-sm border-2 border-black dark:border-white
                          ${day > 0 && day <= daysInMonth ? 'cursor-pointer' : 'text-muted-foreground'}
                          ${bgColor} ${hasEvent ? 'text-black font-bold' : ''}
                          transition-all duration-200 hover:scale-110 hover:z-10 hover:border-4
                          group
                        `}
                      >
                        {day > 0 && day <= daysInMonth ? day : ''}
                        
                        {/* Hover popup for event details */}
                        {hasEvent && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64">
                            <div className="bg-card border-4 border-black dark:border-white p-4 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
                              <div className="space-y-2">
                                {eventsOnDate.map((event: any, idx: number) => {
                                  const statusColor = 
                                    event.status === 'ongoing' ? 'bg-blue-400' :
                                    event.status === 'upcoming' ? 'bg-yellow-400' :
                                    'bg-green-400';
                                  
                                  const eventTime = formatEventDateTime(event.startDate);
                                  
                                  return (
                                    <div key={idx} className={`${statusColor} text-black p-3 border-2 border-black`}>
                                      <div className="font-bold text-xs uppercase mb-1">
                                        {event.status}
                                      </div>
                                      <div className="font-bold text-sm mb-1">
                                        {event.title}
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {eventTime.eventTime}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {event.venue}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Multiple events indicator */}
                        {eventsOnDate.length > 1 && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-black dark:bg-white rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-400 border-2 border-black dark:border-white"></div>
                    <span>UPCOMING</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-blue-400 border-2 border-black dark:border-white"></div>
                    <span>ONGOING</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-400 border-2 border-black dark:border-white"></div>
                    <span>COMPLETED</span>
                  </div>
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