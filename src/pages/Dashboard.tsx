import { Protected } from "@/lib/protected-page";
import { BackgroundPaths } from "@/components/ui/background-paths";

export default function Dashboard() {
  return (
    <Protected>
      <BackgroundPaths title="Event Dashboard" />
    </Protected>
  );
}