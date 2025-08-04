import React from 'react';
import { Button } from './button';
import { motion } from 'framer-motion';
import { Id } from '@/convex/_generated/dataModel';

interface Member {
  _id: Id<"teamMembers">;
  name: string;
  rollNo: string;
  branch: string;
  phone: string;
  email: string;
  role?: string;
  volunteerEvents?: Id<"events">[];
}

interface MemberCardProps {
  member: Member;
  onEdit: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit }) => {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
          <p className="text-gray-600 dark:text-gray-400">{member.role || 'Volunteer'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Roll No:</strong> {member.rollNo}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Branch:</strong> {member.branch}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Phone:</strong> {member.phone}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Email:</strong> {member.email}
        </p>
      </div>
    </motion.div>
  );
};

export default MemberCard;