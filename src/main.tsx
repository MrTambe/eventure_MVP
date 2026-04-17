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
import Certificates from "./pages/Certificates.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Toaster } from "@/components/ui/sonner";
import EventInfo from "./pages/EventInfo.tsx";
import AdminSignIn from "./pages/AdminSignIn.tsx";
import AdminEvents from "./pages/AdminEvents.tsx";
import AdminCommunication from "./pages/AdminCommunication.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";
import AdminTeam from "@/pages/AdminTeam.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminTickets from "./pages/AdminTickets.tsx";
import { Protected } from "@/lib/protected-page.tsx";
import { AdminProtected } from "@/lib/admin-protected-page.tsx";
import CompleteProfile from "./pages/CompleteProfile.tsx";

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
            <Route path="/certificates" element={<Protected><Certificates /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/event/:eventId" element={<Protected><EventInfo /></Protected>} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-signIn" element={<AdminSignIn />} />
            <Route path="/admin-dashboard" element={<AdminProtected><AdminDashboard /></AdminProtected>} />
            <Route path="/admin-events" element={<AdminProtected><AdminEvents /></AdminProtected>} />
            <Route path="/admin-team" element={<AdminProtected><AdminTeam /></AdminProtected>} />
            <Route path="/admin-communication" element={<AdminProtected><AdminCommunication /></AdminProtected>} />
            <Route path="/admin-tickets" element={<AdminProtected><AdminTickets /></AdminProtected>} />
            <Route path="/admin-settings" element={<AdminProtected><AdminSettings /></AdminProtected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </ConvexProvider>
  </React.StrictMode>
);