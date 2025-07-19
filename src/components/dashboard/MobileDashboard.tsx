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
  Trophy,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import useEmblaCarousel from 'embla-carousel-react';

export function MobileDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

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
    }
  ];

  const completedSampleEvents = [
    {
      id: 1,
      title: "AI SUMMIT 2024",
      date: "Nov 20",
      time: "10:00 AM",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=200&fit=crop",
      hasCertificate: true
    },
    {
      id: 2,
      title: "WEB DEV BOOTCAMP",
      date: "Nov 15",
      time: "02:00 PM",
      image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=200&fit=crop",
      hasCertificate: true
    }
  ];

  const sections = [
    { title: "Upcoming Events", icon: Calendar },
    { title: "Completed Events", icon: Trophy },
    { title: "Generate Certificate", icon: Award }
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
        <div className="px-6 py-6 space-y-6">
          
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
            
            <div className="flex items-center gap-3">
              {/* Compact Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <User className="h-5 w-5 text-white" />
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
          </div>

          {/* Compact Stats Cards */}
          <div className="flex gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 px-3 py-2 rounded-xl text-white flex items-center gap-2 flex-1"
            >
              <Trophy className="h-4 w-4 opacity-80" />
              <div>
                <p className="text-lg font-bold">{userStats?.totalEventsJoined || 0}</p>
                <p className="text-xs opacity-80">Events</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 px-3 py-2 rounded-xl text-white flex items-center gap-2 flex-1"
            >
              <Award className="h-4 w-4 opacity-80" />
              <div>
                <p className="text-lg font-bold">{userStats?.totalCertificates || 0}</p>
                <p className="text-xs opacity-80">Certificates</p>
              </div>
            </motion.div>
          </div>

          {/* Swipeable Sections */}
          <div className="space-y-4">
            {/* Section Header with Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                  {sections[selectedIndex] && (() => {
                    const IconComponent = sections[selectedIndex].icon;
                    return <IconComponent className="h-4 w-4 text-white dark:text-gray-900" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {sections[selectedIndex]?.title || "Upcoming Events"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedIndex + 1} of {sections.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={scrollPrev}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={scrollNext}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Carousel Container */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                
                {/* Section 1: Upcoming Events */}
                <div className="flex-[0_0_100%] min-w-0">
                  <div className="space-y-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {["ALL", "TECH", "CREATIVE", "BUSINESS"].map((filter) => (
                        <Button
                          key={filter}
                          variant={selectedFilter === filter ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFilter(filter)}
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
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
                            className="relative h-32 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${event.image})` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                                <span className="text-xs font-semibold text-gray-900">
                                  {event.status}
                                </span>
                              </div>
                            </div>

                            {/* Event Info */}
                            <div className="absolute bottom-3 left-3 right-3">
                              <h4 className="text-white font-bold text-base mb-1 tracking-wide">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-3 text-white/80 text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {event.date}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {event.participants}/{event.maxParticipants}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="bg-white dark:bg-gray-800 p-3 flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 rounded-full font-medium border-gray-200 hover:bg-gray-50 text-xs py-1"
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium text-xs py-1"
                            >
                              Register Now
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Completed Events */}
                <div className="flex-[0_0_100%] min-w-0 pl-6">
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Your completed events</p>
                    </div>

                    {/* Completed Event Cards */}
                    <div className="space-y-4">
                      {completedSampleEvents.map((event) => (
                        <motion.div
                          key={event.id}
                          whileHover={{ scale: 1.02 }}
                          className="relative overflow-hidden rounded-3xl shadow-lg"
                        >
                          <div 
                            className="relative h-32 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${event.image})` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            
                            {/* Completed Badge */}
                            <div className="absolute top-3 left-3">
                              <div className="bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
                                <span className="text-xs font-semibold text-white">
                                  Completed
                                </span>
                              </div>
                            </div>

                            {/* Event Info */}
                            <div className="absolute bottom-3 left-3 right-3">
                              <h4 className="text-white font-bold text-base mb-1 tracking-wide">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-3 text-white/80 text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {event.date}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="bg-white dark:bg-gray-800 p-3 flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 rounded-full font-medium border-gray-200 hover:bg-gray-50 text-xs py-1"
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium text-xs py-1"
                              disabled={!event.hasCertificate}
                            >
                              View Certificate
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Generate Certificate */}
                <div className="flex-[0_0_100%] min-w-0 pl-6">
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <Award className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Generate Certificate
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Create certificates for your completed events
                      </p>
                      
                      <Button 
                        size="lg" 
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-medium"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate New Certificate
                      </Button>
                    </div>

                    {/* Recent Certificates */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Recent Certificates</h4>
                      
                      {[1, 2].map((cert) => (
                        <div key={cert} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                Certificate #{cert}001
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Generated on Nov {20 + cert}, 2024
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-full text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 pt-4">
              {sections.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => emblaApi?.scrollTo(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}