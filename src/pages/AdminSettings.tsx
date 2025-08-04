import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MenuBar } from "@/components/ui/glow-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Calendar, Users, Settings } from "lucide-react";
import { useNavigate } from "react-router";

interface AdminUser {
  _id: Id<"admins">;
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
  const [activeMenuItem, setActiveMenuItem] = useState("Settings");

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    
    // Navigate to the corresponding route
    switch (itemName) {
      case 'Dashboard':
        navigate('/admin-dashboard');
        break;
      case 'Events':
        navigate('/admin-events');
        break;
      case 'Team':
        navigate('/admin-team');
        break;
      case 'Settings':
        navigate('/admin-settings');
        break;
      default:
        break;
    }
  };

  // Get admin profile data
  const adminProfile = useQuery(
    api.admin.getAdminProfile,
    adminUser ? { adminId: adminUser._id } : "skip"
  );

  // Update admin profile mutation
  const updateProfile = useMutation(api.admin.updateAdminProfile);

  // Load admin user from session storage on component mount
  useEffect(() => {
    const storedAdmin = sessionStorage.getItem("adminUser");
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdminUser(parsedAdmin);
      } catch (error) {
        console.error("Error parsing admin user:", error);
        toast.error("Failed to load admin data. Please sign in again.");
      }
    } else {
      toast.error("No admin session found. Please sign in.");
    }
  }, []);

  // Update form data when admin profile is loaded
  useEffect(() => {
    if (adminProfile) {
      const profileData = {
        name: adminProfile.name || "",
        rollNo: adminProfile.rollNo || "",
        branch: adminProfile.branch || "",
        phone: adminProfile.phone || "",
        email: adminProfile.email || "",
      };
      setFormData(profileData);
      setOriginalData(profileData);
    } else if (adminUser && adminProfile === null) {
      // If no profile exists, pre-fill with admin user data
      const defaultData = {
        name: adminUser.name || "",
        rollNo: "",
        branch: "",
        phone: "",
        email: adminUser.email || "",
      };
      setFormData(defaultData);
      setOriginalData(defaultData);
    }
  }, [adminProfile, adminUser]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const hasChanges = () => {
    return Object.keys(formData).some(
      key => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
    );
  };

  const validateForm = () => {
    const { name, rollNo, branch, phone, email } = formData;
    
    // Check if all fields are filled
    if (!name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!rollNo.trim()) {
      toast.error("Roll Number is required");
      return false;
    }
    if (!branch.trim()) {
      toast.error("Branch is required");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Phone Number is required");
      return false;
    }
    if (!email.trim()) {
      toast.error("Email Address is required");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    console.log("Save button clicked!"); // Debug log
    
    if (!adminUser) {
      console.log("No admin user found"); // Debug log
      toast.error("Admin user not found. Please sign in again.");
      return;
    }

    console.log("Validating form..."); // Debug log
    if (!validateForm()) {
      console.log("Form validation failed"); // Debug log
      return;
    }

    console.log("Starting save process..."); // Debug log
    setIsLoading(true);
    
    try {
      console.log("Calling updateProfile with:", {
        adminId: adminUser._id,
        ...formData
      }); // Debug log

      const result = await updateProfile({
        adminId: adminUser._id,
        name: formData.name.trim(),
        rollNo: formData.rollNo.trim(),
        branch: formData.branch.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });

      console.log("Update result:", result); // Debug log

      if (result.success) {
        console.log("Success! Showing toast..."); // Debug log
        toast.success("Profile updated successfully!");
        // Update original data to reflect saved changes
        setOriginalData({ ...formData });
      } else {
        console.log("Update failed:", result.message); // Debug log
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while admin user is being loaded
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="font-mono text-black">Loading admin data...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-500' },
    { name: 'Events', label: 'Events', href: '/admin-events', icon: Calendar, gradient: 'from-green-500 to-emerald-500', iconColor: 'text-green-500' },
    { name: 'Team', label: 'Team', href: '/admin-team', icon: Users, gradient: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500' },
    { name: 'Settings', label: 'Settings', href: '/admin-settings', icon: Settings, gradient: 'from-red-500 to-orange-500', iconColor: 'text-red-500' }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Menu Bar */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <MenuBar 
          items={menuItems} 
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
        />
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
                  disabled={isLoading}
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