import { AdminProtected } from "@/lib/admin-protected-page";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Edit, Phone, Mail, Building, Hash } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { motion } from "framer-motion";

export default function AdminTeam() {
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    branch: '',
    rollNo: '',
    mobileNumber: '',
    department: ''
  });

  // Fetch team members with profile status
  const teamMembersWithStatus = useQuery(api.team.getTeamMembersWithProfileStatus);
  const incompleteProfiles = useQuery(api.team.getIncompleteTeamMemberProfiles);
  const updateTeamMemberProfile = useMutation(api.team.updateTeamMemberProfile);

  // Calculate stats
  const totalMembers = teamMembersWithStatus?.length || 0;
  const completeProfiles = teamMembersWithStatus?.filter(member => member.isProfileComplete).length || 0;
  const incompleteProfilesCount = incompleteProfiles?.length || 0;

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setEditForm({
      name: member.name || '',
      branch: member.branch || '',
      rollNo: member.rollNo || '',
      mobileNumber: member.mobileNumber || '',
      department: member.department || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingMember) return;

    try {
      await updateTeamMemberProfile({
        teamMemberId: editingMember._id,
        ...editForm
      });
      
      toast.success("Team member profile updated successfully");
      setIsEditDialogOpen(false);
      setEditingMember(null);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-background text-foreground font-mono p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">TEAM MANAGEMENT</h1>
            <p className="text-muted-foreground">Manage team member profiles and track completion status</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-4 border-black dark:border-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold">TOTAL MEMBERS</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers}</div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black dark:border-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold">COMPLETE PROFILES</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completeProfiles}</div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black dark:border-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold">INCOMPLETE PROFILES</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{incompleteProfilesCount}</div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black dark:border-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold">COMPLETION RATE</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {totalMembers > 0 ? Math.round((completeProfiles / totalMembers) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Table */}
          <Card className="border-4 border-black dark:border-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">TEAM MEMBERS</CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembersWithStatus === undefined ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading team members...</p>
                </div>
              ) : !teamMembersWithStatus || teamMembersWithStatus.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No team members found</p>
                  <p className="text-sm text-muted-foreground">Add team members to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">NAME</TableHead>
                      <TableHead className="font-bold">EMAIL</TableHead>
                      <TableHead className="font-bold">BRANCH</TableHead>
                      <TableHead className="font-bold">ROLL NO</TableHead>
                      <TableHead className="font-bold">MOBILE</TableHead>
                      <TableHead className="font-bold">STATUS</TableHead>
                      <TableHead className="font-bold">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembersWithStatus.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {member.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {member.branch || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            {member.rollNo || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {(member as any).mobileNumber || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={member.isProfileComplete ? "default" : "destructive"}
                            className="font-bold"
                          >
                            {member.isProfileComplete ? "COMPLETE" : "INCOMPLETE"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            className="border-2 border-black dark:border-white"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            EDIT
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Member Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="border-4 border-black dark:border-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">EDIT TEAM MEMBER</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-bold">NAME</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="border-2 border-black dark:border-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="branch" className="text-sm font-bold">BRANCH</Label>
                  <Input
                    id="branch"
                    value={editForm.branch}
                    onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                    className="border-2 border-black dark:border-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rollNo" className="text-sm font-bold">ROLL NUMBER</Label>
                  <Input
                    id="rollNo"
                    value={editForm.rollNo}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rollNo: e.target.value }))}
                    className="border-2 border-black dark:border-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="mobileNumber" className="text-sm font-bold">MOBILE NUMBER</Label>
                  <Input
                    id="mobileNumber"
                    value={editForm.mobileNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    className="border-2 border-black dark:border-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="department" className="text-sm font-bold">DEPARTMENT</Label>
                  <Input
                    id="department"
                    value={editForm.department}
                    onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    className="border-2 border-black dark:border-white"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-2 border-black dark:border-white"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  className="bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white"
                >
                  UPDATE PROFILE
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </AdminProtected>
  );
}