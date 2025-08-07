import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Menu } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import PrivateDMModal from './private-dm-modal';

interface User {
  _id: Id<"users"> | Id<"teamMembers">;
  name: string;
  email?: string;
  role?: string;
  image?: string;
  isOnline?: boolean;
}

interface TeamMember {
  _id: Id<"users">;
  name: string;
  role: string;
  email: string;
  image?: string;
}

interface BrutalistDockProps {
  currentUser: any;
  allUsers: any[];
  teamMembers: any[];
}

export const BrutalistDock: React.FC<BrutalistDockProps> = ({ currentUser: propCurrentUser, allUsers, teamMembers: propTeamMembers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPrivateDMModalOpen, setPrivateDMModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  // Get team members and users from database
  const teamMembers = useQuery(api.team.getAllTeamMembers);
  const currentUser = useQuery(api.users.currentUser);

  // Combine team members and current user for display
  const combinedUsers = useMemo(() => {
    const users: User[] = [];
    
    // Add current user if exists
    if (currentUser) {
      users.push({
        _id: currentUser._id,
        name: currentUser.name || 'Admin',
        email: currentUser.email,
        role: currentUser.role || 'admin',
        image: currentUser.image,
        isOnline: true, // Current user is always online
      });
    }

    // Add team members
    if (teamMembers) {
      teamMembers.forEach(member => {
        // Don't duplicate current user (compare as strings since IDs might be different types)
        if (currentUser && String(member._id) === String(currentUser._id)) return;
        
        users.push({
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role || 'Volunteer',
          image: undefined, // Team members don't have images in current schema
          isOnline: Math.random() > 0.5, // Mock online status for now
        });
      });
    }

    return users;
  }, [teamMembers, currentUser]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const openPrivateDM = (user: any) => {
    const recipientId = user.userId ? user.userId : user._id;
    setSelectedUser({ ...user, _id: recipientId });
    setPrivateDMModalOpen(true);
  };

  const closePrivateDM = () => {
    setPrivateDMModalOpen(false);
    setSelectedUser(null);
  };

  const handleMenuClick = () => {
    // Placeholder for future menu expansion
    console.log('Menu clicked - future expansion');
  };

  return (
    <>
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30`}>
        <div className="bg-[#f8f8f8] border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] transition-shadow duration-200">
          <div className="flex items-center px-4 py-3 gap-4">
            
            {/* Left Side - Static Icon */}
            <div className="border-2 border-black bg-white px-3 py-2 hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer">
              <span className="text-lg font-mono font-bold">✨</span>
            </div>

            {/* Center Area - Team Member Avatars */}
            <div className="flex items-center gap-1">
              {combinedUsers.map((user, index) => (
                <React.Fragment key={user._id}>
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredUser(user._id)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    {/* Avatar */}
                    <button
                      onClick={() => openPrivateDM(user)}
                      className="relative w-12 h-12 rounded-full border-2 border-black bg-white hover:border-4 transition-all duration-200 overflow-hidden cursor-pointer"
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      
                      {/* Initials Fallback */}
                      <div className={`w-full h-full flex items-center justify-center bg-black text-white font-mono font-bold text-sm ${user.image ? 'hidden' : ''}`}>
                        {getInitials(user.name)}
                      </div>

                      {/* Online Status Dot */}
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                      )}
                    </button>

                    {/* Tooltip */}
                    {hoveredUser === user._id && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50">
                        <div className="bg-black text-white px-3 py-2 border-2 border-black whitespace-nowrap font-mono text-sm font-bold">
                          {user.name.toUpperCase()} – {user.role?.toUpperCase()}
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-black"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hard Separation Between Avatars */}
                  {index < combinedUsers.length - 1 && (
                    <div className="w-1 h-8 bg-black"></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Right Side - Menu Button */}
            <button
              onClick={handleMenuClick}
              className="border-2 border-black bg-white px-3 py-2 hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <Menu className="w-5 h-5 font-bold" />
            </button>
          </div>
        </div>
      </div>

      {isPrivateDMModalOpen && selectedUser && (
        <PrivateDMModal
          isOpen={isPrivateDMModalOpen}
          onClose={closePrivateDM}
          recipientId={selectedUser._id}
          recipientName={selectedUser.name}
          recipientImage={selectedUser.image}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default BrutalistDock;