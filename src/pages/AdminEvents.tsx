import React, { useState } from 'react';
import { MenuBar } from '@/components/ui/glow-menu';
import {
  Home,
  Calendar,
  Users,
  Settings,
  Bell,
  Plus,
  Trash2,
  FileDown,
  Search,
  Filter,
  X,
  Loader2,
  Info,
  Edit,
  CheckSquare,
  Square
} from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider } from 'next-themes';
import { useQuery, useMutation } from 'convex/react';
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
import { Download } from "lucide-react";
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
  const navigate = useNavigate();

  const allEvents = useQuery(api.events.getAllEventsWithDetails);
  const allUsers = useQuery(api.users.listAll);
  const teamMembers = useQuery(api.team.getAllTeamMembers);
  const updateEventAsAdmin = useMutation(api.events.updateEventAsAdmin);
  const deleteEventAsAdmin = useMutation(api.events.deleteEventAsAdmin);

  // Get participants for the selected event
  const participants = useQuery(
    api.events.getEventParticipants,
    selectedEvent ? { eventId: selectedEvent._id } : "skip"
  );

  const participantsLoading = participants === undefined && selectedEvent !== null;

  const toggleVolunteer = (volunteerId: Id<"teamMembers">) => {
    setSelectedVolunteers(prev =>
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  // Format volunteer display for better UX
  const formatVolunteerDisplay = (volunteer: any) => {
    const name = volunteer.name || 'Unknown Name';
    const branch = volunteer.branch || 'N/A';
    const rollNo = volunteer.rollNo || 'N/A';
    
    // Show branch and roll number if available
    if (branch !== 'N/A' && rollNo !== 'N/A') {
      return `${name} (${branch} - ${rollNo})`;
    }
    return name;
  };

  const handleInfoClick = (event: any) => {
    setSelectedEvent(event);
    setInfoModalOpen(true);
  };

  const handleEditClick = (event: any) => {
    setSelectedEvent(event);
    // Pre-populate volunteers for editing - convert from users to team members if needed
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
      const description = formData.get("description") as string;
      const venue = formData.get("venue") as string;
      const eventDate = formData.get("eventDate") as string;
      const eventTime = formData.get("eventTime") as string;
      const maxParticipants = formData.get("maxParticipants") as string;

      const startDate = new Date(eventDate + "T" + eventTime).getTime();
      const endDate = startDate + (2 * 60 * 60 * 1000); // Default 2 hours

      // Get admin info from session storage
      const adminUser = JSON.parse(sessionStorage.getItem("adminUser") || "{}");
      if (!adminUser.email) {
        toast.error("Admin session expired. Please log in again.");
        return;
      }

      if (!selectedEvent) {
        toast.error("No event selected for editing.");
        return;
      }

      const result = await updateEventAsAdmin({
        eventId: selectedEvent._id,
        adminEmail: adminUser.email,
        name: eventName,
        description: description || "",
        venue: venue,
        startDate: startDate,
        endDate: endDate,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        volunteerIds: selectedVolunteers,
      });

      if (result.success) {
        toast.success(result.message);
        setEditModalOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Event update error:", error);
      toast.error("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);

    try {
      const adminData = sessionStorage.getItem("adminUser");
      if (!adminData) {
        toast.error("Admin session expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      const admin = JSON.parse(adminData);

      const result = await deleteEventAsAdmin({
        eventId: selectedEvent._id,
        adminEmail: admin.email,
      });

      if (result.success) {
        toast.success(result.message);
        setDeleteModalOpen(false);
        setSelectedEvent(null);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Event deletion error:", error);
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (format: "pdf" | "xlsx" | "csv") => {
    if (!allEvents || allEvents.length === 0) {
      toast.error("No events to export.");
      return;
    }

    const data = allEvents.map(event => ({
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
      (doc as any).autoTable({
        head: [['Name', 'Venue', 'Start Date', 'End Date', 'Status', 'Participants']],
        body: data.map(Object.values),
        startY: 20,
      });
      doc.save("events.pdf");
      toast.success("Exported as PDF!");
    } else if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Events");
      XLSX.writeFile(workbook, "events.xlsx");
      toast.success("Exported as Excel!");
    } else if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "events.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported as CSV!");
    }
  };

  const handleParticipantExport = (format: "pdf" | "xlsx" | "csv") => {
    if (!selectedEvent) {
      toast.error("No event selected for export.");
      return;
    }

    // Prepare event details data
    const eventData = {
      'Event Name': selectedEvent.name,
      'Description': selectedEvent.description || 'N/A',
      'Venue/Location': selectedEvent.venue,
      'Start Date': new Date(selectedEvent.startDate).toLocaleDateString(),
      'Start Time': new Date(selectedEvent.startDate).toLocaleTimeString(),
      'End Date': new Date(selectedEvent.endDate).toLocaleDateString(),
      'End Time': new Date(selectedEvent.endDate).toLocaleTimeString(),
      'Status': selectedEvent.status.toUpperCase(),
      'Max Participants': selectedEvent.maxParticipants || 'Unlimited',
      'Current Participants': participants?.length || 0,
      'Created Date': new Date(selectedEvent._creationTime).toLocaleDateString(),
    };

    const eventName = selectedEvent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${eventName}_details`;

    if (format === "pdf") {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(selectedEvent.name, 14, 20);
      
      // Event Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      let yPosition = 35;
      
      Object.entries(eventData).forEach(([key, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${key}:`, 14, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), 70, yPosition);
        yPosition += 10;
      });
      
      doc.save(`${fileName}.pdf`);
      toast.success("Event details exported as PDF!");
      
    } else if (format === "xlsx") {
      // Create data in key-value format for Excel
      const worksheetData = Object.entries(eventData).map(([key, value]) => ({
        'Field': key,
        'Value': value
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Event Details");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      toast.success("Event details exported as Excel!");
      
    } else if (format === "csv") {
      // Create CSV with field names and values
      const csvData = Object.entries(eventData).map(([key, value]) => `"${key}","${value}"`).join('\n');
      const csvContent = 'Field,Value\n' + csvData;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Event details exported as CSV!");
    }
  };

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

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
              <Button 
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-8 py-4 border-2 border-black dark:border-white"
                size="lg"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                CREATE EVENT
              </Button>
            </div>
          </div>
        </header>

        {/* Floating Navbar */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        </div>

        <div className="container mx-auto px-4 py-8 pt-20">
          {/* Events Display */}
          {!allEvents ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : allEvents.length === 0 ? (
            <Card className="border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2 tracking-tighter">NO EVENTS FOUND</h3>
                <p className="text-lg font-medium text-muted-foreground">
                  No events have been created yet. Click "CREATE EVENT" to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event) => (
                <Card key={event._id} className="border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2 tracking-tighter uppercase">{event.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                    <div className="space-y-2 text-sm">
                      <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                      <p><strong>Venue:</strong> {event.venue}</p>
                      <p><strong>Status:</strong> {event.status}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t-2 border-black dark:border-white bg-muted/20">
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => handleInfoClick(event)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-2 border-black dark:border-white font-mono"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        INFO
                      </Button>
                      <Button
                        onClick={() => handleEditClick(event)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-2 border-black dark:border-white font-mono"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        EDIT
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(event)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-2 border-black dark:border-white font-mono text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        DELETE
                      </Button>
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

        {/* Edit Event Modal */}
        {selectedEvent && (
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">EDIT EVENT</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  Update the event details below. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editEventName" className="text-sm font-bold mb-2 block">
                      EVENT TITLE *
                    </Label>
                    <Input 
                      id="editEventName"
                      name="eventName" 
                      defaultValue={selectedEvent.name}
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      placeholder="Enter the event title (e.g., Annual Sports Day)"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editVenue" className="text-sm font-bold mb-2 block">
                      EVENT LOCATION *
                    </Label>
                    <Input 
                      id="editVenue"
                      name="venue" 
                      defaultValue={selectedEvent.venue}
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      placeholder="Enter venue (e.g., Main Auditorium, Room 101)"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editEventDate" className="text-sm font-bold mb-2 block">
                      EVENT DATE *
                    </Label>
                    <Input 
                      id="editEventDate"
                      name="eventDate" 
                      type="date"
                      defaultValue={new Date(selectedEvent.startDate).toISOString().split('T')[0]}
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      required
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Select the date when the event will take place</p>
                  </div>
                  <div>
                    <Label htmlFor="editEventTime" className="text-sm font-bold mb-2 block">
                      START TIME *
                    </Label>
                    <Input 
                      id="editEventTime"
                      name="eventTime" 
                      type="time"
                      defaultValue={new Date(selectedEvent.startDate).toTimeString().slice(0, 5)}
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      required
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Set the event start time (24-hour format)</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="editMaxParticipants" className="text-sm font-bold mb-2 block">
                    MAXIMUM PARTICIPANTS
                  </Label>
                  <Input 
                    id="editMaxParticipants"
                    name="maxParticipants" 
                    type="number"
                    defaultValue={selectedEvent.maxParticipants}
                    className="border-2 border-black dark:border-white font-mono text-base p-3"
                    placeholder="Enter maximum number of participants (optional)"
                    min="1"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited participants</p>
                </div>

                <div>
                  <Label htmlFor="editDescription" className="text-sm font-bold mb-2 block">
                    EVENT DESCRIPTION *
                  </Label>
                  <Textarea 
                    id="editDescription"
                    name="description" 
                    defaultValue={selectedEvent.description}
                    className="border-2 border-black dark:border-white font-mono text-base p-3 min-h-[120px]"
                    placeholder="Provide a detailed description of the event, including objectives, activities, and any special instructions..."
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Describe what the event is about and what participants can expect</p>
                </div>

                <div>
                  <Label className="text-sm font-bold mb-3 block">ASSIGNED VOLUNTEERS</Label>
                  <p className="text-xs text-muted-foreground mb-2">Select team members who will help manage this event</p>
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
                            <div className="font-medium text-sm">{formatVolunteerDisplay(volunteer)}</div>
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

                <DialogFooter className="flex gap-3 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 border-2 border-black dark:border-white font-mono text-base py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={isSubmitting}
                  >
                    CANCEL
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-base py-3 border-2 border-black dark:border-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        UPDATING...
                      </>
                    ) : (
                      'SAVE CHANGES'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Modal */}
        {selectedEvent && (
          <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
            <DialogContent className="max-w-md bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">DELETE EVENT</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  Are you sure you want to delete "{selectedEvent.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 border-2 border-black dark:border-white font-mono text-base py-3"
                  disabled={isSubmitting}
                >
                  CANCEL
                </Button>
                <Button 
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 font-mono text-base py-3 border-2 border-red-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      DELETING...
                    </>
                  ) : (
                    'DELETE EVENT'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Info Modal with Participants Table */}
        {selectedEvent && (
          <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
            <DialogContent className="min-w-[1200px] max-w-[95vw] w-auto max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">EVENT PARTICIPANTS</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-2">
                      {selectedEvent.name} - Registered participants and their details
                    </DialogDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-sm px-4 py-2 border-2 border-black dark:border-white"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        EXPORT
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem onClick={() => handleParticipantExport('pdf')}>
                        📄 Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleParticipantExport('xlsx')}>
                        📊 Export as Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleParticipantExport('csv')}>
                        📑 Export as CSV (.csv)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogHeader>

              <div className="mt-6">
                {participantsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2 text-lg font-bold">LOADING PARTICIPANTS...</span>
                  </div>
                ) : participants && participants.length > 0 ? (
                  <div className="border-2 border-black dark:border-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b-2 border-black dark:border-white">
                          <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">NAME</TableHead>
                          <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">ROLL NO</TableHead>
                          <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">BRANCH</TableHead>
                          <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">MOBILE NUMBER</TableHead>
                          <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">EMAIL ADDRESS</TableHead>
                          <TableHead className="font-bold text-black dark:text-white border-r-2 border-black dark:border-white">PAYMENT STATUS</TableHead>
                          <TableHead className="font-bold text-black dark:text-white">REGISTRATION DATE</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((participant) => (
                          <TableRow key={participant._id} className="border-b-2 border-black dark:border-white">
                            <TableCell className="font-medium border-r-2 border-black dark:border-white">{participant.name || 'N/A'}</TableCell>
                            <TableCell className="border-r-2 border-black dark:border-white">{participant.rollNo || 'N/A'}</TableCell>
                            <TableCell className="border-r-2 border-black dark:border-white">{participant.branch || 'N/A'}</TableCell>
                            <TableCell className="border-r-2 border-black dark:border-white">{participant.mobileNumber || 'N/A'}</TableCell>
                            <TableCell className="border-r-2 border-black dark:border-white">{participant.email || 'N/A'}</TableCell>
                            <TableCell className="border-r-2 border-black dark:border-white">
                              <span className={`px-2 py-1 text-xs font-bold border-2 ${
                                participant.paymentStatus === 'Completed' 
                                  ? 'bg-green-400 text-black border-black' 
                                  : 'bg-yellow-400 text-black border-black'
                              }`}>
                                {participant.paymentStatus}
                              </span>
                            </TableCell>
                            <TableCell>{new Date(participant.registrationDate).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-black dark:border-white bg-gray-100 dark:bg-gray-800">
                    <p className="text-lg font-bold">NO PARTICIPANTS REGISTERED</p>
                    <p className="text-sm text-muted-foreground mt-2">This event has no registered participants yet.</p>
                  </div>
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