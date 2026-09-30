/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { AdminNavBar } from "@/components/admin/admin-navbar";
import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-nav-items";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { FileSpreadsheet, ExternalLink, Loader2 } from "lucide-react";

interface AdminUser {
  _id: Id<"users">;
  email: string;
  name?: string;
}

function AdminSettingsContent() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    branch: "",
    phone: "",
    email: "",
  });
  const [originalData, setOriginalData] = useState({
    name: "",
    rollNo: "",
    branch: "",
    phone: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  // Get admin profile data
  const adminProfile = useQuery(
    api.users.currentUser
  );

  // ===== Google Sheets backup =====
  const events = useQuery(api.events.list);
  const syncSheets = useAction(api.googleSheets.syncEventSheetsNow);
  const [syncEventId, setSyncEventId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{ participants?: string; staff?: string; overview?: string; sharedWith?: string[] } | null>(null);

  // Update profile mutation
  const updateSettingsProfile = useMutation(api.team.updateAdminSettingsByEmail);

  // Load admin user from session storage
  useEffect(() => {
    const storedAdmin = sessionStorage.getItem("adminUser");
    if (storedAdmin) {
      const parsed = JSON.parse(storedAdmin);
      setAdminUser(parsed);
      // Team members can only view their own settings, not edit admin settings
    }
  }, []);

  const isTeamMember = (() => {
    try {
      const s = sessionStorage.getItem("adminUser");
      if (s) {
        const p = JSON.parse(s);
        return p?.role === "teammember";
      }
    } catch {}
    return false;
  })();

  // Pre-fill form with existing data from session (admin session, not Convex auth)
  useEffect(() => {
    if (adminUser) {
      const data = {
        name: (adminUser as any).name || "",
        rollNo: (adminUser as any).rollNo || "",
        branch: (adminUser as any).branch || "",
        phone: (adminUser as any).mobileNumber || "",
        email: adminUser.email || "",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [adminUser]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.rollNo.trim()) {
      toast.error("Roll No. is required");
      return false;
    }
    if (!formData.branch.trim()) {
      toast.error("Branch is required");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Mobile Number is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email Address is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error("Mobile number must be 10 digits");
      return false;
    }
    return true;
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const handleSyncSheets = async () => {
    if (!syncEventId) {
      toast.error("Choose an event to back up first");
      return;
    }
    setSyncing(true);
    try {
      const result = await syncSheets({ eventId: syncEventId as any, adminEmail: adminUser?.email });
      if (result?.success) {
        setLastSync(result.sheets || null);
        toast.success(`Backup created${result.sharedWith?.length ? ` — shared with ${result.sharedWith.length} admin(s)` : ""}!`);
      } else {
        toast.error(result?.message || "Sheets sync failed");
      }
    } catch (e: any) {
      console.error("Sheets sync error:", e);
      toast.error(friendlyErrorMessage(e, "Couldn't create the Sheets backup. Check the Google service-account config."));
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!adminUser) {
      toast.error("Admin user not found");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await updateSettingsProfile({
        email: formData.email,
        name: formData.name.trim(),
        rollNo: formData.rollNo.trim(),
        branch: formData.branch.trim(),
        mobileNumber: formData.phone.trim(),
      });

      if (result.success) {
        toast.success(result.message);
        // Update session storage with new data
        const updatedAdmin = {
          ...adminUser,
          name: formData.name.trim(),
          rollNo: formData.rollNo.trim(),
          branch: formData.branch.trim(),
          mobileNumber: formData.phone.trim(),
        };
        sessionStorage.setItem("adminUser", JSON.stringify(updatedAdmin));
        setAdminUser(updatedAdmin as any);
        setOriginalData({ ...formData });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10">
      {/* Admin Navbar */}
      <AdminNavBar items={ADMIN_NAV_ITEMS} />

      {/* Main Content */}
      <div className="pt-24 px-4 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Settings Card */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000]">
            <h1 className="text-2xl font-bold mb-8 text-left">ADMIN SETTINGS</h1>
            
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <Label htmlFor="name" className="block text-sm font-bold mb-2 text-left">
                  NAME
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full h-12 px-4 border-4 border-black bg-white text-black font-mono text-base focus:outline-none focus:ring-0 focus:border-black rounded-none"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Roll No Field */}
              <div>
                <Label htmlFor="rollNo" className="block text-sm font-bold mb-2 text-left">
                  ROLL NO.
                </Label>
                <Input
                  id="rollNo"
                  type="text"
                  value={formData.rollNo}
                  onChange={(e) => handleInputChange("rollNo", e.target.value)}
                  className="w-full h-12 px-4 border-4 border-black bg-white text-black font-mono text-base focus:outline-none focus:ring-0 focus:border-black rounded-none"
                  placeholder="Enter your roll number"
                />
              </div>

              {/* Branch Field */}
              <div>
                <Label htmlFor="branch" className="block text-sm font-bold mb-2 text-left">
                  BRANCH
                </Label>
                <Input
                  id="branch"
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  className="w-full h-12 px-4 border-4 border-black bg-white text-black font-mono text-base focus:outline-none focus:ring-0 focus:border-black rounded-none"
                  placeholder="Enter your branch"
                />
              </div>

              {/* Mobile Number Field */}
              <div>
                <Label htmlFor="phone" className="block text-sm font-bold mb-2 text-left">
                  MOBILE NUMBER
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full h-12 px-4 border-4 border-black bg-white text-black font-mono text-base focus:outline-none focus:ring-0 focus:border-black rounded-none"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="block text-sm font-bold mb-2 text-left">
                  EMAIL ADDRESS
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full h-12 px-4 border-4 border-black bg-white text-black font-mono text-base focus:outline-none focus:ring-0 focus:border-black rounded-none"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4">
                {isTeamMember && (
                  <div className="mb-3 px-4 py-2 bg-yellow-400 text-black text-xs font-black uppercase tracking-wide text-center border-2 border-black">
                    VIEW ONLY — Team members cannot edit settings
                  </div>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges() || isTeamMember}
                  className="w-full h-14 bg-black text-white font-bold text-lg border-4 border-black hover:bg-gray-800 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed rounded-none shadow-[4px_4px_0px_#666]"
                >
                  {isLoading ? "SAVING..." : "SAVE CHANGES »"}
                </Button>
              </div>

              {/* Last Updated Info */}
              {adminProfile && (
                <div className="pt-4 text-center">
                  <p className="text-xs text-gray-600 font-mono">
                    Last updated: {new Date(adminProfile._creationTime).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Google Sheets Backup (admins only) */}
          {!isTeamMember && (
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000] mt-8">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                GOOGLE SHEETS BACKUP
              </h2>
              <p className="text-xs text-gray-600 font-mono mb-6">
                Exports every participant, staff member and event stat into a formatted
                Google Drive folder (one per event) — a readable backup DB shared
                automatically with all admin emails.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sync-event" className="block text-sm font-bold mb-2 text-left">
                    EVENT
                  </Label>
                  <select
                    id="sync-event"
                    value={syncEventId}
                    onChange={(e) => setSyncEventId(e.target.value)}
                    className="w-full h-12 px-3 border-4 border-black bg-white text-black font-mono text-sm rounded-none focus:outline-none cursor-pointer"
                  >
                    <option value="">— Select event —</option>
                    {(events || []).map((ev: any) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.name} ({ev.status})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleSyncSheets}
                  disabled={syncing || !syncEventId}
                  className="w-full h-14 bg-[#6D28D9] text-white font-bold text-lg border-4 border-black hover:bg-[#5b21b6] disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed rounded-none shadow-[4px_4px_0px_#666]"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      SYNCING TO SHEETS...
                    </>
                  ) : (
                    "BACK UP TO GOOGLE SHEETS »"
                  )}
                </Button>
                {lastSync && (
                  <div className="border-2 border-black p-3 space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                      Last backup — open sheets:
                    </p>
                    {[
                      ["Participants", lastSync.participants],
                      ["Staff & Volunteers", lastSync.staff],
                      ["Event Overview", lastSync.overview],
                    ].map(([label, url]) =>
                      url ? (
                        <a
                          key={label as string}
                          href={url as string}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {label}
                        </a>
                      ) : null
                    )}
                    {lastSync.sharedWith && lastSync.sharedWith.length > 0 && (
                      <p className="text-[10px] text-gray-500 font-mono pt-1">
                        Shared with: {lastSync.sharedWith.join(", ")}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 font-mono">
                  Requires GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY and
                  (optional) GOOGLE_SHEETS_ROOT_FOLDER_ID on the deployment. Admin emails
                  from the admins table get automatic edit access.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  return <AdminSettingsContent />;
}