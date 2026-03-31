// @ts-nocheck
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Users, CheckSquare, Square } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  allUsers: any[]; // Keep for backward compatibility but won't use
}

export function CreateEventModal({ isOpen, onClose, onOpenChange }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    venue: "",
    eventDate: "",
    eventTime: "",
    maxParticipants: "",
    volunteerIds: [] as Id<"teamMembers">[],
    eventType: "individual" as "individual" | "team",
  });

  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<Id<"teamMembers">>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEvent = useMutation(api.events.createEventAsAdmin);
  const teamMembers = useQuery(api.team.getAllTeamMembers);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: "",
      description: "",
      venue: "",
      eventDate: "",
      eventTime: "",
      maxParticipants: "",
      volunteerIds: [],
      eventType: "individual",
    });
    setSelectedVolunteers(new Set());
    onClose();
  };

  const handleVolunteerToggle = (volunteerId: Id<"teamMembers">) => {
    setSelectedVolunteers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(volunteerId)) {
        newSet.delete(volunteerId);
      } else {
        newSet.add(volunteerId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.name.trim() || !formData.venue.trim() || !formData.eventDate || !formData.eventTime) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Convert selected volunteers to array
      const volunteerIds = Array.from(selectedVolunteers);

      // Pull admin email from admin session (set by AdminSignIn)
      let adminEmail: string | undefined = undefined;
      try {
        const adminSession = sessionStorage.getItem("adminUser");
        if (adminSession) {
          const parsed = JSON.parse(adminSession);
          if (parsed?.email) adminEmail = parsed.email as string;
        }
      } catch {
        // ignore parse errors, adminEmail stays undefined
      }

      const result = await createEvent({
        name: formData.name.trim(),
        description: formData.description.trim(),
        venue: formData.venue.trim(),
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        volunteerIds,
        eventType: formData.eventType,
        // Provide adminEmail so backend can validate admin access without relying only on Convex auth identity
        adminEmail,
      });

      if (result?.success) {
        toast.success(result.message);
        handleClose();
      } else {
        toast.error(result?.message || "Failed to create event");
      }
    } catch (error: any) {
      console.error("Event creation error:", error);
      toast.error(error?.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVolunteerDisplay = (member: any) => {
    const name = member.name || 'Unknown Name';
    const parts = [member.branch, member.rollNo].filter(Boolean);
    return parts.length > 0 ? `${name} (${parts.join(' - ')})` : name;
  };

  // Memoize available volunteers from team members
  const availableVolunteers = React.useMemo(() => {
    return teamMembers || [];
  }, [teamMembers]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold tracking-tight">CREATE NEW EVENT</DialogTitle>

        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">EVENT TITLE *</Label>
              <Input
                placeholder="Enter event name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="border-2 border-black dark:border-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">EVENT LOCATION *</Label>
              <Input
                placeholder="Enter venue"
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                className="border-2 border-black dark:border-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">EVENT DESCRIPTION</Label>
            <Textarea
              placeholder="Describe the event..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="border-2 border-black dark:border-white min-h-[100px]"
            />
          </div>

          {/* Event Type Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">EVENT TYPE *</Label>
            <div className="flex gap-3">
              {(["individual", "team"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, eventType: type }))}
                  className={`flex-1 py-2 px-4 border-2 text-sm font-black uppercase transition-all ${
                    formData.eventType === type
                      ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[3px_3px_0px_#555] dark:shadow-[3px_3px_0px_#aaa]"
                      : "border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {type === "individual" ? "Individual" : "Team"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">EVENT DATE *</Label>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                className="border-2 border-black dark:border-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">START TIME *</Label>
              <Input
                type="time"
                value={formData.eventTime}
                onChange={(e) => handleInputChange('eventTime', e.target.value)}
                className="border-2 border-black dark:border-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">MAX PARTICIPANTS</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                className="border-2 border-black dark:border-white"
                min="1"
              />
            </div>
          </div>

          {/* Assign Volunteers Section */}
          <div>
            <Label className="text-sm font-bold mb-3 block">ASSIGN VOLUNTEERS</Label>
            <p className="text-xs text-muted-foreground mb-2">Select team members who will help manage this event</p>
            <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-black dark:border-white p-3 bg-muted/20">
              {teamMembers === undefined ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading volunteers...</p>
                </div>
              ) : !availableVolunteers || availableVolunteers.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No volunteers available. Please add them under /admin-teams or /admin-settings.
                  </p>
                </div>
              ) : (
                availableVolunteers.map((volunteer: any) => (
                  <div key={volunteer._id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <button
                      type="button"
                      onClick={() => handleVolunteerToggle(volunteer._id as Id<"teamMembers">)}
                      className="flex-shrink-0"
                      disabled={isSubmitting}
                    >
                      {selectedVolunteers.has(volunteer._id as Id<"teamMembers">) ? (
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
              {selectedVolunteers.size} volunteer{selectedVolunteers.size !== 1 ? 's' : ''} selected
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-2 border-black dark:border-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}