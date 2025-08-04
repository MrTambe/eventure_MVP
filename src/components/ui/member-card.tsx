import React, { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative cursor-pointer"
    >
      <motion.div
        animate={{
          height: isHovered ? 'auto' : '220px',
          boxShadow: isHovered 
            ? '0 10px 25px rgba(0, 0, 0, 0.15)' 
            : '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-[300px] bg-gray-100 dark:bg-gray-800 border-4 border-black dark:border-white rounded-2xl p-6 overflow-hidden"
      >
        {/* Always visible content */}
        <div className="space-y-4">
          {/* Header with avatar and basic info */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white dark:bg-gray-700 border-2 border-black dark:border-white rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-black dark:text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-black dark:text-white truncate">
                {member.name || 'Unknown'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {member.role || 'No role assigned'}
              </p>
            </div>
          </div>

          {/* Branch - Always visible */}
          <div className="bg-white dark:bg-gray-700 border-2 border-black dark:border-white rounded-lg p-3">
            <div className="text-sm font-semibold text-black dark:text-white">
              {member.branch || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Branch
            </div>
          </div>
        </div>

        {/* Expandable content */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            height: isHovered ? 'auto' : 0,
            marginTop: isHovered ? 16 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="space-y-4 overflow-hidden"
        >
          {/* Phone Number */}
          <div className="bg-white dark:bg-gray-700 border-2 border-black dark:border-white rounded-lg p-3">
            <a 
              href={`tel:${member.phone}`} 
              className="text-sm font-semibold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
            >
              {member.phone || 'No phone provided'}
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Mobile Number
            </div>
          </div>

          {/* Email Address */}
          <div className="bg-white dark:bg-gray-700 border-2 border-black dark:border-white rounded-lg p-3">
            <a 
              href={`mailto:${member.email}`} 
              className="text-sm font-semibold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block break-all"
            >
              {member.email || 'No email provided'}
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Email Address
            </div>
          </div>

          {/* Volunteer Events */}
          {member.volunteerEvents && member.volunteerEvents.length > 0 && (
            <div className="bg-white dark:bg-gray-700 border-2 border-black dark:border-white rounded-lg p-3">
              <div className="flex flex-wrap gap-1">
                {member.volunteerEvents.map((event, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
                Volunteer Events
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onEdit(member)}
              className="flex-1 bg-white dark:bg-gray-700 border-2 border-black dark:border-white rounded-lg py-2 text-black dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              onClick={handleDelete}
              className="flex-1 bg-red-500 border-2 border-black dark:border-white rounded-lg py-2 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MemberCard;