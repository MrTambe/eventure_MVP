import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MenuBar } from "@/components/ui/glow-menu";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ThemeProvider, useTheme } from 'next-themes';
import { Home, Calendar, Users, Settings, Plus } from "lucide-react";
import MemberCard from "@/components/ui/member-card";
import { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";

interface AdminUser {
  _id: Id<"admins">;
  email: string;
  name?: string;
}

function AdminTeamContent() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState("Team");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    branch: "",
    phone: "",
    email: "",
    role: "Volunteer",
    volunteerEvents: [] as Id<"events">[],
  });

  // Fetch data
  const teamMembers = useQuery(api.team.getAllTeamMembers);
  const events = useQuery(api.events.getAllEvents);

  // Mutations
  const addTeamMember = useMutation(api.team.addTeamMember);
  const updateTeamMember = useMutation(api.team.updateTeamMember);
  const deleteTeamMember = useMutation(api.team.deleteTeamMember);

  // Load admin user from session storage
  useEffect(() => {
    const adminData = sessionStorage.getItem("adminUser");
    if (adminData) {
      setAdminUser(JSON.parse(adminData));
    }
  }, []);

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

  const resetForm = () => {
    setFormData({
      name: "",
      rollNo: "",
      branch: "",
      phone: "",
      email: "",
      role: "Volunteer",
      volunteerEvents: [],
    });
  };

  const handleAddMember = async () => {
    try {
      const result = await addTeamMember(formData);
      if (result.success) {
        toast.success(result.message);
        setIsAddModalOpen(false);
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to add team member. Please try again.");
    }
  };

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      rollNo: member.rollNo,
      branch: member.branch,
      phone: member.phone,
      email: member.email,
      role: member.role || "Volunteer",
      volunteerEvents: member.volunteerEvents || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    try {
      const result = await updateTeamMember({
        memberId: editingMember._id,
        ...formData,
      });
      if (result.success) {
        toast.success(result.message);
        setIsEditModalOpen(false);
        setEditingMember(null);
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update team member. Please try again.");
    }
  };

  const handleDeleteMember = async (memberId: Id<"teamMembers">) => {
    if (window.confirm("Are you sure you want to delete this team member?")) {
      try {
        const result = await deleteTeamMember({ memberId });
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to delete team member. Please try again.");
      }
    }
  };

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    switch (itemName) {
      case 'Dashboard':
        navigate('/admin-dashboard');
        break;
      case 'Events':
        navigate('/admin-events');
        break;
      case 'Team':
        navigate('/admin-team');
        break;
      case 'Settings':
        navigate('/admin-settings');
        break;
      default:
        break;
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <header className="border-b-2 border-black dark:border-white/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">TEAM MANAGEMENT</h1>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold">{getCurrentDate()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">ADMIN PANEL</div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-lg">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border-2 border-black dark:border-white">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </header>

        {/* Floating Navbar */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        </div>

        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">TEAM MEMBERS</h2>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-6 py-3 border-2 border-black dark:border-white"
                >
                  <Plus className="mr-2 h-5 w-5" /> ADD MEMBER
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold tracking-tight">ADD NEW TEAM MEMBER</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-bold mb-2 block">NAME</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="border-2 border-black dark:border-white font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rollNo" className="text-sm font-bold mb-2 block">ROLL NO</Label>
                    <Input
                      id="rollNo"
                      value={formData.rollNo}
                      onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                      placeholder="Enter roll number"
                      className="border-2 border-black dark:border-white font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch" className="text-sm font-bold mb-2 block">BRANCH</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="Enter branch"
                      className="border-2 border-black dark:border-white font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-bold mb-2 block">PHONE</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter 10-digit phone number"
                      className="border-2 border-black dark:border-white font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-bold mb-2 block">EMAIL</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className="border-2 border-black dark:border-white font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-sm font-bold mb-2 block">ROLE</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className="border-2 border-black dark:border-white font-mono">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Volunteer">Volunteer</SelectItem>
                        <SelectItem value="Coordinator">Coordinator</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="border-2 border-black dark:border-white font-mono"
                    >
                      CANCEL
                    </Button>
                    <Button 
                      onClick={handleAddMember}
                      className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono border-2 border-black dark:border-white"
                    >
                      ADD MEMBER
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers === undefined ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
                <p className="text-lg font-bold mt-4">LOADING TEAM MEMBERS...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <h2 className="text-2xl font-bold text-gray-600 mb-2">NO TEAM MEMBERS</h2>
                <p className="text-gray-500">Add team members to get started.</p>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member._id}
                  onMouseEnter={() => setHoveredCard(member._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <MemberCard
                    member={member}
                    onEdit={() => handleEditMember(member)}
                    isHovered={hoveredCard === member._id}
                  />
                </div>
              ))
            )}
          </div>

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-md bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">EDIT TEAM MEMBER</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-bold mb-2 block">NAME</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="border-2 border-black dark:border-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rollNo" className="text-sm font-bold mb-2 block">ROLL NO</Label>
                  <Input
                    id="edit-rollNo"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="Enter roll number"
                    className="border-2 border-black dark:border-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-branch" className="text-sm font-bold mb-2 block">BRANCH</Label>
                  <Input
                    id="edit-branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="Enter branch"
                    className="border-2 border-black dark:border-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone" className="text-sm font-bold mb-2 block">PHONE</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter 10-digit phone number"
                    className="border-2 border-black dark:border-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email" className="text-sm font-bold mb-2 block">EMAIL</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="border-2 border-black dark:border-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role" className="text-sm font-bold mb-2 block">ROLE</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="border-2 border-black dark:border-white font-mono">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Volunteer">Volunteer</SelectItem>
                      <SelectItem value="Coordinator">Coordinator</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="border-2 border-black dark:border-white font-mono"
                  >
                    CANCEL
                  </Button>
                  <Button 
                    onClick={handleUpdateMember}
                    className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono border-2 border-black dark:border-white"
                  >
                    UPDATE MEMBER
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default function AdminTeam() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminTeamContent />
    </ThemeProvider>
  );
}