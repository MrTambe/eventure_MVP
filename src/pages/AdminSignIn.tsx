import React, { useState } from 'react';
import { Link } from 'react-router';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Actions
  const adminLogin = useAction(api.admin.adminLogin);

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

      if (result.success && result.user) {
        toast.success(result.message);
        
        // Store user data in session storage
        sessionStorage.setItem("adminUser", JSON.stringify(result.user));
        
        // Update state to show success message and button, instead of redirecting
        setLoginSuccess(true);
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
        
        {loginSuccess ? (
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-green-500">Login Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400">You can now proceed to your dashboard.</p>
            <Link to="/admin-dashboard">
              <Button className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg py-3 border-2 border-black dark:border-white">
                GO TO DASHBOARD
              </Button>
            </Link>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}