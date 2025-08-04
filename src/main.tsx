import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "./index.css";

// Import your page components
import Landing from "./pages/Landing.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Events from "./pages/Events.tsx";
import Profile from "./pages/Profile.tsx";
import EventInfo from "./pages/EventInfo.tsx";
import AdminSignIn from "./pages/AdminSignIn.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminEvents from "./pages/AdminEvents.tsx";
import AdminTeam from "./pages/AdminTeam.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminSettings from "./pages/AdminSettings";
import AdminCommunication from "./pages/AdminCommunication";
import { Toaster } from "@/components/ui/sonner";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/events",
    element: <Events />,
  },
  {
    path: "/event/:slug",
    element: <EventInfo />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/admin-signIn",
    element: <AdminSignIn />,
  },
  {
    path: "/admin-dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/admin-events",
    element: <AdminEvents />,
  },
  {
    path: "/admin-team",
    element: <AdminTeam />,
  },
  {
    path: "/admin-settings",
    element: <AdminSettings />,
  },
  {
    path: "/admin-communication",
    element: <AdminCommunication />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <RouterProvider router={router} />
      </ConvexAuthProvider>
    </ConvexProvider>
    <Toaster />
  </React.StrictMode>,
);