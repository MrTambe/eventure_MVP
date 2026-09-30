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
  Settings,
  Bell,
  Home,
  Calendar,
  Users2,
  Ticket,
  ScanLine,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useNavigate } from "react-router";
import { CreateAdminModal } from '@/components/admin/CreateAdminModal';
import { AdminNavBar } from '@/components/admin/admin-navbar';
import { ADMIN_NAV_ITEMS } from '@/components/admin/admin-nav-items';
import { getAdminSession } from '@/hooks/use-admin-session';
import { MessageSquare, Megaphone, AlertTriangle, Database, ChevronDown, ExternalLink, FileSpreadsheet, Info } from 'lucide-react';
import { friendlyErrorMessage } from '@/lib/friendly-error';

function AdminDashboardContent() {
  const navigate = useNavigate();
  
  // Fetch real event data
  const currentOngoingEvent = useQuery(api.events.getCurrentOngoingEvent);
  const latestBroadcast = useQuery(api.communication.getLatestBroadcast);
  const nextUpcomingEvent = useQuery(api.events.getNextUpcomingEvent);
  const allEvents = useQuery(api.events.getAllEventsWithDetails);
  const upcomingEvents = useQuery(api.events.getUpcomingEvents);
  const teamMembers = useQuery(api.team.getAllTeamMembers);
  const createEventAsAdmin = useMutation(api.events.createEventAsAdmin);

  // ===== Data (Google Sheets backups) dropdown =====
  const fetchBackups = useAction(api.googleSheets.getSheetBackups);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const [dataBackups, setDataBackups] = useState<any[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const loadDataBackups = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const adminEmail = (() => { try { return JSON.parse(sessionStorage.getItem('adminUser') || 'null')?.email; } catch { return undefined; } })();
      const result = await fetchBackups({ adminEmail });
      if (result?.success) {
        setDataBackups(result.backups || []);
      } else {
        setDataError(result?.message || 'Could not load data exports');
      }
    } catch (e: any) {
      console.error('Load backups failed:', e);
      setDataError(friendlyErrorMessage(e, 'Could not load data exports'));
    } finally {
      setDataLoading(false);
    }
  };

  const toggleDataMenu = () => {
    const next = !dataMenuOpen;
    setDataMenuOpen(next);
    if (next && dataBackups === null && !dataLoading) loadDataBackups();
  };

  // Calculate real stats
  const totalEvents = allEvents?.length || 0;
  const upcomingEventsCount = upcomingEvents?.length || 0;
  const completedEvents = useQuery(api.events.getCompletedEvents);
  const activeParticipants = 0;

  const stats = [
    { title: "TOTAL EVENTS", value: totalEvents.toString(), icon: Calendar, color: "bg-yellow-400" },
    { title: "ACTIVE PARTICIPANTS", value: activeParticipants.toString(), icon: Users, color: "bg-green-400" },
    { title: "COMPLETED EVENTS", value: (completedEvents?.length || 0).toString(), icon: Target, color: "bg-blue-400" },
    { title: "UPCOMING EVENTS", value: upcomingEventsCount.toString(), icon: Clock, color: "bg-red-400" }
  ];

  // Form state
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

  const handleCreateEvent = async () => {
    if (!eventName.trim() || !eventVenue.trim() || !eventDate || !eventTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingEvent(true);
    try {
      let adminEmail: string | undefined = undefined;
      try {
        const adminSession = sessionStorage.getItem("adminUser");
        if (adminSession) {
          const parsed = JSON.parse(adminSession);
          if (parsed?.email) adminEmail = parsed.email as string;
        }
      } catch {}

      const result = await createEventAsAdmin({
        name: eventName.trim(),
        description: eventDescription.trim(),
        venue: eventVenue.trim(),
        eventDate: eventDate,
        eventTime: eventTime,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        volunteerIds: selectedVolunteers,
        adminEmail,
      });

      if (result?.success) {
        toast.success(result.message);
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

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

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

  const adminSession = getAdminSession();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10">
        {/* Admin Navbar */}
        <AdminNavBar items={ADMIN_NAV_ITEMS} />

        <div className="container mx-auto px-4 py-8 pt-20">
          {/* Header with date + Data menu */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">EVENT ADMIN DASHBOARD</h1>
            <div className="flex items-center gap-3">
              {/* Data dropdown (Google Sheets backups) */}
              <div className="relative">
                <button
                  onClick={toggleDataMenu}
                  className="flex items-center gap-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all cursor-pointer"
                >
                  <Database className="h-4 w-4" />
                  Data
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dataMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {dataMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] z-50 max-h-[70vh] overflow-y-auto">
                    <div className="p-3 border-b-2 border-black dark:border-white bg-[#FDF8F3] dark:bg-neutral-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                        <FileSpreadsheet className="h-3 w-3" /> Google Sheets data exports
                      </p>
                    </div>
                    {dataLoading && (
                      <div className="p-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">Loading...</div>
                    )}
                    {!dataLoading && dataError && (
                      <div className="p-4 text-xs font-bold text-red-600 dark:text-red-400">{dataError}</div>
                    )}
                    {!dataLoading && !dataError && dataBackups?.length === 0 && (
                      <div className="p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" /> No backups yet
                        </p>
                        <p className="text-[11px] text-muted-foreground mb-3">
                          Create one from Admin Settings → Google Sheets Backup. Each backup adds
                          Participants, Staff and Overview sheets for an event, shared with all admins.
                        </p>
                        <button
                          onClick={() => { setDataMenuOpen(false); navigate('/admin-settings'); }}
                          className="w-full py-2 bg-[#6D28D9] text-white text-[11px] font-black uppercase tracking-wide border-2 border-black dark:border-white cursor-pointer hover:bg-[#5b21b6] transition-colors"
                        >
                          Go to Admin Settings
                        </button>
                      </div>
                    )}
                    {!dataLoading && !dataError && (dataBackups || []).map((b: any) => (
                      <div key={b._id} className="p-3 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0">
                        <p className="text-xs font-black uppercase tracking-wide mb-1 truncate">{b.eventName}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                          {b.eventStatus} · synced {new Date(b.syncedAt).toLocaleDateString('en-IN')}
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            ['Participants', b.participantsUrl, Users],
                            ['Staff & Volunteers', b.staffUrl, FileSpreadsheet],
                            ['Event Overview', b.overviewUrl, Calendar],
                            ['Drive Folder', b.folderUrl, ExternalLink],
                          ].map(([label, url, Icon]: any) => (
                            <a
                              key={label}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold border border-transparent hover:border-black dark:hover:border-white hover:bg-[#6D28D9] hover:text-white transition-colors cursor-pointer"
                            >
                              <Icon className="h-3 w-3 flex-shrink-0" />
                              {label}
                              <ExternalLink className="h-2.5 w-2.5 ml-auto opacity-60" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="p-2 border-t-2 border-black dark:border-white bg-[#FDF8F3] dark:bg-neutral-800">
                      <button
                        onClick={() => { setDataBackups(null); loadDataBackups(); }}
                        className="w-full text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-[#6D28D9] cursor-pointer"
                      >
                        ↻ Refresh
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold">{getCurrentDate()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">ADMIN PANEL</div>
              </div>
            </div>
          </div>

          {/* Create New Admin Button - admin only */}
          {(() => {
            if (adminSession?.role === "admin") return (
              <div className="mb-6 flex justify-end">
                <CreateAdminModal />
              </div>
            );
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

              {/* Latest Broadcast Widget */}
              <div className="bg-card/80 backdrop-blur-sm border-4 border-black dark:border-white shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
                <div className="border-b-4 border-black dark:border-white p-3 bg-black dark:bg-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-white dark:text-black" />
                  <h2 className="text-sm font-black uppercase tracking-tight text-white dark:text-black">LATEST BROADCAST</h2>
                </div>
                <div className="p-4">
                  {latestBroadcast === undefined ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-black dark:border-white border-t-transparent" />
                    </div>
                  ) : !latestBroadcast ? (
                    <div className="text-center py-4">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">No broadcasts yet</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {latestBroadcast.channel === 'urgent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase border-2 border-black bg-red-400 text-black">
                            <AlertTriangle className="h-2.5 w-2.5" /> URGENT
                          </span>
                        ) : latestBroadcast.channel === 'announcements' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase border-2 border-black bg-blue-400 text-black">
                            <Megaphone className="h-2.5 w-2.5" /> ANNOUNCEMENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase border-2 border-black bg-green-400 text-black">
                            <MessageSquare className="h-2.5 w-2.5" /> GENERAL
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {new Date(latestBroadcast._creationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground leading-relaxed line-clamp-3 border-l-4 border-black dark:border-white pl-3">
                        {latestBroadcast.content}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-wide">
                        — {latestBroadcast.authorName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* List of Volunteers Section (no checkboxes) */}
              <div className="space-y-3 mt-6">
                <Label className="text-sm font-bold">LIST OF VOLUNTEERS</Label>
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
                      <div key={volunteer.userId || volunteer._id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs rounded-full flex-shrink-0">
                          {(volunteer.name || "?").split(" ").map((w: string) => w.charAt(0)).join("").toUpperCase().slice(0, 2)}
                        </div>
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
                  {teamMembers?.length || 0} volunteer{(teamMembers?.length || 0) !== 1 ? 's' : ''} total
                </p>
              </div>

              {/* Calendar */}
              <div className="bg-card/80 backdrop-blur-sm border-4 border-black dark:border-white p-6">
                <h2 className="text-xl font-bold mb-4 tracking-tighter">CALENDAR</h2>
                <div className="grid grid-cols-7 gap-2 text-center font-bold text-sm mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={`${day}-${i}`}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {Array.from({ length: 35 }, (_, i) => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const startOffset = firstDay.getDay();
                    const dayNum = i - startOffset + 1;
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;
                    const dateStr = isValidDay
                      ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                      : '';
                    const dayEvents = calendarEvents.filter((e: any) => e.date === dateStr);
                    const isToday = dayNum === today.getDate();

                    let bgColor = '';
                    if (dayEvents.length > 0) {
                      const statuses = dayEvents.map((e: any) => e.status);
                      if (statuses.includes('ongoing')) bgColor = 'bg-blue-400 text-black';
                      else if (statuses.includes('upcoming')) bgColor = 'bg-yellow-400 text-black';
                      else if (statuses.includes('completed')) bgColor = 'bg-green-400 text-black';
                    }

                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center text-sm font-bold rounded ${
                          isValidDay ? 'cursor-pointer hover:bg-muted' : 'opacity-0'
                        } ${isToday ? 'ring-2 ring-primary' : ''} ${bgColor}`}
                        title={dayEvents.map((e: any) => e.title).join(', ')}
                      >
                        {isValidDay ? dayNum : ''}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 text-xs font-bold">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                    <span>Upcoming</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span>Ongoing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span>Completed</span>
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
  return <AdminDashboardContent />;
}