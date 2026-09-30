import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar, Award, Activity, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export function QuickStatsWidget() {
  const completedEvents = useQuery(api.dashboard.getCompletedEvents);
  const registeredEvents = useQuery(api.dashboard.getAllUserRegisteredEvents);
  const navigate = useNavigate();

  const totalRegistered = (registeredEvents?.length ?? 0) + (completedEvents?.length ?? 0);
  const eventsDone = completedEvents?.length ?? 0;
  const totalCertificates = completedEvents?.filter((e: { hasCertificate: boolean }) => e.hasCertificate).length ?? 0;
  const upcomingCount = registeredEvents?.length ?? 0;

  const statItems = [
    {
      icon: Calendar,
      label: "REGISTERED",
      value: totalRegistered,
      onClick: () => navigate("/events"),
    },
    {
      icon: CheckCircle,
      label: "COMPLETED",
      value: eventsDone,
      onClick: () => navigate("/certificates"),
    },
    {
      icon: Award,
      label: "CERTIFICATES",
      value: totalCertificates,
      onClick: () => navigate("/certificates"),
    },
    {
      icon: Activity,
      label: "UPCOMING",
      value: upcomingCount,
      onClick: () => navigate("/events"),
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {statItems.map((item, index) => (
        <motion.button
          key={item.label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          onClick={item.onClick}
          whileHover={{ x: 2, y: 2 }}
          className="flex items-center justify-between border-2 border-black dark:border-white px-3 py-2 bg-white dark:bg-neutral-800 hover:bg-[#c8f0e0] dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
          title={`Go to ${item.label === "REGISTERED" || item.label === "UPCOMING" ? "Events" : "Certificates"}`}
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-4 w-4 text-black dark:text-white" />
            <span className="text-[11px] font-black uppercase tracking-wide">{item.label}</span>
          </div>
          <span className="text-lg font-black">{item.value}</span>
        </motion.button>
      ))}
    </div>
  );
}
