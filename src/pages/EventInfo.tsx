import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";

function toTimestamp(val: number | Date | unknown): number {
  if (val instanceof Date) return val.getTime();
  if (typeof val === "number") return val;
  return 0;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TeamMember = {
  name: string;
  rollNo: string;
  branch: string;
  mobileNumber: string;
  email: string;
};

const emptyMember = (): TeamMember => ({ name: "", rollNo: "", branch: "", mobileNumber: "", email: "" });

export default function EventInfo() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  // Team registration state
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([emptyMember()]);

  const event = useQuery(api.events.getById, { id: eventId as Id<"events"> });
  const allTeamMembers = useQuery(api.team.getAllTeamMembers);
  const userRegistration = useQuery(api.events.getUserRegistration, { eventId: eventId as Id<"events"> });
  const teamRegistration = useQuery(api.events.getTeamRegistration, { eventId: eventId as Id<"events"> });
  const participants = useQuery(api.events.getEventParticipants, { eventId: eventId as Id<"events"> });
  const allTeamRegistrations = useQuery(api.events.getEventTeamRegistrations, { eventId: eventId as Id<"events"> });
  const registerForEvent = useMutation(api.events.registerForEvent);
  const registerTeamForEvent = useMutation(api.events.registerTeamForEvent);

  if (
    event === undefined ||
    allTeamMembers === undefined ||
    userRegistration === undefined ||
    teamRegistration === undefined ||
    participants === undefined ||
    allTeamRegistrations === undefined
  ) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-sm font-black uppercase text-muted-foreground">Loading event...</div>
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase text-black dark:text-white mb-4">Event Not Found</h1>
          <button
            onClick={() => navigate("/events")}
            className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white px-6 py-3 text-sm font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
          >
            <ArrowLeft className="inline h-4 w-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const startTs = toTimestamp(event.startDate);
  const endTs = toTimestamp(event.endDate);
  const now = Date.now();

  let eventStatus: "Ongoing" | "Upcoming" | "Completed";
  if (now >= startTs && now <= endTs) {
    eventStatus = "Ongoing";
  } else if (now < startTs) {
    eventStatus = "Upcoming";
  } else {
    eventStatus = "Completed";
  }

  const statusColors = {
    Ongoing: "bg-yellow-400 text-black border-black dark:border-white",
    Upcoming: "bg-blue-500 text-white border-blue-700 dark:border-blue-300",
    Completed: "bg-neutral-400 text-black border-black dark:border-white",
  };

  const volunteerIds = (event as any).volunteerIds as Id<"teamMembers">[] | undefined;
  const volunteers = volunteerIds && volunteerIds.length > 0
    ? allTeamMembers.filter((m) => volunteerIds.includes(m._id as Id<"teamMembers">))
    : [];

  const isEventClosed = eventStatus === "Completed" || event.status === "cancelled";
  const eventType = (event as any).eventType as "individual" | "team" | undefined ?? "individual";

  // Unified participant counts
  const totalIndividuals = participants.length;
  const totalTeams = allTeamRegistrations.length;
  const totalTeamMembers = allTeamRegistrations.reduce((sum, tr) => sum + tr.members.length, 0);
  const totalParticipants = totalIndividuals + totalTeamMembers;

  // Individual registration
  const isAlreadyRegistered = !!userRegistration;
  const isTeamAlreadyRegistered = !!teamRegistration;

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const result = await registerForEvent({ eventId: eventId as Id<"events"> });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTeamRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    const validMembers = teamMembers.filter(m => m.name.trim());
    if (validMembers.length === 0) {
      toast.error("Please add at least one team member");
      return;
    }
    setIsRegistering(true);
    try {
      const result = await registerTeamForEvent({
        eventId: eventId as Id<"events">,
        teamName: teamName.trim(),
        members: validMembers,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Team registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const addMember = () => setTeamMembers(prev => [...prev, emptyMember()]);
  const removeMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-[#f5f0e8] dark:bg-neutral-950 border-b-2 border-black dark:border-white"
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/events")}
            className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-black uppercase text-black dark:text-white">Event Details</h1>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* TOP SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-8 mb-8"
        >
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className={`inline-block text-xs font-black uppercase px-3 py-1.5 border-2 ${statusColors[eventStatus]} shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]`}>
              {eventStatus}
            </span>
            <span className="inline-block text-xs font-black uppercase px-3 py-1.5 border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white">
              {eventType === "team" ? "TEAM EVENT" : "INDIVIDUAL EVENT"}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase text-black dark:text-white mb-6 leading-none">
            {event.name}
          </h1>
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="h-6 w-6 text-black dark:text-white mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-black uppercase text-muted-foreground mb-1">Venue</p>
              <p className="text-lg font-bold text-black dark:text-white">{event.venue}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border-l-4 border-black dark:border-white pl-4">
              <p className="text-xs font-black uppercase text-muted-foreground mb-1">Start Date & Time</p>
              <div className="flex items-center gap-2 text-black dark:text-white">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-bold">{formatDate(startTs)}</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-white mt-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-bold">{formatTime(startTs)}</span>
              </div>
            </div>
            <div className="border-l-4 border-black dark:border-white pl-4">
              <p className="text-xs font-black uppercase text-muted-foreground mb-1">End Date & Time</p>
              <div className="flex items-center gap-2 text-black dark:text-white">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-bold">{formatDate(endTs)}</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-white mt-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-bold">{formatTime(endTs)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* MIDDLE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-8 mb-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-black uppercase text-black dark:text-white mb-4 border-b-2 border-black dark:border-white pb-2">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-black dark:text-white">{event.description}</p>
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase text-black dark:text-white mb-4 border-b-2 border-black dark:border-white pb-2">
              Volunteers
            </h2>
            {volunteers.length > 0 ? (
              <div className="space-y-3">
                {volunteers.map((volunteer, index) => (
                  <motion.div
                    key={volunteer._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-4 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex items-center gap-3"
                  >
                    <div className="w-10 h-10 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-black dark:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase text-black dark:text-white">{volunteer.name || "Unknown"}</p>
                      {volunteer.branch && <p className="text-xs font-semibold text-muted-foreground">{volunteer.branch}</p>}
                      {volunteer.email && <p className="text-xs text-muted-foreground">{volunteer.email}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-6 text-center">
                <p className="text-sm font-bold text-muted-foreground">No volunteers assigned</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* BOTTOM SECTION - Registration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-8"
        >
          <div className="flex items-center justify-between mb-4 border-b-2 border-black dark:border-white pb-2 flex-wrap gap-3">
            <h2 className="text-2xl font-black uppercase text-black dark:text-white">Registration</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 border-2 border-black dark:border-white px-3 py-1 bg-[#f5f0e8] dark:bg-neutral-800">
                <Users className="h-4 w-4 text-black dark:text-white" />
                <span className="text-sm font-black text-black dark:text-white">
                  {totalParticipants} {totalParticipants === 1 ? "participant" : "participants"}
                </span>
              </div>
              {totalTeams > 0 && (
                <div className="flex items-center gap-2 border-2 border-black dark:border-white px-3 py-1 bg-[#f5f0e8] dark:bg-neutral-800">
                  <Users className="h-4 w-4 text-black dark:text-white" />
                  <span className="text-sm font-black text-black dark:text-white">
                    {totalTeams} {totalTeams === 1 ? "team" : "teams"} registered
                  </span>
                </div>
              )}
            </div>
          </div>

          {isEventClosed ? (
            <div className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-6 text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase">
                {event.status === "cancelled" ? "This event has been cancelled" : "Registration is closed"}
              </p>
            </div>
          ) : eventType === "team" ? (
            /* TEAM REGISTRATION */
            isTeamAlreadyRegistered ? (
              <div className="border-2 border-black dark:border-white bg-[#c8f0e0] dark:bg-emerald-900/30 p-6 flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black uppercase text-black dark:text-white">Team Registered!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Team "{teamRegistration.teamName}" — {teamRegistration.members.length} member{teamRegistration.members.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registered on {new Date(teamRegistration.registrationDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTeamRegister} className="space-y-6">
                <p className="text-sm text-muted-foreground">Register your team for this event. Add all team members below.</p>

                {/* Team Name */}
                <div>
                  <label className="text-xs font-black uppercase text-black dark:text-white block mb-1">Team Name *</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    required
                  />
                </div>

                {/* Team Members */}
                <div>
                  <label className="text-xs font-black uppercase text-black dark:text-white block mb-3">Team Members *</label>
                  <div className="space-y-4">
                    {teamMembers.map((member, index) => (
                      <div key={index} className="border-2 border-black dark:border-white p-4 bg-[#f5f0e8] dark:bg-neutral-800 relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black uppercase text-black dark:text-white">Member {index + 1}</span>
                          {teamMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              className="text-muted-foreground hover:text-black dark:hover:text-white transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(["name", "rollNo", "branch", "mobileNumber", "email"] as const).map(field => (
                            <input
                              key={field}
                              type={field === "email" ? "email" : "text"}
                              value={member[field]}
                              onChange={e => updateMember(index, field, e.target.value)}
                              placeholder={field === "rollNo" ? "Roll No" : field === "mobileNumber" ? "Mobile Number" : field.charAt(0).toUpperCase() + field.slice(1)}
                              className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addMember}
                    className="mt-3 flex items-center gap-2 border-2 border-dashed border-black dark:border-white px-4 py-2 text-xs font-black uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors w-full justify-center"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-sm font-black uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-[4px_4px_0px_#555] dark:shadow-[4px_4px_0px_#aaa] hover:shadow-[2px_2px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? "Registering..." : "Register Team"}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* INDIVIDUAL REGISTRATION */
            isAlreadyRegistered ? (
              <div className="border-2 border-black dark:border-white bg-[#c8f0e0] dark:bg-emerald-900/30 p-6 flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black uppercase text-black dark:text-white">You're Registered!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered on {new Date(userRegistration.registrationDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Register to participate in this event.
                    {event.maxParticipants && (
                      <span className="ml-1 font-semibold">Max {event.maxParticipants} participants.</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-sm font-black uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-[4px_4px_0px_#555] dark:shadow-[4px_4px_0px_#aaa] hover:shadow-[2px_2px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? "Registering..." : "Register for Event"}
                </button>
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}