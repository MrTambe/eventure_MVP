import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

export default function AdminSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mutations
  const adminLogin = useMutation(api.admin.adminLogin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminLogin({
        email: email.trim(),
        password: password.trim(),
      });

      if (result.success && result.admin) {
        toast.success(result.message);
        
        // Store admin data in session storage
        sessionStorage.setItem("adminUser", JSON.stringify(result.admin));
        
        // Navigate to admin dashboard
        navigate("/admin-dashboard");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-mono">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter">ADMIN SIGN IN</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Access your event management dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-bold mb-2 block">EMAIL</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="border-2 border-black dark:border-white font-mono"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-bold mb-2 block">PASSWORD</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-2 border-black dark:border-white font-mono"
            />
          </div>
          <div>
            <Button 
              type="submit" 
              className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg py-3 border-2 border-black dark:border-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  SIGNING IN...
                </>
              ) : (
                'SIGN IN'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}