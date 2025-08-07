import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function AdminProtected({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("adminUser");
    if (!storedUser) {
      navigate("/admin-signIn");
      return;
    }

    const user = JSON.parse(storedUser);

    if (requiredRole && user.role !== requiredRole) {
      navigate("/admin-signIn"); // Or an unauthorized page
      return;
    }
    
    setIsAuthorized(true);

  }, [navigate, requiredRole]);

  if (!isAuthorized) {
    // You can return a loader here
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <>{children}</>;
}
