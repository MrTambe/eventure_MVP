import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, Calendar, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function QuickStatsWidget() {
  const stats = useQuery(api.dashboard.getUserStats);

  const statItems = [
    {
      icon: Calendar,
      value: stats?.totalEventsJoined || 0,
      label: "Events",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Trophy,
      value: stats?.totalCertificates || 0,
      label: "Certificates",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10"
    },
    {
      icon: Users,
      value: "Active",
      label: "Status",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 h-full items-center">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="text-center flex flex-col items-center justify-center"
        >
          <div className={`${item.bgColor} rounded-xl p-2 mb-1.5 inline-flex`}>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <div className="text-lg font-black">{item.value}</div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold leading-tight">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}