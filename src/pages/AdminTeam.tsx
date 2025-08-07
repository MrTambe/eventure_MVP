import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type TeamMember = NonNullable<ReturnType<typeof useQuery<typeof api.team.getTeamMembersWithProfileStatus>>>[0];

// Brutalist-style Card for each team member
const TeamMemberCard = ({ member, onEdit }: { member: TeamMember; onEdit: (member: TeamMember) => void }) => {
  return (
    <div className="bg-white text-black border-4 border-black shadow-[8px_8px_0px_#000] p-6 flex flex-col justify-between font-mono">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold uppercase tracking-tighter">{member.name}</h3>
          <div
            className={`text-sm font-bold border-2 border-black px-2 py-1 ${
              member.isProfileComplete ? 'bg-green-400' : 'bg-red-400'
            }`}
          >
            {member.isProfileComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-bold">BRANCH:</span> {member.branch || 'N/A'}</p>
          <p><span className="font-bold">ROLL NO:</span> {member.rollNo || 'N/A'}</p>
          <p><span className="font-bold">EMAIL:</span> {member.email}</p>
          <p><span className="font-bold">MOBILE:</span> {(member as any).mobileNumber || 'N/A'}</p>
        </div>
      </div>
      <Button
        onClick={() => onEdit(member)}
        className="w-full mt-6 bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 font-bold text-lg"
      >
        [ EDIT PROFILE ]
      </Button>
    </div>
  );
};

// Edit Modal Component
const EditProfileModal = ({
  member,
  isOpen,
  onClose,
}: {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    rollNo: '',
    mobileNumber: '',
    department: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateProfile = useMutation(api.team.updateTeamMemberProfile);

  React.useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        branch: member.branch || '',
        rollNo: member.rollNo || '',
        mobileNumber: (member as any).mobileNumber || '',
        department: member.department || '',
      });
    }
  }, [member]);

  if (!member) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const adminUserString = sessionStorage.getItem('adminUser');
      if (!adminUserString) {
        toast.error('Authentication error. Please sign in again.');
        setIsSubmitting(false);
        return;
      }
      const adminUser = JSON.parse(adminUserString);
      if (adminUser.role !== 'admin') {
        toast.error('Authorization error. Admin access required.');
        setIsSubmitting(false);
        return;
      }

      await updateProfile({
        teamMemberId: member._id,
        ...formData,
        adminId: adminUser._id,
      });
      toast.success(`Profile for ${formData.name} updated successfully!`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black border-4 border-black shadow-[8px_8px_0px_#000] font-mono rounded-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">Edit Profile: {member.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="font-bold text-sm">NAME</Label>
            <Input id="name" value={formData.name} onChange={handleChange} className="rounded-none border-2 border-black" />
          </div>
          <div>
            <Label htmlFor="branch" className="font-bold text-sm">BRANCH</Label>
            <Input id="branch" value={formData.branch} onChange={handleChange} className="rounded-none border-2 border-black" />
          </div>
          <div>
            <Label htmlFor="rollNo" className="font-bold text-sm">ROLL NO</Label>
            <Input id="rollNo" value={formData.rollNo} onChange={handleChange} className="rounded-none border-2 border-black" />
          </div>
          <div>
            <Label htmlFor="mobileNumber" className="font-bold text-sm">MOBILE NUMBER</Label>
            <Input id="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="rounded-none border-2 border-black" />
          </div>
          <div>
            <Label htmlFor="department" className="font-bold text-sm">DEPARTMENT</Label>
            <Input id="department" value={formData.department} onChange={handleChange} className="rounded-none border-2 border-black" />
          </div>
          <DialogFooter className="!justify-start pt-4">
            <Button type="submit" disabled={isSubmitting} className="bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 font-bold text-lg">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'SAVE CHANGES'}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-2 border-black rounded-none font-bold text-lg">
                CANCEL
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminTeam() {
  const teamMembers = useQuery(api.team.getTeamMembersWithProfileStatus);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  if (teamMembers === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-gray-100 min-h-screen">
      <h1 className="text-5xl font-bold uppercase tracking-tighter mb-8 font-mono">Team Management</h1>
      {teamMembers.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-black">
            <p className="font-mono text-2xl font-bold">NO TEAM MEMBERS FOUND.</p>
            <p className="font-mono text-lg">Add members via the admin dashboard to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <TeamMemberCard key={member._id} member={member} onEdit={handleEdit} />
          ))}
        </div>
      )}
      <EditProfileModal member={selectedMember} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}