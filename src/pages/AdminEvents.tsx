import React, { useState } from 'react';
import { MenuBar } from '@/components/ui/glow-menu';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Settings,
  Bell,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';
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

function AdminEventsContent() {
  const [activeMenuItem, setActiveMenuItem] = useState("Events");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Id<"users">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allEvents = useQuery(api.events.getAllEventsWithDetails);
  const allUsers = useQuery(api.users.listAll);
  const updateEventAsAdmin = useMutation(api.events.updateEventAsAdmin);
  const deleteEventAsAdmin = useMutation(api.events.deleteEventAsAdmin);

  // Get participants for the selected event
  const participants = useQuery(
    api.events.getEventParticipants,
    selectedEvent ? { eventId: selectedEvent._id } : "skip"
  );

  const toggleVolunteer = (volunteerId: Id<"users">) => {
    setSelectedVolunteers(prev =>
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const handleInfoClick = (event: any) => {
    setSelectedEvent(event);
    setInfoModalOpen(true);
  };

  const handleEditClick = (event: any) => {
    setSelectedEvent(event);
    // Pre-populate volunteers for editing
    const eventVolunteerIds = event.volunteers?.map((v: any) => v._id) || [];
    setSelectedVolunteers(eventVolunteerIds);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (event: any) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const formData = new FormData(e.currentTarget);
    const eventName = formData.get("eventName") as string;
    const venue = formData.get("venue") as string;
    const eventDate = formData.get("eventDate") as string;
    const eventTime = formData.get("eventTime") as string;
    const description = formData.get("description") as string;
    const maxParticipants = formData.get("maxParticipants") as string;

    if (!eventName?.trim() || !venue?.trim() || !eventDate || !eventTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const adminData = sessionStorage.getItem("adminUser");
      if (!adminData) {
        toast.error("Admin session expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      const admin = JSON.parse(adminData);
      
      // Combine date and time to create timestamps
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);
      const startDate = eventDateTime.getTime();
      const endDate = startDate + (2 * 60 * 60 * 1000); // 2 hours later

      const result = await updateEventAsAdmin({
        eventId: selectedEvent._id,
        adminEmail: admin.email,
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
        setSelectedEvent(null);
        setSelectedVolunteers([]);
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

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin-dashboard", gradient: "from-blue-500 to-purple-600", iconColor: "text-blue-400" },
    { name: "Events", icon: CalendarIcon, label: "Events", href: "#", gradient: "from-green-500 to-cyan-600", iconColor: "text-green-400" },
    { name: "Users", icon: Users, label: "Users", href: "#", gradient: "from-red-500 to-orange-600", iconColor: "text-red-400" },
    { name: "Settings", icon: Settings, label: "Settings", href: "#", gradient: "from-yellow-500 to-amber-600", iconColor: "text-yellow-400" },
    { name: "Notifications", icon: Bell, label: "Notifications", href: "#", gradient: "from-pink-500 to-rose-600", iconColor: "text-pink-400" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-8 py-4 border-2 border-black dark:border-white"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    EXPORT
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    Export as Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Floating Navbar */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
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
                  <p className="text-xs text-muted-foreground mb-2">Select users who will help manage this event</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-black dark:border-white p-3 bg-muted/20">
                    {allUsers?.map((volunteer) => (
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
                          <div className="font-medium text-sm">{volunteer.name || 'Unnamed User'}</div>
                          <div className="text-xs text-muted-foreground">{volunteer.email}</div>
                        </div>
                      </div>
                    ))}
                    {(!allUsers || allUsers.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">No users available for volunteer assignment</p>
                    )}
                  </div>
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
                <DialogTitle className="text-2xl font-bold tracking-tight">EVENT PARTICIPANTS</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  {selectedEvent.name} - Registered participants and their details
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-6">
                {!participants ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading participants...</span>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium text-muted-foreground">
                      No participants registered for this event yet.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-black dark:border-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b-2 border-black dark:border-white">
                          <TableHead className="font-bold text-foreground border-r-2 border-black dark:border-white">Name</TableHead>
                          <TableHead className="font-bold text-foreground border-r-2 border-black dark:border-white">Roll No</TableHead>
                          <TableHead className="font-bold text-foreground border-r-2 border-black dark:border-white">Branch</TableHead>
                          <TableHead className="font-bold text-foreground border-r-2 border-black dark:border-white">Mobile Number</TableHead>
                          <TableHead className="font-bold text-foreground border-r-2 border-black dark:border-white">Email Address</TableHead>
                          <TableHead className="font-bold text-foreground border-r-2 border-black dark:border-white">Payment Status</TableHead>
                          <TableHead className="font-bold text-foreground">Registration Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((participant) => (
                          <TableRow key={participant._id} className="border-b border-black dark:border-white">
                            <TableCell className="font-medium border-r border-black dark:border-white">
                              {participant.name || 'N/A'}
                            </TableCell>
                            <TableCell className="border-r border-black dark:border-white">
                              {participant.rollNo || 'N/A'}
                            </TableCell>
                            <TableCell className="border-r border-black dark:border-white">
                              {participant.branch || 'N/A'}
                            </TableCell>
                            <TableCell className="border-r border-black dark:border-white">
                              {participant.mobileNumber || 'N/A'}
                            </TableCell>
                            <TableCell className="border-r border-black dark:border-white">
                              {participant.email || 'N/A'}
                            </TableCell>
                            <TableCell className="border-r border-black dark:border-white">
                              <span className={`px-2 py-1 text-xs font-bold rounded ${
                                participant.paymentStatus === 'Completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {participant.paymentStatus}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(participant.registrationDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button 
                  onClick={() => setInfoModalOpen(false)}
                  className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-base py-3 border-2 border-black dark:border-white"
                >
                  CLOSE
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default function AdminEvents() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminEventsContent />
    </ThemeProvider>
  );
}