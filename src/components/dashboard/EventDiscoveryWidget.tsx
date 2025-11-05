import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export function EventDiscoveryWidget() {
  const events = useQuery(api.events.list);
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort events by start date (soonest first)
  const sortedEvents = events
    ?.slice()
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) || [];

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!sortedEvents.length) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sortedEvents.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedEvents.length) % sortedEvents.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedEvents.length);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  if (!sortedEvents.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-lg font-black uppercase">NO EVENTS FOUND</p>
      </div>
    );
  }

  const currentEvent = sortedEvents[currentIndex];
  const eventDate = new Date(currentEvent.startDate);
  const isUpcoming = eventDate > new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="h-full flex flex-col">
      {/* Carousel Container */}
      <div className="flex-1 relative overflow-hidden border-4 border-black dark:border-white bg-white dark:bg-black mb-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="h-full p-4 flex flex-col justify-between cursor-pointer"
            onClick={() => handleEventClick(currentEvent._id)}
          >
            {/* Urgency Badge */}
            {isUpcoming && daysUntil <= 7 && (
              <div className="absolute top-2 right-2 bg-black dark:bg-white text-white dark:text-black px-3 py-1 border-2 border-black dark:border-white font-black text-xs uppercase">
                STARTS {daysUntil === 0 ? "TODAY" : `IN ${daysUntil}D`}
              </div>
            )}

            {/* Event Title */}
            <div>
              <h3 className="text-2xl font-black uppercase leading-tight mb-3 break-words">
                {currentEvent.name}
              </h3>
            </div>

            {/* Event Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Calendar className="h-4 w-4" />
                <span className="uppercase">{eventDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Clock className="h-4 w-4" />
                <span className="uppercase">
                  {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {currentEvent.venue && (
                <div className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="h-4 w-4" />
                  <span className="uppercase truncate">{currentEvent.venue}</span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black dark:bg-white text-white dark:text-black p-2 border-2 border-black dark:border-white hover:scale-110 transition-transform"
          aria-label="Previous event"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black dark:bg-white text-white dark:text-black p-2 border-2 border-black dark:border-white hover:scale-110 transition-transform"
          aria-label="Next event"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Carousel Dots */}
      <div className="flex justify-center gap-2 mb-3">
        {sortedEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 border-2 border-black dark:border-white transition-all ${
              index === currentIndex
                ? "bg-black dark:bg-white scale-125"
                : "bg-transparent hover:bg-black/20 dark:hover:bg-white/20"
            }`}
            aria-label={`Go to event ${index + 1}`}
          />
        ))}
      </div>

      {/* View All Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-4 border-black dark:border-white font-black text-sm uppercase shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#fff] hover:-translate-y-0.5 transition-all"
        onClick={() => navigate("/events")}
      >
        VIEW ALL EVENTS →
      </Button>
    </div>
  );
}