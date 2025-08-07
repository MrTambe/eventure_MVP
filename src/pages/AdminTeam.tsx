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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Users, UserCheck, UserX, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TeamUser = NonNullable<ReturnType<typeof useQuery<typeof api.team.getCombinedTeamWithProfileStatus>>>[0];

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, className }: { 
  icon: React.ElementType; 
  title: string; 
  value: number; 
  className?: string; 
}) => (
  <div className={`bg-white text-black border-4 border-black shadow-[8px_8px_0px_#000] p-6 font-mono ${className}`}>
    <div className="flex items-center space-x-4">
      <Icon className="h-8 w-8" />
      <div>
        <p className="text-sm font-bold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

// Brutalist-style Card for each team user
const TeamUserCard = ({ user, onEdit, onDelete }: { user: TeamUser; onEdit: (user: TeamUser) => void; onDelete: (user: TeamUser) => void; }) => {
  return (
    <div className="bg-white text-black border-4 border-black shadow-[8px_8px_0px_#000] p-6 flex flex-col justify-between font-mono">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold uppercase tracking-tighter">{user.name}</h3>
          <div className="flex flex-col items-end space-y-2">
            <div
              className={`text-sm font-bold border-2 border-black px-2 py-1 ${
                user.isProfileComplete ? 'bg-green-400' : 'bg-red-400'
              }`}
            >
              {user.isProfileComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}
            </div>
            <div className="text-xs font-bold bg-yellow-400 border-2 border-black px-2 py-1 uppercase">
              {user.type}
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-bold">BRANCH:</span> {user.branch || 'N/A'}</p>
          <p><span className="font-bold">ROLL NO:</span> {user.rollNo || 'N/A'}</p>
          <p><span className="font-bold">EMAIL:</span> {user.email}</p>
          <p><span className="font-bold">MOBILE:</span> {user.mobileNumber || 'N/A'}</p>
        </div>
      </div>
      <div className="flex space-x-2 mt-6">
        <Button
          onClick={() => onEdit(user)}
          className="w-full bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 font-bold text-lg"
        >
          [ EDIT PROFILE ]
        </Button>
        <Button
          onClick={() => onDelete(user)}
          className="w-auto bg-red-500 text-white border-2 border-black rounded-none hover:bg-red-700 font-bold text-lg px-4"
        >
          [ DELETE ]
        </Button>
      </div>
    </div>
  );
};

// Edit Modal Component
const EditProfileModal = ({
  user,
  isOpen,
  onClose,
}: {
  user: TeamUser | null;
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
  const updateTeamMember = useMutation(api.team.updateTeamMemberProfile);
  const updateAdmin = useMutation(api.team.updateAdminProfile);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        branch: user.branch || '',
        rollNo: user.rollNo || '',
        mobileNumber: user.mobileNumber || '',
        department: user.type === 'teammember' ? user.department || '' : '',
      });
    }
  }, [user]);

  if (!user) return null;

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
      const loggedInAdmin = JSON.parse(adminUserString);
      if (loggedInAdmin.role !== 'admin') {
        toast.error('Authorization error. Admin access required.');
        setIsSubmitting(false);
        return;
      }

      if (user.type === 'teammember') {
        await updateTeamMember({
          teamMemberId: user._id as Id<'teamMembers'>,
          adminId: loggedInAdmin._id,
          ...formData,
        });
      } else { // user.type === 'admin'
        const { department, ...adminFormData } = formData;
        await updateAdmin({
          adminToUpdateId: user._id as Id<'admins'>,
          loggedInAdminId: loggedInAdmin._id,
          ...adminFormData,
        });
      }

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
          <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">Edit Profile: {user.name}</DialogTitle>
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
          {user.type === 'teammember' && (
            <div>
              <Label htmlFor="department" className="font-bold text-sm">DEPARTMENT</Label>
              <Input id="department" value={formData.department} onChange={handleChange} className="rounded-none border-2 border-black" />
            </div>
          )}
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

