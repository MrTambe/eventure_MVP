import React, { useState } from 'react';
import { Calendar, Plus, User, Clock, MapPin, Users, Target, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

export default function AdminDashboard() {
  const [todoList, setTodoList] = useState(todos);
  const [newTodo, setNewTodo] = useState("");
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header Section */}
      <header className="border-b-2 border-black p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">EVENT ADMIN DASHBOARD</h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-bold">{getCurrentDate()}</div>
              <div className="text-xs text-gray-600">ADMIN PANEL</div>
            </div>
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-lg">
              AB
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
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
        <section className="border-2 border-black p-6">
          <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-black text-white hover:bg-gray-800 font-bold text-lg px-8 py-4 border-0"
                size="lg"
              >
                <Plus className="w-6 h-6 mr-2" />
                CREATE NEW EVENT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-2 border-black bg-white font-mono">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">CREATE NEW EVENT</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <Label className="text-sm font-bold mb-2 block">EVENT NAME</Label>
                  <Input 
                    className="border-2 border-black font-mono text-lg p-3" 
                    placeholder="ENTER EVENT NAME"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-bold mb-2 block">START DATE</Label>
                    <Input 
                      type="date" 
                      className="border-2 border-black font-mono p-3"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold mb-2 block">END DATE</Label>
                    <Input 
                      type="date" 
                      className="border-2 border-black font-mono p-3"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-2 block">LOCATION</Label>
                  <Input 
                    className="border-2 border-black font-mono text-lg p-3" 
                    placeholder="ENTER VENUE"
                  />
                </div>
                <div>
                  <Label className="text-sm font-bold mb-2 block">DESCRIPTION</Label>
                  <Textarea 
                    className="border-2 border-black font-mono p-3 min-h-[100px]" 
                    placeholder="EVENT DESCRIPTION"
                  />
                </div>
                <div className="flex gap-4">
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 font-bold px-8 py-3 border-0"
                    onClick={() => setIsCreateEventOpen(false)}
                  >
                    CREATE EVENT
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-2 border-black font-bold px-8 py-3"
                    onClick={() => setIsCreateEventOpen(false)}
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
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
