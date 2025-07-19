import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { 
  User, 
  Calendar, 
  Award, 
  MapPin, 
  Clock,
  FileText,
  LogOut,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export function MobileDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const userStats = useQuery(api.dashboard.getUserStats);
  const upcomingEvents = useQuery(api.dashboard.getUpcomingEvents);
  const completedEvents = useQuery(api.dashboard.getCompletedEvents);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background border-b px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="flex items-center gap-2">
                <User className="h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My Events
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                My Certificates
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Main Dashboard Body - Swipeable Tabs */}
      <div className="px-4 py-6">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
          </TabsList>

          {/* User Statistics Section */}
          <TabsContent value="stats" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Welcome Back!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {userStats?.name || "Loading..."}
                    </p>
                    <p className="text-muted-foreground">
                      {currentTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">
                        {userStats?.totalEventsJoined || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Events Joined
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <Award className="h-8 w-8 mx-auto mb-2 text-accent-foreground" />
                      <p className="text-2xl font-bold">
                        {userStats?.totalCertificates || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Certificates
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Upcoming Events Section */}
          <TabsContent value="upcoming" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Your Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvents?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No upcoming events found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents?.map((event) => (
                        <motion.div
                          key={event._id}
                          whileHover={{ scale: 1.02 }}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <h3 className="font-semibold">{event.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(event.startDate)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.venue}
                          </div>
                          <Button size="sm" className="w-full mt-2">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Completed Events Section */}
          <TabsContent value="completed" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Completed Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedEvents?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No completed events found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {completedEvents?.map((event) => (
                        <motion.div
                          key={event._id}
                          whileHover={{ scale: 1.02 }}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <h3 className="font-semibold">{event.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(event.endDate)}
                          </div>
                          {event.hasCertificate ? (
                            <Button size="sm" className="w-full mt-2">
                              <FileText className="h-4 w-4 mr-2" />
                              View Certificate
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full mt-2" disabled>
                              Certificate Not Available
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
