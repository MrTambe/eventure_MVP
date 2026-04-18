import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trophy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type CompletedEvent = { _id: string; name: string; startDate: number; endDate: number; hasCertificate: boolean; certificateUrl?: string };

export function CertificatesWidget() {
  const completedEvents = useQuery(api.dashboard.getCompletedEvents);

  const certificatesWithBadge = (completedEvents as CompletedEvent[] | undefined)?.filter((e: CompletedEvent) => e.hasCertificate) || [];

  return (
    <div className="space-y-3">
      {certificatesWithBadge.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <Trophy className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
            NO CERTIFICATES YET
          </p>
        </div>
      ) : (
        certificatesWithBadge.slice(0, 2).map((event: CompletedEvent) => (
          <div
            key={event._id}
            className="border-2 border-black dark:border-white p-3 flex items-center gap-3 bg-white dark:bg-neutral-800"
          >
            <div className="h-10 w-10 border-2 border-black dark:border-white flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm uppercase truncate">{event.name}</p>
              <p className="text-[10px] text-muted-foreground">
                Unlocked on {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
              </p>
            </div>
            {event.certificateUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => window.open(event.certificateUrl, "_blank")}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}