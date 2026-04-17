import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const CARDS_PER_PAGE = 4;

const categoryColors: Record<string, string> = {
  tech: "bg-black text-white dark:bg-white dark:text-black",
  art: "bg-black text-white dark:bg-white dark:text-black",
  music: "bg-black text-white dark:bg-white dark:text-black",
  sports: "bg-black text-white dark:bg-white dark:text-black",
  default: "bg-black text-white dark:bg-white dark:text-black",
};

// Brutalist fallback placeholder when no image is available
function EventImageFallback({ name, category }: { name: string; category?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 border-b-2 border-black dark:border-white p-4">
      <div className="text-4xl font-black uppercase text-black dark:text-white opacity-20 leading-none text-center break-all">
        {name.slice(0, 2).toUpperCase()}
      </div>
      {category && (
        <div className="mt-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
          {category.toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function EventDiscoveryGrid() {
  const events = useQuery(api.events.list);
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const sortedEvents = events
    ?.slice()
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) || [];

  const totalPages = Math.ceil(sortedEvents.length / CARDS_PER_PAGE);
  const visibleEvents = sortedEvents.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-black uppercase tracking-tight text-black dark:text-white">
          EVENT DISCOVERY
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={page === 0}
            className="w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center bg-white dark:bg-neutral-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={page >= totalPages - 1 || totalPages === 0}
            className="w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center bg-white dark:bg-neutral-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-12 border-2 border-black dark:border-white bg-white dark:bg-neutral-900">
          <p className="font-black uppercase text-muted-foreground">No events available</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {visibleEvents.map((event: any, idx: number) => {
              const eventDate = new Date(event.startDate);
              const category = event.category || "";
              const colorClass = categoryColors[category?.toLowerCase()] || categoryColors.default;
              const imageUrl: string | undefined = event.image;

              return (
                <div
                  key={event._id}
                  className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-200"
                >
                  {/* Cover Image */}
                  <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-neutral-800">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <EventImageFallback name={event.name} category={category} />
                    )}
                    {category && (
                      <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-black uppercase ${colorClass}`}>
                        {category.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {eventDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}
                    </p>
                    <h3 className="font-black text-base uppercase leading-tight">
                      {event.name}
                    </h3>
                    {event.venue && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="uppercase font-bold truncate">{event.venue}</span>
                      </div>
                    )}
                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => navigate(`/event/${event._id}`)}
                        className="w-full border-2 border-black dark:border-white py-2 text-[11px] font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      >
                        VIEW DETAILS
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}