import { Protected } from "@/lib/protected-page";
import { Dock } from "@/components/ui/dock";
import { Home, Calendar, User, LayoutGrid, Pencil, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";

function ProfileHeader() {
  const { theme, setTheme } = useTheme();
  return (
    <header className="w-full border-b-[3px] border-black dark:border-white bg-[#FDF8F3] dark:bg-neutral-950 px-6 py-4 flex items-center justify-between">
      <span className="text-xl md:text-2xl font-black tracking-tight uppercase font-sans text-black dark:text-white">
        Eventure
      </span>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-10 h-10 border-2 border-black dark:border-white rounded-lg flex items-center justify-center bg-white dark:bg-neutral-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}

function ProfileCard({ user }: { user: any }) {
  const displayName = user?.name || "User";
  const nameParts = displayName.split(" ");
  const firstName = nameParts[0]?.toUpperCase() || "";
  const lastName = nameParts.slice(1).join(" ").toUpperCase() || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] bg-white dark:bg-neutral-900 p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start"
    >
      {/* Profile Image */}
      <div className="w-32 h-40 md:w-36 md:h-44 border-2 border-black dark:border-white bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
        {user?.image ? (
          <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black dark:bg-white text-white dark:text-black text-3xl font-black">
            {firstName.charAt(0)}{lastName.charAt(0) || firstName.charAt(1) || ""}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black dark:text-white leading-none">
          {firstName} {lastName}
        </h1>
        <div className="inline-block w-fit bg-neutral-200 dark:bg-neutral-700 border border-black dark:border-white px-3 py-1">
          <span className="text-xs md:text-sm font-bold uppercase tracking-wide text-black dark:text-white">
            {user?.branch || "Event Member"}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full border border-black dark:border-white bg-pink-50 dark:bg-pink-900/30 text-xs font-bold uppercase tracking-wide text-black dark:text-white">
            Pro Member
          </span>
          <span className="px-3 py-1 rounded-full border border-black dark:border-white bg-green-50 dark:bg-green-900/30 text-xs font-bold uppercase tracking-wide text-black dark:text-white">
            Organizer
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function InfoField({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] bg-white dark:bg-neutral-900 p-5"
    >
      <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
        {label}
      </p>
      <p className="text-lg md:text-xl font-bold uppercase tracking-tight text-black dark:text-white">
        {value || "—"}
      </p>
    </motion.div>
  );
}

function EditProfileModal({ user, onClose }: { user: any; onClose: () => void }) {
  const updateProfile = useMutation(api.users.updateCurrentUserProfile);
  const [form, setForm] = useState({
    name: user?.name || "",
    rollNo: user?.rollNo || "",
    branch: user?.branch || "",
    mobileNumber: user?.mobileNumber || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] bg-[#FDF8F3] dark:bg-neutral-900 p-6"
      >
        <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-5">Edit Profile</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: "Full Name", key: "name" as const },
            { label: "Roll No", key: "rollNo" as const },
            { label: "Branch / Department", key: "branch" as const },
            { label: "Mobile Number", key: "mobileNumber" as const },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1 block">
                {field.label}
              </label>
              <input
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-bold text-black dark:text-white outline-none focus:shadow-[3px_3px_0px_0px_#6D28D9] transition-shadow"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#6D28D9] border-2 border-black dark:border-white text-white font-black uppercase tracking-wide py-2.5 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#fff] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="px-5 bg-white dark:bg-neutral-800 border-2 border-black dark:border-white text-black dark:text-white font-black uppercase tracking-wide py-2.5 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#fff] transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ActionButtons({ onEdit, onLogout }: { onEdit: () => void; onLogout: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.5 }}
      className="flex gap-3"
    >
      <button
        onClick={onEdit}
        className="flex-1 flex items-center justify-center gap-3 bg-[#6D28D9] border-[3px] border-black dark:border-white text-white font-black uppercase tracking-wide text-base md:text-lg py-4 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#fff] transition-all cursor-pointer"
      >
        <Pencil size={20} />
        Edit Profile
      </button>
      <button
        onClick={onLogout}
        className="w-14 md:w-16 flex items-center justify-center bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-white text-black dark:text-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#fff] transition-all cursor-pointer"
      >
        <LogOut size={20} />
      </button>
    </motion.div>
  );
}

function StatsAndDock() {
  const dockItems = [
    { icon: <LayoutGrid size={18} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Calendar size={18} />, label: "Events", href: "/events" },
    { icon: <Calendar size={18} />, label: "Calendar", href: "/certificates" },
    { icon: <User size={18} />, label: "Profile", href: "/profile" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="flex items-stretch justify-center gap-0 w-full max-w-2xl mx-auto"
    >
      {/* Left stat */}
      <div className="flex flex-col items-center justify-center px-5 py-3 bg-[#EDE9E0] dark:bg-neutral-800 border-2 border-black dark:border-white rounded-l-xl">
        <span className="text-2xl md:text-3xl font-black text-black dark:text-white">24</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">Events Done</span>
      </div>

      {/* Dock center */}
      <div className="flex items-center bg-white dark:bg-neutral-900 border-y-2 border-black dark:border-white px-2 gap-1">
        {dockItems.map((item, i) => {
          const isActive = item.href === "/profile";
          return (
            <a
              key={i}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 md:px-4 py-2 rounded-lg transition-colors min-w-[52px] ${
                isActive
                  ? "bg-green-100 dark:bg-green-900/40 text-black dark:text-white"
                  : "text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <span className="flex items-center justify-center relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400" />
                )}
              </span>
              <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wide mt-0.5">{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* Right stat */}
      <div className="flex flex-col items-center justify-center px-5 py-3 bg-[#EDE9E0] dark:bg-neutral-800 border-2 border-black dark:border-white rounded-r-xl">
        <span className="text-2xl md:text-3xl font-black text-black dark:text-white">4.9</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">Rating</span>
      </div>
    </motion.div>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Protected>
      <div className="min-h-screen bg-[#FDF8F3] dark:bg-neutral-950 flex flex-col">
        <ProfileHeader />

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-8 pb-32 flex flex-col gap-5">
          <ProfileCard user={user} />

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Full Name" value={user?.name?.toUpperCase() || "—"} delay={0.15} />
            <InfoField label="Email Address" value={user?.email || "—"} delay={0.2} />
            <InfoField label="Roll No" value={user?.rollNo?.toUpperCase() || "—"} delay={0.25} />
            <InfoField label="Department" value={user?.branch?.toUpperCase() || "—"} delay={0.3} />
          </div>
          <InfoField label="Contact Number" value={user?.mobileNumber || "—"} delay={0.35} />

          <ActionButtons onEdit={() => setEditOpen(true)} onLogout={handleLogout} />

          <StatsAndDock />
        </main>

        {editOpen && <EditProfileModal user={user} onClose={() => setEditOpen(false)} />}
      </div>
    </Protected>
  );
}