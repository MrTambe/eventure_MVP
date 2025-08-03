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
  Info,
  X,
  Save,
  Download,
} from 'lucide-react';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider, useTheme } from 'next-themes';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import { ContributorsOverviewTable } from '@/components/ui/contributors-overview-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';

import { internal } from "@/convex/_generated/api";

interface EventData {
  _id: Id<"events">;
  name: string;
  description: string;
  venue: string;
  startDate: number;
  endDate: number;
  maxParticipants?: number;
  status: "active" | "cancelled" | "completed";
  volunteers?: Array<{ _id: Id<"users">; name?: string; email?: string; }>;
  registrations?: Array<any>;
}

function AdminEventsContent() {
  const { theme, setTheme } = useTheme();
  const [activeMenuItem, setActiveMenuItem] = useState("Events");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Id<"users">[]>([]);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Fetch all events and users from the database
  const allEvents = useQuery(api.events.getAllEventsWithDetails);
  const allUsers = useQuery(api.users.listAll);
  
  // Mutations
  const updateEvent = useMutation(api.events.updateEventAsAdmin);
  const deleteEvent = useMutation(api.events.deleteEventAsAdmin);

  const getEventParticipants = useQuery(
    api.events.getEventParticipants,
    selectedEvent ? { eventId: selectedEvent._id } : "skip"
  );

  const exportToSheets = useAction(internal.googleSheets.exportToGoogleSheets);

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

  // Format date for input field
  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
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

  // Handle info button click
  const handleInfoClick = async (event: EventData) => {
    setSelectedEvent(event);
    setInfoModalOpen(true);
  };

  // Handle edit button click
  const handleEditClick = (event: EventData) => {
    setSelectedEvent(event);
    setSelectedVolunteers(event.volunteers?.map(v => v._id) || []);
    setEditModalOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (event: EventData) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  // Toggle volunteer selection
  const toggleVolunteer = (userId: Id<"users">) => {
    setSelectedVolunteers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle edit form submission
  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEvent) return;

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    
    const startDateTime = new Date(formData.get('startDate') as string).getTime();
    const endDateTime = new Date(formData.get('endDate') as string).getTime();

    try {
      const adminUser = JSON.parse(sessionStorage.getItem("adminUser") || "{}");
      
      const result = await updateEvent({
        eventId: selectedEvent._id,
        adminEmail: adminUser.email,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        venue: formData.get('venue') as string,
        startDate: startDateTime,
        endDate: endDateTime,
        maxParticipants: parseInt(formData.get('maxParticipants') as string) || undefined,
        volunteerIds: selectedVolunteers,
      });

      if (result.success) {
        toast.success("Event updated successfully!");
        setEditModalOpen(false);
        setSelectedEvent(null);
        setSelectedVolunteers([]);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update event. Please try again.");
      console.error("Update event error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const adminUser = JSON.parse(sessionStorage.getItem("adminUser") || "{}");
      
      const result = await deleteEvent({
        eventId: selectedEvent._id,
        adminEmail: adminUser.email,
      });

      if (result.success) {
        toast.success("Event deleted successfully!");
        setDeleteModalOpen(false);
        setSelectedEvent(null);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete event. Please try again.");
      console.error("Delete event error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportToSheets = async () => {
    if (!selectedEvent) return;
    setIsExporting(true);
    try {
      const url = await exportToSheets({ eventId: selectedEvent._id });
      toast.success("Successfully exported to Google Sheets!");
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to export to Google Sheets.");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!selectedEvent || !getEventParticipants) return;
    
    setIsExportingExcel(true);
    try {
      // Prepare the data for Excel export
      const headers = [
        'Name',
        'Roll Number', 
        'Branch',
        'Phone Number',
        'Email Address',
        'Payment Status',
        'Registration Date'
      ];

      const data = getEventParticipants.map(participant => [
        participant.name || 'N/A',
        participant.rollNo || 'N/A',
        participant.branch || 'N/A',
        participant.mobileNumber || 'N/A',
        participant.email || 'N/A',
        participant.paymentStatus,
        new Date(participant.registrationDate).toLocaleDateString()
      ]);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

      // Set column widths for better formatting
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 15 }, // Roll Number
        { wch: 20 }, // Branch
        { wch: 15 }, // Phone Number
        { wch: 25 }, // Email Address
        { wch: 15 }, // Payment Status
        { wch: 18 }  // Registration Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add the worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

      // Generate filename with event name and current date
      const eventName = selectedEvent.name.replace(/[^a-zA-Z0-9]/g, '_');
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `participant_list_${eventName}_${currentDate}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);

      toast.success("✅ Participant data exported successfully.");
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error("❌ Failed to export data. Please try again.");
    } finally {
      setIsExportingExcel(false);
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-2 border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-950"
                            onClick={() => handleInfoClick(event)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-2 border-black dark:border-white hover:bg-blue-50 dark:hover:bg-blue-950"
                            onClick={() => handleEditClick(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-2 border-black dark:border-white text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => handleDeleteClick(event)}
                          >
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

        {/* Edit Event Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter">
                EDIT EVENT
              </DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="font-bold">EVENT NAME</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedEvent.name}
                      className="border-2 border-black dark:border-white font-mono"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="venue" className="font-bold">VENUE</Label>
                    <Input
                      id="venue"
                      name="venue"
                      defaultValue={selectedEvent.venue}
                      className="border-2 border-black dark:border-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="font-bold">DESCRIPTION</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedEvent.description}
                    className="border-2 border-black dark:border-white font-mono"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="font-bold">START DATE & TIME</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="datetime-local"
                      defaultValue={formatDateForInput(selectedEvent.startDate)}
                      className="border-2 border-black dark:border-white font-mono"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate" className="font-bold">END DATE & TIME</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="datetime-local"
                      defaultValue={formatDateForInput(selectedEvent.endDate)}
                      className="border-2 border-black dark:border-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxParticipants" className="font-bold">MAX PARTICIPANTS</Label>
                  <Input
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    defaultValue={selectedEvent.maxParticipants || ''}
                    className="border-2 border-black dark:border-white font-mono"
                    min="1"
                  />
                </div>

                {/* Volunteer Selection */}
                <div>
                  <Label className="font-bold mb-3 block">ASSIGN VOLUNTEERS</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border-2 border-black dark:border-white p-3 rounded">
                    {allUsers?.map((user) => (
                      <div key={user._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`volunteer-${user._id}`}
                          checked={selectedVolunteers.includes(user._id)}
                          onChange={() => toggleVolunteer(user._id)}
                          className="rounded border-2 border-black dark:border-white"
                        />
                        <label 
                          htmlFor={`volunteer-${user._id}`} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {user.name || user.email}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditModalOpen(false)}
                    className="border-2 border-black dark:border-white font-bold"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    CANCEL
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        UPDATING...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        UPDATE EVENT
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="max-w-md border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter text-red-600">
                DELETE EVENT
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-foreground font-medium mb-2">
                Are you sure you want to delete this event?
              </p>
              {selectedEvent && (
                <p className="text-muted-foreground text-sm">
                  <strong>"{selectedEvent.name}"</strong> will be permanently deleted along with all associated data (volunteers, registrations, certificates).
                </p>
              )}
              <p className="text-red-600 font-bold text-sm mt-3">
                This action cannot be undone.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="border-2 border-black dark:border-white font-bold"
                disabled={isSubmitting}
              >
                CANCEL
              </Button>
              <Button
                type="button"
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    DELETING...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    CONFIRM DELETE
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Info Modal */}
        <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
          <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl w-full max-h-[95vh] h-[95vh] overflow-y-auto border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-2xl font-black tracking-tighter">
                PARTICIPANT INFORMATION
              </DialogTitle>
              {selectedEvent && (
                <p className="text-muted-foreground font-medium">
                  {selectedEvent.name}
                </p>
              )}
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto">
              {getEventParticipants === undefined && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-lg font-mono">Loading participants...</span>
                </div>
              )}

              {getEventParticipants && getEventParticipants.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No participants have registered for this event yet.</p>
                </div>
              )}

              {getEventParticipants && getEventParticipants.length > 0 && (
                <ContributorsOverviewTable participants={getEventParticipants} />
              )}
            </div>

            <DialogFooter className="flex-shrink-0 mt-4 flex sm:justify-between items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-2 border-black dark:border-white font-bold"
                    disabled={isExporting || isExportingExcel}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {(isExporting || isExportingExcel) ? "Exporting..." : "EXPORT"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleExportToSheets} disabled={isExporting}>
                    Export to Google Sheets
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => alert("Placeholder: Export as CSV")}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportToExcel} disabled={isExportingExcel}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInfoModalOpen(false)}
                className="border-2 border-black dark:border-white font-bold"
              >
                <X className="h-4 w-4 mr-2" />
                CLOSE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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