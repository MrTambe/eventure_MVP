import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export function EventDiscoveryWidget() {
  const events = useQuery(api.events.list);
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedEvents = events
    ?.slice()
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) || [];

  useEffect(() => {
    if (!sortedEvents.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sortedEvents.length]);

  if (!sortedEvents.length) {
    return (
      <div className="h-full flex items-center justify-center py-4">
        <p className="text-sm font-black uppercase text-muted-foreground">NO EVENTS FOUND</p>
      </div>
    );
  }

  const currentEvent = sortedEvents[currentIndex] as any;
  const eventDate = new Date(currentEvent.startDate);
  const isUpcoming = eventDate > new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const imageUrl: string | undefined = currentEvent.image;

  return (
    <div className="flex flex-col gap-3">
      {/* Event Card */}
      <div className="relative overflow-hidden min-h-[120px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer"
            onClick={() => navigate(`/event/${currentEvent._id}`)}
          >
            {/* Event image if available */}
            {imageUrl && (
              <div className="w-full h-28 mb-3 overflow-hidden border-2 border-black dark:border-white">
                <img
                  src={imageUrl}
                  alt={currentEvent.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Latest badge */}
            {isUpcoming && daysUntil <= 7 && (
              <div className="inline-block bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 text-[10px] font-black uppercase mb-2">
                LATEST
              </div>
            )}

            <h3 className="text-2xl font-black uppercase leading-tight mb-4">
              {currentEvent.name}
            </h3>

            {/* Date / Time / Location row */}
            <div className="flex gap-4 flex-wrap">
              <div className="border-l-2 border-black dark:border-white pl-2">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">DATE</p>
                <p className="text-sm font-bold">{eventDate.toLocaleDateString()}</p>
              </div>
              <div className="border-l-2 border-black dark:border-white pl-2">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">TIME</p>
                <p className="text-sm font-bold">
                  {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {currentEvent.venue && (
                <div className="border-l-2 border-black dark:border-white pl-2">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground">LOCATION</p>
                  <p className="text-sm font-bold truncate max-w-[120px]">{currentEvent.venue}</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex gap-2">
        {sortedEvents.slice(0, 5).map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full border-2 border-black dark:border-white transition-all ${
              index === currentIndex
                ? "bg-black dark:bg-white"
                : "bg-transparent"
            }`}
            aria-label={`Go to event ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}