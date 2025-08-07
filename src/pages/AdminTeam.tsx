import { AdminProtected } from "@/lib/admin-protected-page";
import { AdminNavBar } from "@/components/admin/admin-navbar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Calendar, BarChart, Settings } from "lucide-react";

export default function AdminTeam() {
  const adminNavItems = [
    { name: 'Dashboard', url: '/admin-dashboard', icon: Home },
    { name: 'Events', url: '/admin-events', icon: Calendar },
    { name: 'Team', url: '/admin-team', icon: Users },
    { name: 'Communication', url: '/admin-communication', icon: BarChart },
    { name: 'Settings', url: '/admin-settings', icon: Settings },
  ];

  const members = useQuery(api.users.listMembers);

  return (
    <AdminProtected>
      <div className="min-h-screen bg-background">
        <AdminNavBar items={adminNavItems} />
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Team Members</h1>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.image} />
                        <AvatarFallback>{member.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminProtected>
  );
}