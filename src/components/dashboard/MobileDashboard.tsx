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
  ChevronRight,
  Timer
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
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

  // Sports events distributed across 4 days with registration deadlines
  const allEvents = {
    "DAY-01": [
      {
        id: 1,
        title: "🏸 BADMINTON TOURNAMENT",
        day: "DAY-01",
        time: "09:00 AM",
        date: "Dec 15",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1544717684-7ba720c2b5ea?w=400&h=200&fit=crop",
        participants: 24,
        maxParticipants: 32,
        registrationDeadline: Date.now() + (2 * 24 * 60 * 60 * 1000) // 2 days from now
      },
      {
        id: 2,
        title: "🏀 BASKETBALL CHAMPIONSHIP",
        day: "DAY-01",
        time: "02:00 PM",
        date: "Dec 15",
        status: "Almost Full",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop",
        participants: 28,
        maxParticipants: 30,
        registrationDeadline: Date.now() + (1 * 24 * 60 * 60 * 1000) // 1 day from now
      },
      {
        id: 3,
        title: "⚽ FOOTBALL MATCH",
        day: "DAY-01",
        time: "05:00 PM",
        date: "Dec 15",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=200&fit=crop",
        participants: 18,
        maxParticipants: 22,
        registrationDeadline: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 days from now
      }
    ],
    "DAY-02": [
      {
        id: 4,
        title: "🏐 VOLLEYBALL LEAGUE",
        day: "DAY-02",
        time: "10:00 AM",
        date: "Dec 16",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=200&fit=crop",
        participants: 16,
        maxParticipants: 24,
        registrationDeadline: Date.now() + (4 * 24 * 60 * 60 * 1000) // 4 days from now
      },
      {
        id: 5,
        title: "🏏 CRICKET TOURNAMENT",
        day: "DAY-02",
        time: "01:00 PM",
        date: "Dec 16",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=200&fit=crop",
        participants: 20,
        maxParticipants: 22,
        registrationDeadline: Date.now() + (5 * 24 * 60 * 60 * 1000) // 5 days from now
      }
    ],
    "DAY-03": [
      {
        id: 6,
        title: "🏃 ATHLETICS MEET",
        day: "DAY-03",
        time: "08:00 AM",
        date: "Dec 17",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop",
        participants: 45,
        maxParticipants: 60,
        registrationDeadline: Date.now() + (6 * 24 * 60 * 60 * 1000) // 6 days from now
      },
      {
        id: 7,
        title: "🥋 KARATE CHAMPIONSHIP",
        day: "DAY-03",
        time: "03:00 PM",
        date: "Dec 17",
        status: "Almost Full",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=200&fit=crop",
        participants: 18,
        maxParticipants: 20,
        registrationDeadline: Date.now() + (12 * 60 * 60 * 1000) // 12 hours from now
      },
      {
        id: 8,
        title: "🥊 BOXING COMPETITION",
        day: "DAY-03",
        time: "06:00 PM",
        date: "Dec 17",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=200&fit=crop",
        participants: 12,
        maxParticipants: 16,
        registrationDeadline: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    ],
    "DAY-04": [
      {
        id: 9,
        title: "🧗 ROCK CLIMBING CHALLENGE",
        day: "DAY-04",
        time: "09:00 AM",
        date: "Dec 18",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400&h=200&fit=crop",
        participants: 8,
        maxParticipants: 15,
        registrationDeadline: Date.now() + (8 * 24 * 60 * 60 * 1000) // 8 days from now
      },
      {
        id: 10,
        title: "🏓 TABLE TENNIS TOURNAMENT",
        day: "DAY-04",
        time: "02:00 PM",
        date: "Dec 18",
        status: "Registration Open",
        image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400&h=200&fit=crop",
        participants: 14,
        maxParticipants: 20,
        registrationDeadline: Date.now() + (2 * 60 * 60 * 1000) // 2 hours from now
      }
    ]
  };

  // Get events for selected day
  const getEventsForDay = (day: string) => {
    if (day === "ALL") {
      return Object.values(allEvents).flat();
    }
    return allEvents[day as keyof typeof allEvents] || [];
  };

  const sampleEvents = getEventsForDay(selectedFilter);

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

  // Countdown Timer Component
  const CountdownTimer = ({ deadline }: { deadline: number }) => {
    const [timeLeft, setTimeLeft] = useState(deadline - Date.now());

    useEffect(() => {
      const timer = setInterval(() => {
        const remaining = deadline - Date.now();
        setTimeLeft(remaining > 0 ? remaining : 0);
      }, 1000);

      return () => clearInterval(timer);
    }, [deadline]);

    const formatTime = (ms: number) => {
      if (ms <= 0) return "Registration Closed";
      
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      return `${minutes}m ${seconds}s`;
    };

    const isUrgent = timeLeft <= 24 * 60 * 60 * 1000; // Less than 24 hours
    const isCritical = timeLeft <= 2 * 60 * 60 * 1000; // Less than 2 hours

    return (
      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
        timeLeft <= 0 
          ? 'bg-red-500/20 text-red-600' 
          : isCritical 
            ? 'bg-red-500/20 text-red-600' 
            : isUrgent 
              ? 'bg-orange-500/20 text-orange-600' 
              : 'bg-green-500/20 text-green-600'
      }`}>
        <Timer className="h-3 w-3" />
        <span className="font-medium">{formatTime(timeLeft)}</span>
      </div>
    );
  };

  const sections = [
    { title: "Upcoming Events", icon: Calendar },
    { title: "Completed Events", icon: Trophy },
    { title: "Generate Certificate", icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Mobile Container */}
      <div className="max-w-sm mx-auto bg-card min-h-screen shadow-2xl relative border-x border-border">
        
        {/* Status Bar */}
        <div className="h-8 bg-primary rounded-t-3xl flex items-center justify-center relative">
          <div className="w-16 h-1 bg-primary-foreground rounded-full"></div>
          <div className="absolute right-4 flex items-center gap-1">
            <div className="w-1 h-1 bg-primary-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-primary-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-primary-foreground rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6 space-y-6">
          
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                HELLO,
              </h1>
              <h2 className="text-xl font-bold text-muted-foreground">
                {user?.name?.toUpperCase() || "GUEST"}
              </h2>
              <p className="text-sm text-muted-foreground">
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
                  isDarkMode ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
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
                    className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <User className="h-5 w-5 text-primary-foreground" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl rounded-2xl">
                  <DropdownMenuItem className="flex items-center gap-3 p-4 hover:bg-accent/10 rounded-xl">
                    <User className="h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 p-4 hover:bg-accent/10 rounded-xl">
                    <Calendar className="h-4 w-4" />
                    My Events
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 p-4 hover:bg-accent/10 rounded-xl">
                    <Award className="h-4 w-4" />
                    Certificates
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-3 p-4 text-destructive hover:bg-destructive/10 rounded-xl"
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
              className="bg-gradient-to-br from-primary to-accent px-3 py-2 rounded-xl text-primary-foreground flex items-center gap-2 flex-1"
            >
              <Trophy className="h-4 w-4 opacity-80" />
              <div>
                <p className="text-lg font-bold">{userStats?.totalEventsJoined || 0}</p>
                <p className="text-xs opacity-80">Events</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-accent to-secondary px-3 py-2 rounded-xl text-accent-foreground flex items-center gap-2 flex-1"
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
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  {sections[selectedIndex] && (() => {
                    const IconComponent = sections[selectedIndex].icon;
                    return <IconComponent className="h-4 w-4 text-primary-foreground" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    {sections[selectedIndex]?.title || "Upcoming Events"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedIndex + 1} of {sections.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={scrollPrev}
                  className="w-8 h-8 p-0 rounded-full border-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={scrollNext}
                  className="w-8 h-8 p-0 rounded-full border-border"
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
                      {["ALL", "DAY-01", "DAY-02", "DAY-03", "DAY-04"].map((filter) => (
                        <Button
                          key={filter}
                          variant={selectedFilter === filter ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFilter(filter)}
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            selectedFilter === filter 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                              : "bg-card border-border text-foreground hover:bg-accent/10"
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
                          className="relative overflow-hidden rounded-3xl shadow-lg border border-border"
                        >
                          <div 
                            className="relative h-32 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${event.image})` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                              <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full border border-border">
                                <span className="text-xs font-semibold text-foreground">
                                  {event.status}
                                </span>
                              </div>
                            </div>

                            {/* Countdown Timer */}
                            <div className="absolute top-3 right-3">
                              <CountdownTimer deadline={event.registrationDeadline} />
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
                          <div className="bg-card p-3 flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 rounded-full font-medium border-border hover:bg-accent/10 text-xs py-1"
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium text-xs py-1"
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
                    index === selectedIndex ? 'bg-primary' : 'bg-muted'
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