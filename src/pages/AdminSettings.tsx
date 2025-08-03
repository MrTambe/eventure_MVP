import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuBar } from "@/components/ui/glow-menu";
import { motion } from "framer-motion";

interface AdminUser {
  _id: Id<"admins">;
  email: string;
  name?: string;
}

function AdminSettingsContent() {
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
    api.admin.getAdminProfile,
    adminUser ? { adminId: adminUser._id } : "skip"
  );

  // Update profile mutation
  const updateProfile = useMutation(api.admin.updateAdminProfile);

  // Load admin user from session storage
  useEffect(() => {
    const storedAdmin = sessionStorage.getItem("adminUser");
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
    }
  }, []);

  // Pre-fill form with existing data
  useEffect(() => {
    if (adminProfile) {
      const data = {
        name: adminProfile.name || "",
        rollNo: adminProfile.rollNo || "",
        branch: adminProfile.branch || "",
        phone: adminProfile.phone || "",
        email: adminProfile.email || "",
      };
      setFormData(data);
      setOriginalData(data);
    } else if (adminUser) {
      // If no profile exists, pre-fill with admin email
      const data = {
        name: adminUser.name || "",
        rollNo: "",
        branch: "",
        phone: "",
        email: adminUser.email || "",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [adminProfile, adminUser]);

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

  const handleSave = async () => {
    if (!adminUser) {
      toast.error("Admin user not found");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await updateProfile({
        adminId: adminUser._id,
        name: formData.name,
        rollNo: formData.rollNo,
        branch: formData.branch,
        phone: formData.phone,
        email: formData.email,
      });

      if (result.success) {
        toast.success(result.message);
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

  const menuItems = [
    { name: 'Dashboard', href: '/admin-dashboard', icon: '🏠' },
    { name: 'Events', href: '/admin-events', icon: '📅' },
    { name: 'Team', href: '/admin-team', icon: '👥' },
    { name: 'Settings', href: '/admin-settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Menu Bar */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <MenuBar items={menuItems} />
      </div>

      {/* Main Content */}
      <div className="pt-32 px-4 flex justify-center">
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
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges()}
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
        </motion.div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  return <AdminSettingsContent />;
}
