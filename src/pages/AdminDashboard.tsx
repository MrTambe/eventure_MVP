import React, { useState } from 'react';
import { Calendar, Plus, User, Clock, MapPin, Users, Target, CheckSquare, Square, Home, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MenuBar } from '@/components/ui/glow-menu';
import { ThemeProvider, useTheme } from 'next-themes';

// Dummy data
const currentEvent = {
  name: "HACKATHON 2024",
  time: "09:00 - 18:00",
  location: "MAIN AUDITORIUM",
  status: "LIVE"
};

const upcomingEvent = {
  name: "TECH TALK: AI & ML",
  time: "14:00 - 16:00",
  date: "TOMORROW",
  location: "SEMINAR HALL"
};

const stats = {
  registrations: 247,
  volunteers: 18,
  teams: 32
};

const todos = [
  { id: 1, text: "SETUP PROJECTORS FOR MAIN HALL", completed: false },
  { id: 2, text: "COORDINATE WITH CATERING TEAM", completed: true },
  { id: 3, text: "PREPARE CERTIFICATES FOR WINNERS", completed: false },
  { id: 4, text: "SEND REMINDER EMAILS TO PARTICIPANTS", completed: false }
];

const calendarEvents = [
  { date: 15, name: "HACKATHON", type: "current" },
  { date: 16, name: "TECH TALK", type: "upcoming" },
  { date: 20, name: "WORKSHOP", type: "scheduled" },
  { date: 25, name: "SEMINAR", type: "scheduled" }
];

const menuItems = [
  {
    icon: Home,
    label: "Dashboard",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: Bell,
    label: "Notifications",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: User,
    label: "Profile",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
];

const availableVolunteers = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com" },
  { id: 2, name: "Bob Smith", email: "bob@example.com" },
  { id: 3, name: "Carol Davis", email: "carol@example.com" },
  { id: 4, name: "David Wilson", email: "david@example.com" },
  { id: 5, name: "Emma Brown", email: "emma@example.com" },
  { id: 6, name: "Frank Miller", email: "frank@example.com" },
];