// Create User Modal Component
const CreateUserModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teammember'>('teammember');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createUserAction = useMutation(api.user_creation.createUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createUserAction({ email, password, role });
      toast.success(`User ${email} created successfully as a ${role}.`);
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setRole('teammember');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black border-4 border-black shadow-[8px_8px_0px_#000] font-mono rounded-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email-create" className="font-bold text-sm">EMAIL</Label>
            <Input id="email-create" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-none border-2 border-black" required />
          </div>
          <div>
            <Label htmlFor="password-create" className="font-bold text-sm">PASSWORD</Label>
            <Input id="password-create" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-none border-2 border-black" required />
          </div>
          <div>
            <Label htmlFor="role-create" className="font-bold text-sm">ROLE</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'teammember') => setRole(value)}>
              <SelectTrigger className="rounded-none border-2 border-black">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="font-mono rounded-none border-2 border-black bg-white">
                <SelectItem value="teammember">Team Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="!justify-start pt-4">
            <Button type="submit" disabled={isSubmitting} className="bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 font-bold text-lg">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'CREATE USER'}
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
  const teamUsers = useQuery(api.team.getCombinedTeamWithProfileStatus);
  const deleteUserMutation = useMutation(api.team.deleteUser);
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TeamUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (user: TeamUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteClick = (user: TeamUser) => {
    setUserToDelete(user);
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const adminUserString = sessionStorage.getItem('adminUser');
      if (!adminUserString) {
        toast.error('Authentication error. Please sign in again.');
        setIsDeleting(false);
        return;
      }
      const loggedInAdmin = JSON.parse(adminUserString);
      if (loggedInAdmin.role !== 'admin') {
        toast.error('Authorization error. Admin access required.');
        setIsDeleting(false);
        return;
      }

      await deleteUserMutation({
        userIdToDelete: userToDelete._id,
        userType: userToDelete.type,
        loggedInAdminId: loggedInAdmin._id,
      });

      toast.success(`User ${userToDelete.name} has been deleted.`);
      setUserToDelete(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!teamUsers) return { total: 0, complete: 0, incomplete: 0 };
    
    const complete = teamUsers.filter(user => user.isProfileComplete).length;
    const incomplete = teamUsers.length - complete;
    
    return {
      total: teamUsers.length,
      complete,
      incomplete,
    };
  }, [teamUsers]);

  if (teamUsers === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="font-mono text-xl font-bold">LOADING TEAM DATA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold uppercase tracking-tighter font-mono">Team Management</h1>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 font-bold text-lg flex items-center space-x-2"
        >
          <PlusCircle className="h-6 w-6" />
          <span>[ CREATE USER ]</span>
        </Button>
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard icon={Users} title="Total Users" value={stats.total} />
        <StatsCard icon={UserCheck} title="Complete Profiles" value={stats.complete} className="bg-green-100" />
        <StatsCard icon={UserX} title="Incomplete Profiles" value={stats.incomplete} className="bg-red-100" />
      </div>

      {teamUsers.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-black">
            <p className="font-mono text-2xl font-bold">NO TEAM MEMBERS OR ADMINS FOUND.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {teamUsers.map((user) => (
            <TeamUserCard key={user._id} user={user} onEdit={handleEdit} onDelete={handleDeleteClick} />
          ))}
        </div>
      )}
      <EditProfileModal user={selectedUser} isOpen={isEditModalOpen} onClose={handleCloseEditModal} />
      <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && handleCancelDelete()}>
        <AlertDialogContent className="bg-white text-black border-4 border-black shadow-[8px_8px_0px_#000] font-mono rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold uppercase tracking-tighter">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete the user account for{' '}
              <span className="font-bold">{userToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!justify-start pt-4">
            <AlertDialogCancel 
                onClick={handleCancelDelete}
                className="border-2 border-black rounded-none font-bold text-lg"
            >
                CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-500 text-white border-2 border-black rounded-none hover:bg-red-700 font-bold text-lg"
            >
                {isDeleting ? <Loader2 className="animate-spin" /> : 'YES, DELETE USER'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}