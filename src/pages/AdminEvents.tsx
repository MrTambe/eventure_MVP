/* eslint-disable */
// @ts-nocheck
import React, { useState } from 'react';
import { MenuBar } from '@/components/ui/glow-menu';
import {
  Home,
  Calendar,
  Users,
  Settings,
  Plus,
  Trash2,
  Loader2,
  Info,
  Edit,
  CheckSquare,
  Square
} from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider } from 'next-themes';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CreateEventModal } from '@/components/admin/CreateEventModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Id } from '@/convex/_generated/dataModel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Ticket, ScanLine } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router";

function AdminEventsContent() {
  const [activeMenuItem, setActiveMenuItem] = useState("Events");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Id<"teamMembers">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isEnhancingEdit, setIsEnhancingEdit] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    status: 'active' as 'active' | 'completed' | 'cancelled',
    maxParticipants: ''
  });
  const navigate = useNavigate();

  const allEvents = useQuery(api.events.getAllEventsWithDetails);
  const allUsers = useQuery(api.users.listAll);
  const teamMembers = useQuery(api.team.getAllTeamMembers);
  const updateEventAsAdmin = useMutation(api.events.updateEventAsAdmin);
  const deleteEventAsAdmin = useMutation(api.events.deleteEventAsAdmin);
  const enhanceDescription = useAction(api.ai.enhanceEventDescription);

  // Get individual participants for the selected event
  const participants = useQuery(
    api.events.getEventParticipants,
    selectedEvent ? { eventId: selectedEvent._id } : "skip"
  );

  // Get team registrations for the selected event
  const teamRegistrations = useQuery(
    api.events.getEventTeamRegistrations,
    selectedEvent ? { eventId: selectedEvent._id } : "skip"
  );

  const participantsLoading = (participants === undefined || teamRegistrations === undefined) && selectedEvent !== null;

  const handleInfoClick = (event: any) => {
    setSelectedEvent(event);
    setInfoModalOpen(true);
  };

  const handleEditClick = (event: any) => {
    setSelectedEvent(event);
    setEditDescription(event.description || '');
    const eventVolunteerIds = event.volunteers?.map((v: any) => v._id as Id<"teamMembers">) || [];
    setSelectedVolunteers(eventVolunteerIds);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (event: any) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const eventName = formData.get("eventName") as string;
      const venue = formData.get("venue") as string;
      const eventDate = formData.get("eventDate") as string;
      const eventTime = formData.get("eventTime") as string;
      const maxParticipants = formData.get("maxParticipants") as string;
      const startDate = new Date(eventDate + "T" + eventTime).getTime();
      const endDate = startDate + (2 * 60 * 60 * 1000);
      if (!selectedEvent) { toast.error("No event selected."); return; }
      const result = await updateEventAsAdmin({
        id: selectedEvent._id,
        name: eventName,
        description: editDescription || "",
        venue,
        startDate,
        endDate,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      });
      if (result.success) { toast.success(result.message); setEditModalOpen(false); }
      else toast.error(result.message);
    } catch (error) {
      toast.error("Failed to update event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnhanceEditDescription = async () => {
    if (!editDescription.trim()) {
      toast.error("Please write a description first");
      return;
    }
    setIsEnhancingEdit(true);
    try {
      const result = await enhanceDescription({ description: editDescription });
      if (result.success && result.enhanced) {
        setEditDescription(result.enhanced);
        toast.success("Description enhanced!");
      } else {
        toast.error(result.error || "Failed to enhance description");
      }
    } catch (err: any) {
      toast.error(err?.message || "Enhancement failed");
    } finally {
      setIsEnhancingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;
    setIsSubmitting(true);
    try {
      const result = await deleteEventAsAdmin({ id: selectedEvent._id });
      if (result.success) { toast.success(result.message); setDeleteModalOpen(false); setSelectedEvent(null); }
      else toast.error(result.message);
    } catch (error) {
      toast.error("Failed to delete event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build unified participant rows for export
  const buildAllParticipantRows = () => {
    const rows: any[] = [];
    // Individual participants
    (participants || []).forEach((p: any) => {
      rows.push({
        type: 'Individual',
        teamName: '-',
        name: p.user?.name || 'N/A',
        rollNo: p.user?.rollNo || 'N/A',
        branch: p.user?.branch || 'N/A',
        mobileNumber: p.user?.mobileNumber || 'N/A',
        email: p.user?.email || 'N/A',
      });
    });
    // Team members
    (teamRegistrations || []).forEach((tr: any) => {
      (tr.members || []).forEach((m: any) => {
        rows.push({
          type: 'Team',
          teamName: tr.teamName,
          name: m.name || 'N/A',
          rollNo: m.rollNo || 'N/A',
          branch: m.branch || 'N/A',
          mobileNumber: m.mobileNumber || 'N/A',
          email: m.email || 'N/A',
        });
      });
    });
    return rows;
  };

  const handleParticipantExport = (format: "pdf" | "xlsx" | "csv") => {
    if (!selectedEvent) { toast.error("No event selected."); return; }
    if (participants === undefined || teamRegistrations === undefined) {
      toast.error("Data is still loading. Please wait and try again.");
      return;
    }
    const rows = buildAllParticipantRows();
    if (rows.length === 0) {
      toast.error("No participants to export.");
      return;
    }
    const eventName = selectedEvent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${eventName}_participants`;

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(selectedEvent.name + " - Participants", 14, 16);
      (doc as any).autoTable({
        head: [['Type', 'Team', 'Name', 'Roll No', 'Branch', 'Mobile', 'Email']],
        body: rows.map(r => [r.type, r.teamName, r.name, r.rollNo, r.branch, r.mobileNumber, r.email]),
        startY: 22,
      });
      doc.save(`${fileName}.pdf`);
      toast.success("Exported as PDF!");
    } else if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows.map(r => ({
        Type: r.type,
        Team: r.teamName,
        Name: r.name,
        'Roll No': r.rollNo,
        Branch: r.branch,
        Mobile: r.mobileNumber,
        Email: r.email,
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      toast.success("Exported as Excel!");
    } else if (format === "csv") {
      const headers = ['Type', 'Team', 'Name', 'Roll No', 'Branch', 'Mobile', 'Email'];
      const csvLines = [
        headers.join(','),
        ...rows.map(r =>
          [r.type, r.teamName, r.name, r.rollNo, r.branch, r.mobileNumber, r.email]
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ];
      const csv = csvLines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported as CSV!");
    }
  };

  const handleExport = (format: "pdf" | "xlsx" | "csv") => {
    if (!allEvents || allEvents.length === 0) { toast.error("No events to export."); return; }
    const data = allEvents.map((event: any) => ({
      name: event.name,
      venue: event.venue,
      startDate: new Date(event.startDate).toLocaleString(),
      endDate: new Date(event.endDate).toLocaleString(),
      status: event.status,
      participants: event.registrations.length,
    }));
    if (format === "pdf") {
      const doc = new jsPDF();
      doc.text("Event Report", 14, 16);
      (doc as any).autoTable({ head: [['Name', 'Venue', 'Start Date', 'End Date', 'Status', 'Participants']], body: data.map(Object.values), startY: 20 });
      doc.save("events.pdf");
      toast.success("Exported as PDF!");
    } else if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Events");
      XLSX.writeFile(wb, "events.xlsx");
      toast.success("Exported as Excel!");
    } else if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute("download", "events.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported as CSV!");
    }
  };

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Check-In', label: 'Check-In', href: '/admin-checkin', icon: ScanLine, gradient: 'from-teal-500 to-cyan-500', iconColor: 'text-teal-500' },
    { name: 'Tickets', label: 'Tickets', href: '/admin-tickets', icon: Ticket, gradient: 'from-amber-500 to-yellow-500', iconColor: 'text-amber-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    const routes: Record<string, string> = { Dashboard: '/admin-dashboard', Events: '/admin-events', 'Check-In': '/admin-checkin', Tickets: '/admin-tickets', Team: '/admin-team', Settings: '/admin-settings' };
    if (routes[itemName]) navigate(routes[itemName]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10">
        <header className="border-b-2 border-black dark:border-white/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">EVENT ADMIN DASHBOARD</h1>
            {(() => {
              try {
                const s = sessionStorage.getItem("adminUser");
                if (s) { const p = JSON.parse(s); if (p?.role === "admin") return (
                  <Button
                    className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-8 py-4 border-2 border-black dark:border-white"
                    size="lg"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    CREATE EVENT
                  </Button>
                ); }
              } catch {}
              return (
                <div className="px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-amber-400 text-black border-2 border-black">
                  Team Member — View Only
                </div>
              );
            })()}
          </div>
        </header>

        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        </div>

        <div className="container mx-auto px-4 py-8 pt-20">
          {!allEvents ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : allEvents.length === 0 ? (
            <Card className="border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2 tracking-tighter">NO EVENTS FOUND</h3>
                <p className="text-lg font-medium text-muted-foreground">No events have been created yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event: any) => (
                <Card key={event._id} className="border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2 tracking-tighter uppercase">{event.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                    <div className="space-y-2 text-sm">
                      <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                      <p><strong>Venue:</strong> {event.venue}</p>
                      <div className="flex items-center gap-2">
                        <strong>Status:</strong>
                        {(() => {
                          try {
                            const s = sessionStorage.getItem("adminUser");
                            if (s) { const p = JSON.parse(s); if (p?.role === "admin") return (
                              <select
                                value={event.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value as "active" | "completed" | "cancelled";
                                  try {
                                    const result = await updateEventAsAdmin({ id: event._id, status: newStatus });
                                    if (result?.success) toast.success(`Status updated to ${newStatus}`);
                                    else toast.error(result?.message || "Failed to update status");
                                  } catch { toast.error("Failed to update status"); }
                                }}
                                className="border-2 border-black dark:border-white bg-background text-foreground text-xs font-mono px-2 py-1 cursor-pointer focus:outline-none"
                              >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ); }
                          } catch {}
                          return <span className="text-xs font-bold uppercase px-2 py-1 border-2 border-black dark:border-white bg-muted">{event.status}</span>;
                        })()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t-2 border-black dark:border-white bg-muted/20">
                    <div className="flex gap-2 w-full">
                      <Button onClick={() => handleInfoClick(event)} variant="outline" size="sm" className="flex-1 border-2 border-black dark:border-white font-mono">
                        <Info className="h-4 w-4 mr-1" />INFO
                      </Button>
                      {(() => {
                        try {
                          const s = sessionStorage.getItem("adminUser");
                          if (s) { const p = JSON.parse(s); if (p?.role === "admin") return (<>
                            <Button onClick={() => handleEditClick(event)} variant="outline" size="sm" className="flex-1 border-2 border-black dark:border-white font-mono">
                              <Edit className="h-4 w-4 mr-1" />EDIT
                            </Button>
                            <Button onClick={() => handleDeleteClick(event)} variant="outline" size="sm" className="flex-1 border-2 border-black dark:border-white font-mono text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                              <Trash2 className="h-4 w-4 mr-1" />DELETE
                            </Button>
                          </>); }
                        } catch {}
                        return null;
                      })()}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onOpenChange={setCreateModalOpen}
          allUsers={allUsers || []}
        />

        {/* Edit Modal */}
        {selectedEvent && (
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-2xl bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">EDIT EVENT</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                <div>
                  <Label className="font-bold">EVENT NAME</Label>
                  <Input name="eventName" defaultValue={selectedEvent.name} className="border-2 border-black dark:border-white font-mono mt-1" required />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="font-bold">DESCRIPTION</Label>
                    <button
                      type="button"
                      onClick={handleEnhanceEditDescription}
                      disabled={isEnhancingEdit || !editDescription.trim()}
                      className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black dark:border-white bg-[#6D28D9] text-white hover:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]"
                    >
                      {isEnhancingEdit ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Enhancing...</>
                      ) : (
                        <>✨ Enhance</>
                      )}
                    </button>
                  </div>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="border-2 border-black dark:border-white font-mono mt-1"
                  />
                </div>
                <div>
                  <Label className="font-bold">VENUE</Label>
                  <Input name="venue" defaultValue={selectedEvent.venue} className="border-2 border-black dark:border-white font-mono mt-1" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold">DATE</Label>
                    <Input name="eventDate" type="date" defaultValue={new Date(selectedEvent.startDate).toISOString().split('T')[0]} className="border-2 border-black dark:border-white font-mono mt-1" required />
                  </div>
                  <div>
                    <Label className="font-bold">TIME</Label>
                    <Input name="eventTime" type="time" defaultValue={new Date(selectedEvent.startDate).toTimeString().slice(0,5)} className="border-2 border-black dark:border-white font-mono mt-1" required />
                  </div>
                </div>
                <div>
                  <Label className="font-bold">MAX PARTICIPANTS</Label>
                  <Input name="maxParticipants" type="number" defaultValue={selectedEvent.maxParticipants || ''} className="border-2 border-black dark:border-white font-mono mt-1" />
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSubmitting} className="border-2 border-black dark:border-white font-mono">CANCEL</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white font-mono">
                    {isSubmitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />SAVING...</> : 'SAVE CHANGES'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Modal */}
        {selectedEvent && (
          <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
            <DialogContent className="max-w-md bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">DELETE EVENT</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  Are you sure you want to delete "{selectedEvent.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isSubmitting} className="flex-1 border-2 border-black dark:border-white font-mono">CANCEL</Button>
                <Button onClick={handleDeleteConfirm} disabled={isSubmitting} className="flex-1 bg-red-600 text-white hover:bg-red-700 font-mono border-2 border-red-600">
                  {isSubmitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />DELETING...</> : 'DELETE EVENT'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Info Modal with Individual + Team Participants */}
        {selectedEvent && (
          <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
            <DialogContent className="min-w-[1100px] max-w-[95vw] w-auto max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">EVENT PARTICIPANTS</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                      {selectedEvent.name} — Individual & Team registrations
                    </DialogDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-sm px-4 py-2 border-2 border-black dark:border-white rounded-none" size="sm">
                        <Download className="mr-2 h-4 w-4" />EXPORT
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-none border-2 border-black dark:border-white bg-white dark:bg-black font-mono p-0">
                      <DropdownMenuItem onClick={() => handleParticipantExport('pdf')} className="rounded-none font-mono uppercase text-xs font-bold px-4 py-3 border-b border-black/20 dark:border-white/20 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer">
                        PDF EXPORT
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleParticipantExport('xlsx')} className="rounded-none font-mono uppercase text-xs font-bold px-4 py-3 border-b border-black/20 dark:border-white/20 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer">
                        EXCEL EXPORT (.XLSX)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleParticipantExport('csv')} className="rounded-none font-mono uppercase text-xs font-bold px-4 py-3 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer">
                        CSV EXPORT (.CSV)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-8">
                {participantsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2 text-lg font-bold">LOADING...</span>
                  </div>
                ) : (
                  <>
                    {/* Individual Participants */}
                    <div>
                      <h3 className="text-lg font-bold uppercase mb-3 border-b-2 border-black dark:border-white pb-2">
                        Individual Registrations ({participants?.length || 0})
                      </h3>
                      {participants && participants.length > 0 ? (
                        <div className="border-2 border-black dark:border-white">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-b-2 border-black dark:border-white">
                                <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">NAME</TableHead>
                                <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">ROLL NO</TableHead>
                                <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">BRANCH</TableHead>
                                <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">MOBILE</TableHead>
                                <TableHead className="font-bold text-black dark:text-white">EMAIL</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {participants.map((p: any) => (
                                <TableRow key={p._id}>
                                  <TableCell className="border-r-2 border-black dark:border-white">{p.user?.name || 'N/A'}</TableCell>
                                  <TableCell className="border-r-2 border-black dark:border-white">{p.user?.rollNo || 'N/A'}</TableCell>
                                  <TableCell className="border-r-2 border-black dark:border-white">{p.user?.branch || 'N/A'}</TableCell>
                                  <TableCell className="border-r-2 border-black dark:border-white">{p.user?.mobileNumber || 'N/A'}</TableCell>
                                  <TableCell>{p.user?.email || 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-black dark:border-white bg-muted/20">
                          <p className="text-sm font-bold text-muted-foreground">NO INDIVIDUAL REGISTRATIONS</p>
                        </div>
                      )}
                    </div>

                    {/* Team Registrations */}
                    <div>
                      <h3 className="text-lg font-bold uppercase mb-3 border-b-2 border-black dark:border-white pb-2">
                        Team Registrations ({teamRegistrations?.length || 0} teams)
                      </h3>
                      {teamRegistrations && teamRegistrations.length > 0 ? (
                        <div className="space-y-4">
                          {teamRegistrations.map((tr: any) => (
                            <div key={tr._id} className="border-2 border-black dark:border-white">
                              <div className="bg-muted/30 px-4 py-2 border-b-2 border-black dark:border-white flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="font-bold uppercase text-sm">{tr.teamName}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{tr.members.length} member{tr.members.length !== 1 ? 's' : ''}</span>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent border-b-2 border-black dark:border-white">
                                    <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">NAME</TableHead>
                                    <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">ROLL NO</TableHead>
                                    <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">BRANCH</TableHead>
                                    <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">MOBILE</TableHead>
                                    <TableHead className="font-bold text-black dark:text-white">EMAIL</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {tr.members.map((m: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="border-r-2 border-black dark:border-white">{m.name || 'N/A'}</TableCell>
                                      <TableCell className="border-r-2 border-black dark:border-white">{m.rollNo || 'N/A'}</TableCell>
                                      <TableCell className="border-r-2 border-black dark:border-white">{m.branch || 'N/A'}</TableCell>
                                      <TableCell className="border-r-2 border-black dark:border-white">{m.mobileNumber || 'N/A'}</TableCell>
                                      <TableCell>{m.email || 'N/A'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-black dark:border-white bg-muted/20">
                          <p className="text-sm font-bold text-muted-foreground">NO TEAM REGISTRATIONS</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default function AdminEvents() {
  const navigate = useNavigate();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminEventsContent />
    </ThemeProvider>
  );
}