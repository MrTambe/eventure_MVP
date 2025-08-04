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
      className="bg-gray-100 dark:bg-gray-800 border-4 border-black dark:border-white rounded-2xl p-8 space-y-6 shadow-lg max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-black dark:text-white">Team Member</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Member details and contact information</p>
      </div>

      {/* Member Information Fields */}
      <div className="space-y-4">
        {/* Name Field */}
        <div className="bg-white dark:bg-gray-700 border-3 border-black dark:border-white rounded-xl p-4">
          <div className="text-lg font-semibold text-black dark:text-white">
            {member.name || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Name
          </div>
        </div>

        {/* Role Field */}
        <div className="bg-white dark:bg-gray-700 border-3 border-black dark:border-white rounded-xl p-4">
          <div className="text-lg font-semibold text-black dark:text-white">
            {member.role || 'No role assigned'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Role
          </div>
        </div>

        {/* Branch Field */}
        <div className="bg-white dark:bg-gray-700 border-3 border-black dark:border-white rounded-xl p-4">
          <div className="text-lg font-semibold text-black dark:text-white">
            {member.branch || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Branch
          </div>
        </div>

        {/* Mobile Number Field */}
        <div className="bg-white dark:bg-gray-700 border-3 border-black dark:border-white rounded-xl p-4">
          <a 
            href={`tel:${member.phone}`} 
            className="text-lg font-semibold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            {member.phone || 'No phone provided'}
          </a>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Mobile Number
          </div>
        </div>

        {/* Email Address Field */}
        <div className="bg-white dark:bg-gray-700 border-3 border-black dark:border-white rounded-xl p-4">
          <a 
            href={`mailto:${member.email}`} 
            className="text-lg font-semibold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer break-all"
          >
            {member.email || 'No email provided'}
          </a>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Email Address
          </div>
        </div>

        {/* Volunteer Events Field */}
        {member.volunteerEvents && member.volunteerEvents.length > 0 && (
          <div className="bg-white dark:bg-gray-700 border-3 border-black dark:border-white rounded-xl p-4">
            <div className="flex flex-wrap gap-2">
              {member.volunteerEvents.map((event, index) => (
                <Badge key={index} variant="outline" className="text-xs font-medium">
                  {event}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
              Volunteer Events
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button 
          onClick={() => onEdit(member)}
          className="flex-1 bg-white dark:bg-gray-700 border-3 border-black dark:border-white rounded-xl py-4 text-black dark:text-white font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          variant="outline"
        >
          <Edit className="h-5 w-5 mr-2" />
          Edit Member
        </Button>
        <Button 
          onClick={handleDelete}
          className="flex-1 bg-red-500 border-3 border-black dark:border-white rounded-xl py-4 text-white font-bold text-lg hover:bg-red-600 transition-colors"
          variant="destructive"
        >
          <Trash2 className="h-5 w-5 mr-2" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
};

export default MemberCard;