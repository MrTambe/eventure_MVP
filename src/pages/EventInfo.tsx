import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";

// Helper to normalize date/timestamp to timestamp
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

export default function EventInfo() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const event = useQuery(api.events.getById, {
    id: eventId as Id<"events">
  });

  const allTeamMembers = useQuery(api.team.getAllTeamMembers);

  if (event === undefined || allTeamMembers === undefined) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-sm font-black uppercase text-muted-foreground">
          Loading event...
        </div>
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase text-black dark:text-white mb-4">
            Event Not Found
          </h1>
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

  // Normalize dates to timestamps
  const startTs = toTimestamp(event.startDate);
  const endTs = toTimestamp(event.endDate);
  const now = Date.now();

  // Determine event status
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

  // Filter team members to only those assigned as volunteers for this event
  const volunteerIds = (event as any).volunteerIds as Id<"teamMembers">[] | undefined;
  const volunteers = volunteerIds && volunteerIds.length > 0
    ? allTeamMembers.filter((m) => volunteerIds.includes(m._id as Id<"teamMembers">))
    : [];

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
          <div>
            <h1 className="text-lg font-black uppercase text-black dark:text-white">
              Event Details
            </h1>
          </div>
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
          {/* Event Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-block text-xs font-black uppercase px-3 py-1.5 border-2 ${statusColors[eventStatus]} shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]`}
            >
              {eventStatus}
            </span>
          </div>

          {/* Event Name */}
          <h1 className="text-4xl sm:text-5xl font-black uppercase text-black dark:text-white mb-6 leading-none">
            {event.name}
          </h1>

          {/* Venue */}
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="h-6 w-6 text-black dark:text-white mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-black uppercase text-muted-foreground mb-1">
                Venue
              </p>
              <p className="text-lg font-bold text-black dark:text-white">
                {event.venue}
              </p>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border-l-4 border-black dark:border-white pl-4">
              <p className="text-xs font-black uppercase text-muted-foreground mb-1">
                Start Date & Time
              </p>
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
              <p className="text-xs font-black uppercase text-muted-foreground mb-1">
                End Date & Time
              </p>
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
          {/* Event Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-black uppercase text-black dark:text-white mb-4 border-b-2 border-black dark:border-white pb-2">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-black dark:text-white">
              {event.description}
            </p>
          </div>

          {/* Volunteers */}
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
                      <p className="text-sm font-black uppercase text-black dark:text-white">
                        {volunteer.name || "Unknown"}
                      </p>
                      {volunteer.branch && (
                        <p className="text-xs font-semibold text-muted-foreground">
                          {volunteer.branch}
                        </p>
                      )}
                      {volunteer.email && (
                        <p className="text-xs text-muted-foreground">
                          {volunteer.email}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-6 text-center">
                <p className="text-sm font-bold text-muted-foreground">
                  No volunteers assigned
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* BOTTOM SECTION - Registration Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-8"
        >
          <h2 className="text-2xl font-black uppercase text-black dark:text-white mb-4 border-b-2 border-black dark:border-white pb-2">
            Registration Section
          </h2>
          <div className="border-2 border-dashed border-black dark:border-white p-8 text-center">
            <p className="text-sm font-bold text-muted-foreground">
              Registration functionality coming soon
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}