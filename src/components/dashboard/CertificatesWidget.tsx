import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trophy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CertificatesWidget() {
  const completedEvents = useQuery(api.dashboard.getCompletedEvents);

  const certificatesCount = completedEvents?.filter((e) => e.hasCertificate).length || 0;

  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <Trophy className="h-16 w-16 mx-auto mb-3 text-primary" />
        <div className="text-4xl font-black">{certificatesCount}</div>
        <p className="text-sm text-muted-foreground mt-1">Certificates Earned</p>
      </div>

      {completedEvents && completedEvents.length > 0 && (
        <div className="space-y-2">
          {completedEvents.slice(0, 2).map((event) => (
            event.hasCertificate && (
              <div
                key={event._id}
                className="border-2 border-black dark:border-white p-2 flex items-center justify-between"
              >
                <span className="text-xs font-bold truncate">{event.name}</span>
                {event.certificateUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(event.certificateUrl, "_blank")}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
