import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "./index.css";

// Import core page components
import Landing from "./pages/Landing.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Events from "./pages/Events.tsx";
import Profile from "./pages/Profile.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Toaster } from "@/components/ui/sonner";
import EventInfo from "./pages/EventInfo.tsx";
import AdminSignIn from "./pages/AdminSignIn.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminEvents from "./pages/AdminEvents.tsx";
import AdminCommunication from "./pages/AdminCommunication.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";
import AdminTeam from "./pages/AdminTeam.tsx";
import { Protected } from "@/lib/protected-page.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/events" element={<Protected><Events /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/event/:eventId" element={<Protected><EventInfo /></Protected>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-signIn" element={<AdminSignIn />} />
            <Route path="/admin-dashboard" element={<Protected requiredRole="admin"><AdminDashboard /></Protected>} />
            <Route path="/admin-events" element={<Protected requiredRole="admin"><AdminEvents /></Protected>} />
            <Route path="/admin-team" element={<Protected requiredRole="admin"><AdminTeam /></Protected>} />
            <Route path="/admin-communication" element={<Protected requiredRole="admin"><AdminCommunication /></Protected>} />
            <Route path="/admin-settings" element={<Protected requiredRole="admin"><AdminSettings /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </ConvexProvider>
  </React.StrictMode>
);