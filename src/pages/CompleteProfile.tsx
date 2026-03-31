import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function CompleteProfile() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useMutation(api.users.updateCurrentUserProfile);

  const [form, setForm] = useState({
    name: "",
    rollNo: "",
    branch: "",
    mobileNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill name if already set
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || "",
        rollNo: (user as any).rollNo || "",
        branch: (user as any).branch || "",
        mobileNumber: (user as any).mobileNumber || "",
      }));
    }
  }, [user]);

  // If profile is already complete, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const isComplete = !!(user.name && (user as any).rollNo && (user as any).branch && (user as any).mobileNumber);
      if (isComplete) {
        navigate("/dashboard", { replace: true });
      }
    }
    if (!isLoading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f0e8] dark:bg-neutral-950">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.rollNo.trim() || !form.branch.trim() || !form.mobileNumber.trim()) {
      toast.error("All fields are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        rollNo: form.rollNo.trim(),
        branch: form.branch.trim(),
        mobileNumber: form.mobileNumber.trim(),
      });
      toast.success("Profile completed!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-neutral-950 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black dark:text-white leading-none mb-2">
            COMPLETE YOUR PROFILE
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in your details to continue. This is required to access the platform.
          </p>
        </div>

        <div className="border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (read-only) */}
            <div>
              <label className="text-xs font-black uppercase text-black dark:text-white block mb-1">Email</label>
              <input
                type="email"
                value={user.email || ""}
                readOnly
                className="w-full border-2 border-black/30 dark:border-white/30 bg-neutral-100 dark:bg-neutral-800 text-muted-foreground px-3 py-2 text-sm cursor-not-allowed"
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-black uppercase text-black dark:text-white block mb-1">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="text-xs font-black uppercase text-black dark:text-white block mb-1">Roll Number *</label>
              <input
                type="text"
                value={form.rollNo}
                onChange={e => setForm(prev => ({ ...prev, rollNo: e.target.value }))}
                placeholder="e.g. 21CS001"
                className="w-full border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            {/* Branch */}
            <div>
              <label className="text-xs font-black uppercase text-black dark:text-white block mb-1">Branch *</label>
              <input
                type="text"
                value={form.branch}
                onChange={e => setForm(prev => ({ ...prev, branch: e.target.value }))}
                placeholder="e.g. Computer Science"
                className="w-full border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-black uppercase text-black dark:text-white block mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={form.mobileNumber}
                onChange={e => setForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                placeholder="e.g. 9876543210"
                className="w-full border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 text-black dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black py-3 text-sm font-black uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-[4px_4px_0px_#555] dark:shadow-[4px_4px_0px_#aaa] hover:shadow-[2px_2px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save & Continue"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
