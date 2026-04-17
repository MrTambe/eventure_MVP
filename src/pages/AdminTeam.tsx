/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import MemberCard from "@/components/ui/member-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Home, Calendar, Settings, Ticket, ScanLine } from "lucide-react";
import { MenuBar } from "@/components/ui/glow-menu";
import { useNavigate } from "react-router";

type CombinedAdmin = {
  _id: Id<"admins">;
  name?: string;
  email: string;
  role: string;
  branch?: string;
  rollNo?: string;
  mobileNumber?: string;
  type: "admin";
  isProfileComplete: boolean;
};

type CombinedTeamMember = {
  _id: Id<"teamMembers">;
  userId: Id<"users">;
  name: string;
  email: string;
  role: string;
  department?: string;
  branch?: string;
  rollNo?: string;
  mobileNumber?: string;
  joinedAt: number;
  type: "teammember";
  isProfileComplete: boolean;
};

type CombinedUser = CombinedAdmin | CombinedTeamMember;

export default function AdminTeam() {
  const combined = useQuery(api.team.getCombinedTeamWithProfileStatus);
  const updateTeamMember = useMutation(api.team.updateTeamMemberProfile);
  const updateAdmin = useMutation(api.team.updateAdminProfile);

  // Admin session (from AdminProtected/sessionStorage)
  const [adminSession, setAdminSession] = useState<{ _id: string; role: string } | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem("adminUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAdminSession({ _id: parsed._id, role: String(parsed.role || "").toLowerCase().trim() });
      } catch {
        setAdminSession(null);
      }
    }
  }, []);

  const isAdmin = adminSession?.role === "admin";

  // Hover state for team member cards
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  // ADD: Navigation state and handlers for Glow Menu
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState("Team");

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Check-In', label: 'Check-In', href: '/admin-checkin', icon: ScanLine, gradient: 'from-teal-500 to-cyan-500', iconColor: 'text-teal-500' },
    { name: 'Tickets', label: 'Tickets', href: '/admin-tickets', icon: Ticket, gradient: 'from-amber-500 to-yellow-500', iconColor: 'text-amber-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    switch (itemName) {
      case 'Dashboard':
        navigate('/admin-dashboard');
        break;
      case 'Events':
        navigate('/admin-events');
        break;
      case 'Check-In':
        navigate('/admin-checkin');
        break;
      case 'Team':
        navigate('/admin-team');
        break;
      case 'Tickets':
        navigate('/admin-tickets');
        break;
      case 'Settings':
        navigate('/admin-settings');
        break;
      default:
        break;
    }
  };

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    branch: "",
    rollNo: "",
    mobileNumber: "",
    department: "", // team member only
  });

  const admins = useMemo(() => (combined ? (combined as CombinedUser[]).filter(u => u.type === "admin") as CombinedAdmin[] : []), [combined]);
  const teamMembers = useMemo(() => (combined ? (combined as CombinedUser[]).filter(u => u.type === "teammember") as CombinedTeamMember[] : []), [combined]);

  const openEdit = (user: CombinedUser) => {
    if (!isAdmin) {
      toast.error("Only admins can edit profiles.");
      return;
    }
    setSelectedUser(user);
    setForm({
      name: user.name || "",
      branch: user.branch || "",
      rollNo: user.rollNo || "",
      mobileNumber: user.mobileNumber || "",
      department: user.type === "teammember" ? (user.department || "") : "",
    });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setSelectedUser(null);
  };

  const saveEdit = async () => {
    if (!selectedUser || !adminSession?._id) return;

    try {
      if (selectedUser.type === "teammember") {
        await updateTeamMember({
          teamMemberId: selectedUser._id,
          name: form.name || undefined,
          branch: form.branch || undefined,
          rollNo: form.rollNo || undefined,
          mobileNumber: form.mobileNumber || undefined,
          department: form.department || undefined,
          adminId: adminSession._id as Id<"admins">,
        });
      } else {
        await updateAdmin({
          adminToUpdateId: selectedUser._id,
          name: form.name || undefined,
          branch: form.branch || undefined,
          rollNo: form.rollNo || undefined,
          mobileNumber: form.mobileNumber || undefined,
          loggedInAdminId: adminSession._id as Id<"admins">,
        });
      }
      toast.success("Profile updated successfully");
      closeEdit();
    } catch (e) {
      toast.error((e as Error).message || "Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <header className="border-b-4 border-black dark:border-white p-4 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">TEAM MANAGEMENT</h1>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 border-2 border-black dark:border-white uppercase text-xs font-extrabold">
              {isAdmin ? "Admin" : "Team"}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Loading state */}
        {combined === undefined && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-black dark:border-white mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading team...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {combined && (combined as CombinedUser[]).length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-900 border-4 border-black dark:border-white p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-3" />
            <h2 className="font-black text-xl tracking-tight">NO TEAM MEMBERS YET</h2>
            <p className="text-sm text-muted-foreground mt-1">Add admins or team members to get started.</p>
          </div>
        )}

        {combined && (combined as CombinedUser[]).length > 0 && (
          <div className="space-y-10">
            {/* Admins Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black tracking-tight">ADMINS</h2>
                <div className="text-xs font-bold text-muted-foreground">
                  {admins.length} {admins.length === 1 ? "admin" : "admins"}
                </div>
              </div>
              {admins.length === 0 ? (
                <div className="text-sm text-muted-foreground">No admins found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {admins.map((admin) => (
                    <div
                      key={admin._id}
                      className="relative bg-white dark:bg-gray-800 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] transition-all duration-300 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-black uppercase">{admin.name || admin.email.split("@")[0]}</h3>
                          <div className="mt-1 text-xs font-bold text-muted-foreground break-all">{admin.email}</div>
                        </div>
                        <div className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black ${admin.isProfileComplete ? "bg-green-400 text-black" : "bg-red-400 text-black"}`}>
                          {admin.isProfileComplete ? "Complete" : "Incomplete"}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="border-2 border-black dark:border-white p-2">
                          <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Branch</div>
                          <div className="font-bold">{admin.branch || "—"}</div>
                        </div>
                        <div className="border-2 border-black dark:border-white p-2">
                          <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Roll No</div>
                          <div className="font-bold">{admin.rollNo || "—"}</div>
                        </div>
                        <div className="border-2 border-black dark:border-white p-2">
                          <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Mobile</div>
                          <div className="font-bold">{admin.mobileNumber || "—"}</div>
                        </div>
                        <div className="border-2 border-black dark:border-white p-2">
                          <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Role</div>
                          <div className="font-bold uppercase">{admin.role}</div>
                        </div>
                      </div>
                      {(() => {
                        try {
                          const s = sessionStorage.getItem("adminUser");
                          if (s) { const p = JSON.parse(s); if (p?.role === "admin") return (
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                className="w-full border-2 border-black dark:border-white font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                                onClick={() => openEdit(admin)}
                              >
                                EDIT
                              </Button>
                            </div>
                          ); }
                        } catch {}
                        return null;
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Team Members Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black tracking-tight">TEAM MEMBERS</h2>
                <div className="text-xs font-bold text-muted-foreground">
                  {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"}
                </div>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No team members found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMembers.map((member) => (
                    <div
                      key={member._id}
                      onMouseEnter={() => setHoveredMemberId(String(member._id))}
                      onMouseLeave={() => setHoveredMemberId(null)}
                    >
                      <div className="mb-2">
                        <div className={`inline-block px-2 py-1 text-[10px] font-black uppercase border-2 border-black ${member.isProfileComplete ? "bg-green-400 text-black" : "bg-red-400 text-black"}`}>
                          {member.isProfileComplete ? "Complete" : "Incomplete"}
                        </div>
                      </div>
                      <MemberCard
                        member={{
                          _id: member._id,
                          name: member.name,
                          rollNo: member.rollNo || "—",
                          branch: member.branch || "—",
                          phone: member.mobileNumber || "—",
                          email: member.email,
                          role: member.role || "Volunteer",
                          volunteerEvents: [] as Id<"events">[],
                        }}
                        onEdit={() => openEdit(member)}
                        isHovered={hoveredMemberId === String(member._id)}
                        hideEdit={!isAdmin}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-black border-4 border-black dark:border-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {selectedUser?.type === "teammember" ? "Edit Team Member" : "Edit Admin"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-bold">NAME</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="border-2 border-black dark:border-white"
                placeholder="Enter full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-bold">BRANCH</Label>
                <Input
                  value={form.branch}
                  onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                  className="border-2 border-black dark:border-white"
                  placeholder="e.g., CSE"
                />
              </div>
              <div>
                <Label className="text-sm font-bold">ROLL NO</Label>
                <Input
                  value={form.rollNo}
                  onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))}
                  className="border-2 border-black dark:border-white"
                  placeholder="e.g., 23XX123"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold">MOBILE NUMBER</Label>
              <Input
                value={form.mobileNumber}
                onChange={(e) => setForm((p) => ({ ...p, mobileNumber: e.target.value }))}
                className="border-2 border-black dark:border-white"
                placeholder="e.g., 9876543210"
              />
            </div>

            {selectedUser?.type === "teammember" && (
              <div>
                <Label className="text-sm font-bold">DEPARTMENT</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  className="border-2 border-black dark:border-white"
                  placeholder="e.g., Operations"
                />
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <Button
                onClick={saveEdit}
                className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-base py-3 border-2 border-black dark:border-white"
              >
                SAVE
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 border-2 border-black dark:border-white font-mono text-base py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}