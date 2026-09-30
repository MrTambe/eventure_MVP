import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { friendlyErrorMessage } from "@/lib/friendly-error";

type AuthMode = "password" | "otp";
type OtpStep = "email" | "code";

export function AuthCard() {
  const { signIn } = useAuthActions();
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [isLoading, setIsLoading] = useState(false);

  // Password sign in
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setIsLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Password sign in failed:", error);
      toast.error(friendlyErrorMessage(error, "Invalid email or password"));
      setIsLoading(false);
    }
  };

  // OTP: send code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setIsLoading(true);
    try {
      await signIn("email-otp", { email });
      setOtpStep("code");
      toast.success("Verification code sent to your email");
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error(
        friendlyErrorMessage(error, "Couldn't send the verification code. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // OTP: verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error("Please enter the verification code");
      return;
    }
    setIsLoading(true);
    try {
      await signIn("email-otp", { email, code });
      toast.success("Successfully signed in!");
    } catch (error) {
      console.error("Failed to verify code:", error);
      toast.error(
        friendlyErrorMessage(error, "That code didn't work. Please check it and try again.")
      );
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOtpStep("email");
    setCode("");
    setEmail("");
    setPassword("");
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {authMode === "password" ? (
            <Lock className="h-6 w-6 text-primary" />
          ) : (
            <Mail className="h-6 w-6 text-primary" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          {authMode === "password"
            ? "Sign in with your email and password"
            : "Sign in with a one-time code sent to your email"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => switchMode("password")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              authMode === "password"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => switchMode("otp")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              authMode === "otp"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Email OTP
          </button>
        </div>

        {/* Password form */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pw-email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="pw-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pw-password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="pw-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        )}

        {/* OTP form */}
        {authMode === "otp" && otpStep === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp-email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="otp-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
        )}

        {authMode === "otp" && otpStep === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp-code" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="otp-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Check your email for the verification code
              </p>
            </div>
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={resetForm}
                disabled={isLoading}
              >
                Use Different Email
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </CardContent>
    </Card>
  );
}