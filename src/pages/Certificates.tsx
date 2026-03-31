import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Home, Calendar, Trophy, User, Settings, Download, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

const TEMPLATE_URL = "/assets/Blue_White_Aesthetic_Elegant_Completion_Certificate__1_.png";

async function generateCertificate(userName: string, eventName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = 3; // High resolution
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

      // Overlay user name
      ctx.save();
      ctx.font = "bold 48px 'Playfair Display', serif";
      ctx.fillStyle = "#1f2a44";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const x = img.naturalWidth / 2;
      const y = img.naturalHeight * 0.47;
      ctx.fillText(userName, x, y);
      ctx.restore();

      // Overlay event name (smaller, below name)
      ctx.save();
      ctx.font = "bold 28px 'Playfair Display', serif";
      ctx.fillStyle = "#1f2a44";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(eventName, img.naturalWidth / 2, img.naturalHeight * 0.57);
      ctx.restore();

      const imgData = canvas.toDataURL("image/png", 1.0);

      // Create PDF in landscape
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [img.naturalWidth, img.naturalHeight],
      });
      pdf.addImage(imgData, "PNG", 0, 0, img.naturalWidth, img.naturalHeight);
      pdf.save(`certificate-${userName.replace(/\s+/g, "-")}-${eventName.replace(/\s+/g, "-")}.pdf`);
      resolve();
    };
    img.onerror = reject;
    img.src = TEMPLATE_URL;
  });
}

function CertificateCard({ event, userName }: { event: any; userName: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateCertificate(userName, event.name);
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Failed to generate certificate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] overflow-hidden"
    >
      {/* Certificate preview */}
      <div className="relative h-40 overflow-hidden bg-[#f5f0e8] dark:bg-neutral-800 border-b-2 border-black dark:border-white">
        <img
          src={TEMPLATE_URL}
          alt="Certificate template"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-xs font-black uppercase text-black/60 dark:text-white/60 tracking-widest mb-1">CERTIFICATE OF COMPLETION</p>
            <p className="text-sm font-black uppercase text-black dark:text-white truncate max-w-[200px]">{userName}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-8 w-8 border-2 border-black dark:border-white flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm uppercase truncate text-black dark:text-white">{event.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Completed {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black py-2 text-xs font-black uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-[3px_3px_0px_#555] dark:shadow-[3px_3px_0px_#aaa] hover:shadow-[1px_1px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
          ) : (
            <><Download className="h-3 w-3" /> Download PDF</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function Certificates() {
  const dockItems = [
    { icon: <Home size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Events', href: '/events' },
    { icon: <Trophy size={20} />, label: 'Certificates', href: '/certificates' },
    { icon: <User size={20} />, label: 'Profile', href: '/profile' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/settings' },
  ];

  const completedEvents = useQuery(api.dashboard.getCompletedEvents);
  const { user } = useAuth();
  const userName = user?.name || "Participant";

  return (
    <Protected>
      <Dock items={dockItems} />
      <div className="fixed top-0 right-6 z-50 pt-6">
        <ThemeSwitcher />
      </div>

      <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 px-6 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-black dark:text-white leading-none mb-2">
                CERTIFICATES
              </h1>
              <p className="text-sm text-muted-foreground">
                Download your earned certificates as PDF.
              </p>
            </div>
            <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] px-5 py-3 text-center min-w-[80px]">
              <div className="text-3xl font-black text-black dark:text-white">
                {completedEvents?.length ?? 0}
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">EARNED</div>
            </div>
          </div>

          {!completedEvents ? (
            <div className="text-sm text-muted-foreground text-center py-20">Loading certificates...</div>
          ) : completedEvents.length === 0 ? (
            <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] p-16 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">
                NO CERTIFICATES YET
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Complete events to earn certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEvents.map((event) => (
                <CertificateCard key={event._id} event={event} userName={userName} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}