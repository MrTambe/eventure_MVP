import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar, Award, Activity } from "lucide-react";
import { motion } from "framer-motion";

export function QuickStatsWidget() {
  const allEvents = useQuery(api.events.list);
  const completedEvents = useQuery(api.dashboard.getCompletedEvents);

  const now = Date.now();

  const totalEvents = allEvents?.length ?? 0;
  const totalCertificates = completedEvents?.filter(e => e.hasCertificate).length ?? 0;
  const activeEvents = allEvents?.filter(e => e.startDate <= now && e.endDate >= now).length ?? 0;

  const statItems = [
    {
      icon: Calendar,
      label: "EVENTS",
      value: totalEvents,
    },
    {
      icon: Award,
      label: "CERTIFICATES",
      value: totalCertificates,
    },
    {
      icon: Activity,
      label: "ACTIVE EVENTS",
      value: activeEvents,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          className="flex items-center justify-between border-2 border-black dark:border-white px-3 py-2 bg-white dark:bg-neutral-800"
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-4 w-4 text-black dark:text-white" />
            <span className="text-[11px] font-black uppercase tracking-wide">{item.label}</span>
          </div>
          <span className="text-lg font-black">{item.value}</span>
        </motion.div>
      ))}
    </div>
  );
}