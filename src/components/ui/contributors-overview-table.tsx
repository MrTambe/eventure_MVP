import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Id } from '@/convex/_generated/dataModel';

interface Participant {
  _id: Id<"users">;
  name?: string;
  rollNo?: string;
  branch?: string;
  mobileNumber?: string;
  email?: string;
  registrationDate: number;
  paymentStatus: "Completed" | "Pending";
}

interface ContributorsOverviewTableProps {
  participants: Participant[];
}

export const ContributorsOverviewTable: React.FC<ContributorsOverviewTableProps> = ({ participants }) => {
  const formatRegistrationDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Roll Number</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Email Address</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Registration Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant._id}>
              <TableCell>{participant.name || 'N/A'}</TableCell>
              <TableCell>{participant.rollNo || 'N/A'}</TableCell>
              <TableCell>{participant.branch || 'N/A'}</TableCell>
              <TableCell>{participant.mobileNumber || 'N/A'}</TableCell>
              <TableCell>{participant.email || 'N/A'}</TableCell>
              <TableCell>
                <Badge
                  className={
                    participant.paymentStatus === 'Completed'
                      ? 'bg-green-500/20 text-green-600 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                  }
                >
                  {participant.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell>{formatRegistrationDate(participant.registrationDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
