import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AdminNavBar } from "@/components/admin/admin-navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Calendar,
  Ticket,
  MessageSquare,
  Users,
  Settings,
  ScanLine,
  Keyboard,
  CheckCircle2,
  XCircle,
  Camera,
  CameraOff,
  UserCheck,
  Clock,
  BarChart3,
} from "lucide-react";

const ADMIN_NAV_ITEMS = [
  { name: "Dashboard", url: "/admin-dashboard", icon: Home },
  { name: "Events", url: "/admin-events", icon: Calendar },
  { name: "Check-In", url: "/admin-checkin", icon: ScanLine },
  { name: "Tickets", url: "/admin-tickets", icon: Ticket },
  { name: "Communication", url: "/admin-communication", icon: MessageSquare },
  { name: "Team", url: "/admin-team", icon: Users },
  { name: "Settings", url: "/admin-settings", icon: Settings },
];

function QRScanner({
  onScan,
  active,
}: {
  onScan: (code: string) => void;
  active: boolean;
}) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;
    setError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = "qr-reader-" + Date.now();
      scannerRef.current.id = scannerId;

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          // Extract check-in code from URL or use raw text
          let code = decodedText;
          const match = decodedText.match(/[?&]code=([A-Z0-9]{8})/i);
          if (match) {
            code = match[1].toUpperCase();
          } else if (/^[A-Z0-9]{8}$/i.test(decodedText.trim())) {
            code = decodedText.trim().toUpperCase();
          }
          onScanRef.current(code);
        },
        () => {
          // QR code not found in frame - ignore
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error("QR Scanner error:", err);
      setError(
        err?.message || "Failed to start camera. Please check permissions."
      );
      setCameraActive(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [active, startScanner, stopScanner]);

  return (
    <div className="space-y-3">
      <div
        ref={scannerRef}
        className="w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden bg-muted/30 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
      >
        {!cameraActive && !error && (
          <div className="text-center text-muted-foreground p-4">
            <Camera className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Camera initializing...</p>
          </div>
        )}
      </div>
      {error && (
        <div className="text-center text-destructive text-sm bg-destructive/10 rounded-lg p-3">
          <CameraOff className="h-5 w-5 mx-auto mb-1" />
          {error}
        </div>
      )}
      {cameraActive && (
        <p className="text-center text-xs text-muted-foreground">
          Point camera at a QR code to scan
        </p>
      )}
    </div>
  );
}

function EventCheckInContent() {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [mode, setMode] = useState<"qr" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
  } | null>(null);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const events = useQuery(api.events.list);
  const markAttendance = useMutation(api.events.markAttendance);

  const eventId = selectedEventId
    ? (selectedEventId as Id<"events">)
    : undefined;

  const stats = useQuery(
    api.events.getEventAttendanceStats,
    eventId ? { eventId } : "skip"
  );
  const recentCheckIns = useQuery(
    api.events.getRecentCheckIns,
    eventId ? { eventId, limit: 10 } : "skip"
  );

  const handleCheckIn = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed || isProcessing) return;

      // Debounce duplicate scans
      const now = Date.now();
      if (
        trimmed === lastScannedRef.current &&
        now - lastScanTimeRef.current < 3000
      ) {
        return;
      }
      lastScannedRef.current = trimmed;
      lastScanTimeRef.current = now;

      setIsProcessing(true);
      try {
        const result = await markAttendance({ checkInCode: trimmed });
        setLastResult({
          success: result.success,
          message: result.message,
          userName: result.userName,
        });
        if (result.success) {
          toast.success(`Checked in: ${result.userName || "Unknown"}`);
          setManualCode("");
        } else {
          toast.error(result.message);
        }
      } catch (err: any) {
        toast.error("Check-in failed");
        setLastResult({
          success: false,
          message: err?.message || "Check-in failed",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [markAttendance, isProcessing]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCheckIn(manualCode);
    }
  };

  const activeEvents = events?.filter((e) => e.status === "active") || [];

  return (
    <div className="min-h-screen bg-[#FDF8F3] dark:bg-neutral-950 flex flex-col">
      <AdminNavBar items={ADMIN_NAV_ITEMS} />
      <div className="flex-1 pt-20 pb-12 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6"
        >
          Event Check-In
        </motion.h1>

        {/* Event Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full md:w-96 border-2 border-foreground/20 bg-background text-base font-semibold">
              <SelectValue placeholder="Select an event..." />
            </SelectTrigger>
            <SelectContent>
              {activeEvents.map((event) => (
                <SelectItem key={event._id} value={event._id}>
                  {event.name}
                </SelectItem>
              ))}
              {activeEvents.length === 0 && (
                <SelectItem value="__none" disabled>
                  No active events
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </motion.div>

        {selectedEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-2 border-foreground/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">
                      Registered
                    </p>
                    <p className="text-2xl font-black">
                      {stats?.totalRegistered ?? "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-foreground/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">
                      Attended
                    </p>
                    <p className="text-2xl font-black">
                      {stats?.totalAttended ?? "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-foreground/10 col-span-2 md:col-span-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">
                      Rate
                    </p>
                    <p className="text-2xl font-black">
                      {stats && stats.totalRegistered > 0
                        ? `${Math.round((stats.totalAttended / stats.totalRegistered) * 100)}%`
                        : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mode Toggle + Scanner/Manual */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Check-in Input */}
              <Card className="border-2 border-foreground/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold uppercase">
                      Check In
                    </CardTitle>
                    <div className="flex ml-auto gap-1">
                      <Button
                        variant={mode === "manual" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMode("manual")}
                        className="text-xs gap-1"
                      >
                        <Keyboard className="h-3.5 w-3.5" />
                        Manual
                      </Button>
                      <Button
                        variant={mode === "qr" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMode("qr")}
                        className="text-xs gap-1"
                      >
                        <ScanLine className="h-3.5 w-3.5" />
                        QR
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === "qr" ? (
                    <QRScanner onScan={handleCheckIn} active={mode === "qr"} />
                  ) : (
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                      <Input
                        value={manualCode}
                        onChange={(e) =>
                          setManualCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter 8-character code"
                        maxLength={8}
                        className="text-center text-lg font-mono tracking-widest border-2 border-foreground/20 h-12"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        className="w-full font-bold uppercase"
                        disabled={
                          manualCode.trim().length !== 8 || isProcessing
                        }
                      >
                        {isProcessing ? "Processing..." : "Check In"}
                      </Button>
                    </form>
                  )}

                  {/* Last Result */}
                  <AnimatePresence mode="wait">
                    {lastResult && (
                      <motion.div
                        key={lastResult.message}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                          lastResult.success
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {lastResult.success ? (
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <span>
                          {lastResult.success
                            ? `Checked in: ${lastResult.userName}`
                            : lastResult.message}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Recent Check-ins */}
              <Card className="border-2 border-foreground/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold uppercase flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Check-Ins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentCheckIns && recentCheckIns.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {recentCheckIns.map((checkIn, idx) => (
                        <motion.div
                          key={checkIn.registrationId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-foreground/5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {checkIn.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {checkIn.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono"
                            >
                              {checkIn.checkInCode}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(checkIn.attendedAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No check-ins yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {!selectedEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground"
          >
            <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">Select an event to begin</p>
            <p className="text-sm mt-1">
              Choose an active event from the dropdown above
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function EventCheckIn() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <EventCheckInContent />
    </ThemeProvider>
  );
}
