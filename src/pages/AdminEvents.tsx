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
import { toast } from "sonner";
import { Id } from '@/convex/_generated/dataModel';

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

  const toggleVolunteer = (volunteerId: Id<"users">) => {
    setSelectedVolunteers(prev =>
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin-dashboard", gradient: "from-blue-500 to-purple-600", iconColor: "text-blue-400" },
    { name: "Events", icon: CalendarIcon, label: "Events", href: "/admin-events", gradient: "from-green-500 to-cyan-600", iconColor: "text-green-400" },
    { name: "Users", icon: Users, label: "Users", href: "#", gradient: "from-red-500 to-orange-600", iconColor: "text-red-400" },
    { name: "Settings", icon: Settings, label: "Settings", href: "#", gradient: "from-yellow-500 to-amber-600", iconColor: "text-yellow-400" },
    { name: "Notifications", icon: Bell, label: "Notifications", href: "#", gradient: "from-pink-500 to-rose-600", iconColor: "text-pink-400" },
  ];

  const handleEditClick = (event: any) => {
    setSelectedEvent(event);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (event: any) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const handleInfoClick = (event: any) => {
    setSelectedEvent(event);
    setInfoModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("eventName") as string;
    const description = formData.get("description") as string;
    const venue = formData.get("venue") as string;
    const startDate = new Date(formData.get("eventDate") as string).getTime();
    const endDate = new Date(formData.get("eventDate") as string).getTime() + 2 * 60 * 60 * 1000;
    const maxParticipants = formData.get("maxParticipants") ? parseInt(formData.get("maxParticipants") as string) : undefined;
    
    setIsSubmitting(true);
    try {
      const adminData = sessionStorage.getItem("adminUser");
      if (!adminData) {
        toast.error("Admin session expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }
      const admin = JSON.parse(adminData);

      const result = await updateEventAsAdmin({
        eventId: selectedEvent._id,
        adminEmail: admin.email,
        name,
        description,
        venue,
        startDate,
        endDate,
        maxParticipants,
        volunteerIds: selectedEvent.volunteers.map((v: any) => v._id),
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

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>
      <div className="relative z-10">
        <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
        
        <div className="container mx-auto px-4 py-8 pt-20">
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
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#fff] hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              CREATE EVENT
            </Button>
          </div>

          <div className="grid gap-6">
            {allEvents === undefined && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-lg font-mono">Loading events...</span>
              </div>
            )}

            {allEvents && allEvents.length === 0 && (
              <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">No Events Found</h2>
                  <p className="text-muted-foreground text-center mb-6">
                    Create your first event to get started.
                  </p>
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Event
                  </Button>
                </CardContent>
              </Card>
            )}

            {allEvents && allEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allEvents.map(event => (
                  <Card key={event._id} className="border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] flex flex-col">
                    <CardContent className="p-6 flex-grow">
                      <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                      <p className="text-muted-foreground line-clamp-3">{event.description}</p>
                      <div className="mt-4 text-sm">
                        <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                        <p><strong>Venue:</strong> {event.venue}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t-2 border-black dark:border-white flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleInfoClick(event)}>
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEditClick(event)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(event)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <CreateEventModal
          isOpen={createModalOpen}
          onOpenChange={setCreateModalOpen}
          allUsers={allUsers}
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the event.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Info Modal */}
        {selectedEvent && (
          <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedEvent.name}</DialogTitle>
              </DialogHeader>
              <div>
                <p><strong>Description:</strong> {selectedEvent.description}</p>
                <p><strong>Venue:</strong> {selectedEvent.venue}</p>
                <p><strong>Date:</strong> {new Date(selectedEvent.startDate).toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedEvent.status}</p>
              </div>
            </DialogContent>
          </Dialog>
        )}
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