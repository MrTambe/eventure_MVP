import { Protected } from "@/lib/protected-page";
import { MobileDashboard } from "@/components/dashboard/MobileDashboard";

export default function Dashboard() {
  return (
    <Protected>
      <MobileDashboard />
    </Protected>
  );
}