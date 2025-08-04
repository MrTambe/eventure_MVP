import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, Users, FileText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  onOpenChange?: (open: boolean) => void;
  allUsers?: any[];
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  onOpenChange,
  allUsers = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    eventDate: '',
    eventTime: '',
    maxParticipants: '',
    volunteerIds: [] as Id<"users">[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<Id<"users">>>(new Set());

  const createEvent = useMutation(api.events.createEvent);
  
  // Fetch team members for volunteer assignment
  const teamMembers = useQuery(api.team.getAllTeamMembers);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVolunteerToggle = (volunteerId: Id<"users">, isChecked: boolean) => {
    const newSelectedVolunteers = new Set(selectedVolunteers);
    
    if (isChecked) {
      newSelectedVolunteers.add(volunteerId);
    } else {
      newSelectedVolunteers.delete(volunteerId);
    }
    
    setSelectedVolunteers(newSelectedVolunteers);
    setFormData(prev => ({
      ...prev,
      volunteerIds: Array.from(newSelectedVolunteers)
    }));
  };

  const handleClose = () => {
    onClose();
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.venue || !formData.eventDate || !formData.eventTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      await createEvent({
        name: formData.name,
        description: formData.description || '',
        venue: formData.venue,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        volunteerIds: formData.volunteerIds,
      });

      toast.success('Event created successfully!');
      if (onEventCreated) {
        onEventCreated();
      }
      handleClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        venue: '',
        eventDate: '',
        eventTime: '',
        maxParticipants: '',
        volunteerIds: [],
      });
      setSelectedVolunteers(new Set());
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVolunteerDisplay = (member: any) => {
    const name = member.name || 'Unknown Name';
    const branch = member.branch || 'N/A';
    const rollNo = member.rollNo || 'N/A';
    return `${name} (${branch} - ${rollNo})`;
  };

  // Convert team members to users format for volunteer selection
  const availableVolunteers = React.useMemo(() => {
    if (!teamMembers) return [];
    
    // Map team members to user format, assuming they have corresponding user accounts
    return teamMembers.map(member => ({
      _id: member._id as unknown as Id<"users">, // Type assertion for compatibility
      name: member.name,
      branch: member.branch,
      rollNo: member.rollNo,
      role: member.role,
    }));
  }, [teamMembers]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border-4 border-black dark:border-white max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-black dark:border-white">
              <h2 className="text-2xl font-bold text-black dark:text-white">Create New Event</h2>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-black dark:text-white">
                  Event Name *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter event name"
                    className="pl-10 border-2 border-black dark:border-white rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-black dark:text-white">
                  Description
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Event description"
                    className="pl-10 border-2 border-black dark:border-white rounded-lg min-h-[100px]"
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="venue" className="text-sm font-semibold text-black dark:text-white">
                  Venue *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="Event venue"
                    className="pl-10 border-2 border-black dark:border-white rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Date and Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate" className="text-sm font-semibold text-black dark:text-white">
                    Event Date *
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    className="border-2 border-black dark:border-white rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime" className="text-sm font-semibold text-black dark:text-white">
                    Event Time *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="eventTime"
                      type="time"
                      value={formData.eventTime}
                      onChange={(e) => handleInputChange('eventTime', e.target.value)}
                      className="pl-10 border-2 border-black dark:border-white rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label htmlFor="maxParticipants" className="text-sm font-semibold text-black dark:text-white">
                  Max Participants
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                    placeholder="100"
                    className="pl-10 border-2 border-black dark:border-white rounded-lg"
                  />
                </div>
              </div>

              {/* Assign Volunteers */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Assign Volunteers ({selectedVolunteers.size} selected)
                </Label>
                <div className="border-2 border-black dark:border-white rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                  {teamMembers === undefined ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading volunteers...</p>
                    </div>
                  ) : !availableVolunteers || availableVolunteers.length === 0 ? (
                    <div className="text-center py-4">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No volunteers available. Please add them under /admin-teams or /admin-settings.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableVolunteers.map((volunteer) => (
                        <div key={volunteer._id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <Checkbox
                            id={`volunteer-${volunteer._id}`}
                            checked={selectedVolunteers.has(volunteer._id)}
                            onCheckedChange={(checked) => handleVolunteerToggle(volunteer._id, checked as boolean)}
                            className="border-2 border-black dark:border-white"
                          />
                          <label
                            htmlFor={`volunteer-${volunteer._id}`}
                            className="flex-1 text-sm font-medium text-black dark:text-white cursor-pointer"
                          >
                            {formatVolunteerDisplay(volunteer)}
                          </label>
                          {volunteer.role && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                              {volunteer.role}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-2 border-black dark:border-white rounded-lg py-3 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white rounded-lg py-3 font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-black mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};