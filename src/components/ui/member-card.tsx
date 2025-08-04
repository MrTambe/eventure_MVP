import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Badge } from './badge';
import { Phone, Mail, User, Trash2, Edit, MapPin } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface MemberCardProps {
  member: {
    _id: Id<"teamMembers">;
    name: string;
    branch: string;
    phone: string;
    email: string;
    role?: string;
    volunteerEvents?: string[];
  };
  onEdit: (member: MemberCardProps['member']) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit }) => {
  const deleteTeamMember = useMutation(api.team.deleteTeamMember);

  // Add null/undefined check for member
  if (!member) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await deleteTeamMember({ memberId: member._id });
      toast.success("Team member deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete team member.");
      console.error("Failed to delete team member:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{member.name || 'Unknown'}</h3>
            <p className="text-sm text-muted-foreground">{member.role || 'No role assigned'}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {member.branch || 'N/A'}
        </Badge>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <a 
            href={`mailto:${member.email}`} 
            className="text-foreground hover:text-primary hover:underline transition-colors"
          >
            {member.email || 'No email provided'}
          </a>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <a 
            href={`tel:${member.phone}`} 
            className="text-foreground hover:text-primary hover:underline transition-colors"
          >
            {member.phone || 'No phone provided'}
          </a>
        </div>
      </div>

      {/* Volunteer Events */}
      {member.volunteerEvents && member.volunteerEvents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Volunteering Events:</h4>
          <div className="flex flex-wrap gap-2">
            {member.volunteerEvents.map((event, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {event}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t border-border">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(member)}
          className="text-xs"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          className="text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
};

export default MemberCard;