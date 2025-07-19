import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { 
  User, 
  Calendar, 
  Award, 
  LogOut,
  Sun,
  Moon,
  Users,
  Clock,
  MapPin,
  Trophy
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function MobileDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const userStats = useQuery(api.dashboard.getUserStats);
  const upcomingEvents = useQuery(api.dashboard.getUpcomingEvents);
  const completedEvents = useQuery(api.dashboard.getCompletedEvents);

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Sample events with different categories
  const sampleEvents = [
    {
      id: 1,
      title: "TECH CONFERENCE 2024",
      category: "Technology",
      time: "09:00 AM",
      date: "Dec 15",
      status: "Registration Open",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop",
      participants: 150,
      maxParticipants: 200
    },
    {
      id: 2,
      title: "DESIGN WORKSHOP",
      category: "Creative",
      time: "02:00 PM", 
      date: "Dec 18",
      status: "Almost Full",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
      participants: 45,
      maxParticipants: 50
    },
    {
      id: 3,
      title: "NETWORKING EVENT",
      category: "Business",
      time: "06:00 PM",
      date: "Dec 20",
      status: "VIP Access",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop",
      participants: 80,
      maxParticipants: 100
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Container */}
      <div className="max-w-sm mx-auto bg-white dark:bg-gray-900 min-h-screen shadow-2xl relative">
        
        {/* Status Bar */}
        <div className="h-8 bg-black rounded-t-3xl flex items-center justify-center relative">
          <div className="w-16 h-1 bg-white rounded-full"></div>
          <div className="absolute right-4 flex items-center gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                HELLO,
              </h1>
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                {userStats?.name?.toUpperCase() || "GUEST"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <User className="h-6 w-6 text-white" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border-0 shadow-xl rounded-2xl">
                <DropdownMenuItem className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl">
                  <User className="h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl">
                  <Calendar className="h-4 w-4" />
                  My Events
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl">
                  <Award className="h-4 w-4" />
                  Certificates
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white"
            >
              <Trophy className="h-6 w-6 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{userStats?.totalEventsJoined || 0}</p>
              <p className="text-sm opacity-80">Events Joined</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white"
            >
              <Award className="h-6 w-6 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{userStats?.totalCertificates || 0}</p>
              <p className="text-sm opacity-80">Certificates</p>
            </motion.div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-14 h-7 rounded-full transition-all duration-300 ${
                isDarkMode ? 'bg-blue-500' : 'bg-gray-300'
              } relative`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-300 ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Events Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Discover & Join</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-4"
              >
                View All
              </Button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["ALL", "TECH", "CREATIVE", "BUSINESS"].map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${
                    selectedFilter === filter 
                      ? "bg-gray-900 text-white hover:bg-gray-800" 
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>

            {/* Event Cards */}
            <div className="space-y-4">
              {sampleEvents.map((event) => (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-3xl shadow-lg"
                >
                  <div 
                    className="relative h-40 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${event.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold text-gray-900">
                          {event.status}
                        </span>
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-white font-bold text-lg mb-2 tracking-wide">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-4 text-white/80 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.participants}/{event.maxParticipants}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white dark:bg-gray-800 p-4 flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-full font-medium border-gray-200 hover:bg-gray-50"
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium"
                    >
                      Register Now
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}