function AdminDashboardContent() {
  const [todoList, setTodoList] = useState(todos);
  const [newTodo, setNewTodo] = useState("");
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [selectedVolunteers, setSelectedVolunteers] = useState<number[]>([]);
  const { theme, setTheme } = useTheme();

  const toggleTodo = (id: number) => {
    setTodoList(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodoList(prev => [...prev, {
        id: Date.now(),
        text: newTodo.toUpperCase(),
        completed: false
      }]);
      setNewTodo("");
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

  const toggleVolunteer = (volunteerId: number) => {
    setSelectedVolunteers(prev => 
      prev.includes(volunteerId) 
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Selected volunteers:", selectedVolunteers);
    setIsCreateEventOpen(false);
    setSelectedVolunteers([]);
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono dark:bg-black dark:text-white">
      {/* Header Section */}
      <header className="border-b-2 border-black dark:border-white/20 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">EVENT ADMIN DASHBOARD</h1>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold">{getCurrentDate()}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">ADMIN PANEL</div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-lg">
              AB
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border-2 border-black dark:border-white">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <MenuBar items={menuItems} activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Section 1: Current & Upcoming Events */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Event */}
          <div className="border-2 border-black p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500"></div>
              <h2 className="text-xl font-bold">CURRENT EVENT</h2>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{currentEvent.name}</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-bold">{currentEvent.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-bold">{currentEvent.location}</span>
              </div>
              <div className="inline-block bg-black text-white px-3 py-1 text-sm font-bold mt-2">
                {currentEvent.status}
              </div>
            </div>
          </div>

          {/* Upcoming Event */}
          <div className="border-2 border-black p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-yellow-500"></div>
              <h2 className="text-xl font-bold">UPCOMING EVENT</h2>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{upcomingEvent.name}</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-bold">{upcomingEvent.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-bold">{upcomingEvent.location}</span>
              </div>
              <div className="inline-block bg-gray-800 text-white px-3 py-1 text-sm font-bold mt-2">
                {upcomingEvent.date}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-2 border-black p-6 hover:bg-black hover:text-white transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6" />
              <h3 className="font-bold">TOTAL REGISTRATIONS</h3>
            </div>
            <div className="text-4xl font-bold">{stats.registrations}</div>
            <div className="text-sm font-bold mt-1">TODAY</div>
          </div>

          <div className="border-2 border-black p-6 hover:bg-black hover:text-white transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-6 h-6" />
              <h3 className="font-bold">VOLUNTEERS</h3>
            </div>
            <div className="text-4xl font-bold">{stats.volunteers}</div>
            <div className="text-sm font-bold mt-1">TODAY</div>
          </div>

          <div className="border-2 border-black p-6 hover:bg-black hover:text-white transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6" />
              <h3 className="font-bold">TEAMS</h3>
            </div>
            <div className="text-4xl font-bold">{stats.teams}</div>
            <div className="text-sm font-bold mt-1">TODAY</div>
          </div>
        </section>

        {/* Section 3: Create New Event */}
        <section className="border-2 border-black dark:border-white/20 p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4 tracking-tight">CREATE NEW EVENT</h2>
          <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-8 py-4 border-2 border-black dark:border-white"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                CREATE NEW EVENT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">CREATE NEW EVENT</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventName" className="text-sm font-bold mb-2 block">EVENT NAME</Label>
                    <Input 
                      id="eventName"
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      placeholder="Enter event name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue" className="text-sm font-bold mb-2 block">VENUE</Label>
                    <Input 
                      id="venue"
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      placeholder="Enter venue"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventDate" className="text-sm font-bold mb-2 block">EVENT DATE</Label>
                    <Input 
                      id="eventDate"
                      type="date"
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventTime" className="text-sm font-bold mb-2 block">START TIME</Label>
                    <Input 
                      id="eventTime"
                      type="time"
                      className="border-2 border-black dark:border-white font-mono text-base p-3"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxParticipants" className="text-sm font-bold mb-2 block">MAX PARTICIPANTS</Label>
                  <Input 
                    id="maxParticipants"
                    type="number"
                    className="border-2 border-black dark:border-white font-mono text-base p-3"
                    placeholder="Enter maximum participants"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-bold mb-2 block">DESCRIPTION</Label>
                  <Textarea 
                    id="description"
                    className="border-2 border-black dark:border-white font-mono text-base p-3 min-h-[100px]"
                    placeholder="Enter event description"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold mb-3 block">ASSIGN VOLUNTEERS</Label>
                  <div className="border-2 border-black dark:border-white p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableVolunteers.map((volunteer) => (
                        <div key={volunteer.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <button
                            type="button"
                            onClick={() => toggleVolunteer(volunteer.id)}
                            className="flex-shrink-0"
                          >
                            {selectedVolunteers.includes(volunteer.id) ? (
                              <CheckSquare className="h-5 w-5 text-black dark:text-white" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{volunteer.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{volunteer.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedVolunteers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <div className="text-sm font-bold">
                          SELECTED: {selectedVolunteers.length} volunteer{selectedVolunteers.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit"
                    className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-base py-3 border-2 border-black dark:border-white"
                  >
                    CREATE EVENT
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateEventOpen(false);
                      setSelectedVolunteers([]);
                    }}
                    className="flex-1 border-2 border-black dark:border-white font-mono text-base py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    CANCEL
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {/* Section 4: Calendar & Todo List */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="border-2 border-black p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-6 h-6" />
              <h2 className="text-xl font-bold">CALENDAR</h2>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-center font-bold text-sm p-2 border border-black">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const date = i - 6; // Start from previous month
                const isCurrentMonth = date > 0 && date <= 31;
                const hasEvent = calendarEvents.find(e => e.date === date);
                const isToday = date === 15;
                
                return (
                  <div 
                    key={i} 
                    className={`
                      aspect-square border border-black flex flex-col items-center justify-center text-sm
                      ${!isCurrentMonth ? 'text-gray-400 bg-gray-100' : ''}
                      ${isToday ? 'bg-black text-white font-bold' : ''}
                      ${hasEvent && !isToday ? 'bg-gray-200' : ''}
                    `}
                  >
                    <div className="font-bold">{isCurrentMonth ? date : ''}</div>
                    {hasEvent && (
                      <div className={`text-xs mt-1 px-1 ${isToday ? 'text-white' : 'text-black'}`}>
                        {hasEvent.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Todo List */}
          <div className="border-2 border-black p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckSquare className="w-6 h-6" />
              <h2 className="text-xl font-bold">TODO LIST</h2>
            </div>
            
            {/* Add new todo */}
            <div className="flex gap-2 mb-6">
              <Input 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="border-2 border-black font-mono flex-1"
                placeholder="ADD NEW TASK"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              <Button 
                onClick={addTodo}
                className="bg-black text-white hover:bg-gray-800 font-bold px-4 border-0"
              >
                ADD
              </Button>
            </div>

            {/* Todo items */}
            <div className="space-y-3">
              {todoList.map(todo => (
                <div 
                  key={todo.id} 
                  className={`flex items-center gap-3 p-3 border border-black cursor-pointer hover:bg-gray-100 ${
                    todo.completed ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  onClick={() => toggleTodo(todo.id)}
                >
                  <div className="w-5 h-5 border-2 border-black flex items-center justify-center">
                    {todo.completed ? (
                      <div className="w-3 h-3 bg-black"></div>
                    ) : null}
                  </div>
                  <span className={`font-bold text-sm ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminDashboardContent />
    </ThemeProvider>
  )
}