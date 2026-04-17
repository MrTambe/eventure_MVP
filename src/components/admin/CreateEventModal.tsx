// @ts-nocheck
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Users, CheckSquare, Square, Sparkles, Loader2, Image as ImageIcon, LayoutTemplate, ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { EVENT_TEMPLATES, EventTemplate } from "@/data/event-templates";
import { motion, AnimatePresence } from "framer-motion";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  allUsers: any[];
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
    imageUrl: "",
  });

  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<Id<"teamMembers">>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const createEvent = useMutation(api.events.createEventAsAdmin);
  const teamMembers = useQuery(api.team.getAllTeamMembers);
  const enhanceDescription = useAction(api.ai.enhanceEventDescription);
  const generateImage = useAction(api.ai.generateEventImageUrl);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      venue: "",
      eventDate: "",
      eventTime: "",
      maxParticipants: "",
      volunteerIds: [],
      eventType: "individual",
      imageUrl: "",
    });
    setSelectedVolunteers(new Set());
    setShowTemplates(false);
    onClose();
  };

  const handleTemplateSelect = (template: EventTemplate) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      venue: template.venue || prev.venue,
      imageUrl: template.imageUrl,
    }));
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied!`);
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
      if (!formData.name.trim() || !formData.venue.trim() || !formData.eventDate || !formData.eventTime) {
        toast.error("Please fill in all required fields");
        return;
      }

      const volunteerIds = Array.from(selectedVolunteers);

      let adminEmail: string | undefined = undefined;
      try {
        const adminSession = sessionStorage.getItem("adminUser");
        if (adminSession) {
          const parsed = JSON.parse(adminSession);
          if (parsed?.email) adminEmail = parsed.email as string;
        }
      } catch {}

      const result = await createEvent({
        name: formData.name.trim(),
        description: formData.description.trim(),
        venue: formData.venue.trim(),
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        volunteerIds,
        eventType: formData.eventType,
        imageUrl: formData.imageUrl.trim() || undefined,
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

  const handleEnhanceDescription = async () => {
    if (!formData.description.trim()) {
      toast.error("Please write a description first");
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await enhanceDescription({ description: formData.description });
      if (result.success && result.enhanced) {
        setFormData(prev => ({ ...prev, description: result.enhanced }));
        toast.success("Description enhanced!");
      } else {
        toast.error(result.error || "Failed to enhance description");
      }
    } catch (err: any) {
      toast.error(err?.message || "Enhancement failed");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter an event name first");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const result = await generateImage({ eventName: formData.name });
      if (result.success && result.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
        toast.success("Image generated!");
      } else {
        toast.error(result.error || "Failed to generate image");
      }
    } catch (err: any) {
      toast.error(err?.message || "Image generation failed");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const formatVolunteerDisplay = (member: any) => {
    const name = member.name || 'Unknown Name';
    const parts = [member.branch, member.rollNo].filter(Boolean);
    return parts.length > 0 ? `${name} (${parts.join(' - ')})` : name;
  };

  const availableVolunteers = React.useMemo(() => {
    return teamMembers || [];
  }, [teamMembers]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {showTemplates ? "CHOOSE A TEMPLATE" : "CREATE NEW EVENT"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showTemplates ? (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="flex items-center gap-1.5 mb-4 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to form
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EVENT_TEMPLATES.map((template, idx) => (
                  <motion.button
                    key={template.name}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleTemplateSelect(template)}
                    className="group text-left border-2 border-black dark:border-white bg-card hover:bg-muted/50 transition-all overflow-hidden shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:shadow-[1px_1px_0px_#000] dark:hover:shadow-[1px_1px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    {template.imageUrl && (
                      <div className="w-full h-24 overflow-hidden border-b-2 border-black dark:border-white">
                        <img
                          src={template.imageUrl}
                          alt={template.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-black uppercase tracking-tight">{template.name}</h4>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 border border-black dark:border-white bg-muted text-muted-foreground">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Templates Button */}
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-black dark:border-white text-sm font-black uppercase tracking-wider hover:bg-muted/50 transition-all"
              >
                <LayoutTemplate className="h-4 w-4" />
                Use a Template
              </button>

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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">EVENT DESCRIPTION</Label>
                    <button
                      type="button"
                      onClick={handleEnhanceDescription}
                      disabled={isEnhancing || !formData.description.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border-2 border-black dark:border-white bg-[#6D28D9] text-white hover:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:shadow-[1px_1px_0px_#000] dark:hover:shadow-[1px_1px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                      {isEnhancing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {isEnhancing ? "Enhancing..." : "Enhance with AI"}
                    </button>
                  </div>
                  <Textarea
                    placeholder="Describe the event..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="border-2 border-black dark:border-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">EVENT IMAGE (OPTIONAL)</Label>
                    <button
                      type="button"
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || !formData.name.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border-2 border-black dark:border-white bg-[#6D28D9] text-white hover:bg-[#5B21B6] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:shadow-[1px_1px_0px_#000] dark:hover:shadow-[1px_1px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ImageIcon className="h-3 w-3" />
                      )}
                      {isGeneratingImage ? "Generating..." : "Generate Image"}
                    </button>
                  </div>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    className="border-2 border-black dark:border-white"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 border-2 border-black dark:border-white rounded-lg overflow-hidden">
                      <img
                        src={formData.imageUrl}
                        alt="Event preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

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
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}