import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Badge } from './badge';
import { Phone, Mail, User, MapPin, Trash2, Edit } from 'lucide-react';
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
      className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-lg shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#4a5568] p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-3 mr-4">
              <User className="h-6 w-6 text-gray-800 dark:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black dark:text-white">{member.name || 'Unknown'}</h3>
              <p className="text-gray-600 dark:text-gray-400">{member.role || 'No role assigned'}</p>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-sm">{member.branch || 'N/A'}</Badge>
        </div>

        <div className="space-y-3 text-sm mb-6">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Mail className="h-4 w-4 mr-3 text-gray-500" />
            <span>{member.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Phone className="h-4 w-4 mr-3 text-gray-500" />
            <span>{member.phone || 'No phone provided'}</span>
          </div>
        </div>

        {member.volunteerEvents && member.volunteerEvents.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-black dark:text-white">Volunteering In:</h4>
            <div className="flex flex-wrap gap-2">
              {member.volunteerEvents.map((event, index) => (
                <Badge key={index} variant="outline" className="font-mono">{event}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
};

export default MemberCard;