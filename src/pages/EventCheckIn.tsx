/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AdminNavBar } from "@/components/admin/admin-navbar";
import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-nav-items";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ScanLine,
  Keyboard,
  CheckCircle2,
  XCircle,
  Camera,
  CameraOff,
  UserCheck,
  Clock,
  Users,
  BarChart3,
} from "lucide-react";

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
          let code = decodedText;
          const match = decodedText.match(/[?&]code=([A-Z0-9]{8})/i);
          if (match) code = match[1].toUpperCase();
          else if (/^[A-Z0-9]{8}$/i.test(decodedText.trim())) code = decodedText.trim().toUpperCase();
          onScanRef.current(code);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err: any) {
      setError(err?.message || "Failed to start camera. Please check permissions.");
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
    if (active) startScanner();
    else stopScanner();
    return () => { stopScanner(); };
  }, [active, startScanner, stopScanner]);

  return (
    <div className="space-y-3">
      <div
        ref={scannerRef}
        className="w-full max-w-sm mx-auto aspect-square overflow-hidden border-4 border-black dark:border-white bg-black flex items-center justify-center shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]"
      >
        {!cameraActive && !error && (
          <div className="text-center text-white p-4">
            <Camera className="h-10 w-10 mx-auto mb-2 opacity-70" />
            <p className="text-sm font-bold uppercase tracking-wide">Initializing Camera...</p>
          </div>
        )}
      </div>
      {error && (
        <div className="border-4 border-red-500 bg-red-100 dark:bg-red-900/30 p-3 text-center">
          <CameraOff className="h-5 w-5 mx-auto mb-1 text-red-600" />
          <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {cameraActive && (
        <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          ▶ Point camera at QR code
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

  const eventId = selectedEventId ? (selectedEventId as Id<"events">) : undefined;
  const stats = useQuery(api.events.getEventAttendanceStats, eventId ? { eventId } : "skip");
  const recentCheckIns = useQuery(api.events.getRecentCheckIns, eventId ? { eventId, limit: 10 } : "skip");

  const handleCheckIn = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed || isProcessing) return;
      const now = Date.now();
      if (trimmed === lastScannedRef.current && now - lastScanTimeRef.current < 3000) return;
      lastScannedRef.current = trimmed;
      lastScanTimeRef.current = now;
      setIsProcessing(true);
      try {
        const result = await markAttendance({ checkInCode: trimmed });
        setLastResult({ success: result.success, message: result.message, userName: result.userName });
        if (result.success) { toast.success(`Checked in: ${result.userName || "Unknown"}`); setManualCode(""); }
        else toast.error(result.message);
      } catch (err: any) {
        toast.error("Check-in failed");
        setLastResult({ success: false, message: err?.message || "Check-in failed" });
      } finally {
        setIsProcessing(false);
      }
    },
    [markAttendance, isProcessing]
  );

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (manualCode.trim()) handleCheckIn(manualCode);
  };

  const activeEvents = events?.filter((ev: { status: string }) => ev.status === "active") || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <AdminNavBar items={ADMIN_NAV_ITEMS} />
        <div className="flex-1 pt-20 pb-12 px-4 md:px-8 max-w-5xl mx-auto w-full">
          
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black dark:text-white">
              EVENT CHECK-IN
            </h1>
            <div className="h-1 w-24 bg-black dark:bg-white mt-2" />
          </motion.div>

          {/* Event Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-muted-foreground">
              Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full md:w-96 border-4 border-black dark:border-white bg-background text-foreground font-mono font-bold text-base px-4 py-3 focus:outline-none shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] cursor-pointer"
            >
              <option value="">— Select an active event —</option>
              {activeEvents.map((event: { _id: string; name: string }) => (
                <option key={event._id} value={event._id}>{event.name}</option>
              ))}
            </select>
          </motion.div>

          {selectedEventId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "REGISTERED", value: stats?.totalRegistered ?? "—", color: "bg-yellow-400", icon: Users },
                  { label: "ATTENDED", value: stats?.totalAttended ?? "—", color: "bg-green-400", icon: UserCheck },
                  {
                    label: "RATE",
                    value: stats && stats.totalRegistered > 0
                      ? `${Math.round((stats.totalAttended / stats.totalRegistered) * 100)}%`
                      : "—",
                    color: "bg-blue-400",
                    icon: BarChart3
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`${stat.color} text-black border-4 border-black dark:border-white p-4 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <stat.icon className="h-8 w-8 mb-2 stroke-[3px]" />
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-3xl font-black">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Check-in + Recent */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Check-in Input */}
                <div className="border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
                  {/* Header */}
                  <div className="border-b-4 border-black dark:border-white p-4 flex items-center justify-between bg-black dark:bg-white">
                    <h2 className="text-lg font-black uppercase tracking-tight text-white dark:text-black flex items-center gap-2">
                      <ScanLine className="h-5 w-5" />
                      CHECK IN
                    </h2>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setMode("manual")}
                        className={`px-3 py-1.5 text-xs font-black uppercase border-2 transition-all ${
                          mode === "manual"
                            ? "bg-yellow-400 text-black border-yellow-400"
                            : "bg-transparent text-white dark:text-black border-white dark:border-black hover:bg-white/20 dark:hover:bg-black/20"
                        }`}
                      >
                        <Keyboard className="h-3.5 w-3.5 inline mr-1" />
                        Manual
                      </button>
                      <button
                        onClick={() => setMode("qr")}
                        className={`px-3 py-1.5 text-xs font-black uppercase border-2 transition-all ${
                          mode === "qr"
                            ? "bg-yellow-400 text-black border-yellow-400"
                            : "bg-transparent text-white dark:text-black border-white dark:border-black hover:bg-white/20 dark:hover:bg-black/20"
                        }`}
                      >
                        <ScanLine className="h-3.5 w-3.5 inline mr-1" />
                        QR
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {mode === "qr" ? (
                      <QRScanner onScan={handleCheckIn} active={mode === "qr"} />
                    ) : (
                      <form onSubmit={handleManualSubmit} className="space-y-3">
                        <input
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                          placeholder="ENTER 8-CHAR CODE"
                          maxLength={8}
                          className="w-full text-center text-2xl font-black tracking-[0.3em] border-4 border-black dark:border-white bg-background text-foreground h-16 px-4 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:tracking-widest"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={manualCode.trim().length !== 8 || isProcessing}
                          className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-black text-lg uppercase tracking-wide border-4 border-black dark:border-white shadow-[4px_4px_0px_#555] dark:shadow-[4px_4px_0px_#aaa] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#555] dark:hover:shadow-[2px_2px_0px_#aaa] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
                        >
                          {isProcessing ? "PROCESSING..." : "CHECK IN »"}
                        </button>
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
                          className={`border-4 p-4 flex items-center gap-3 font-bold ${
                            lastResult.success
                              ? "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {lastResult.success ? (
                            <CheckCircle2 className="h-6 w-6 flex-shrink-0 stroke-[3px]" />
                          ) : (
                            <XCircle className="h-6 w-6 flex-shrink-0 stroke-[3px]" />
                          )}
                          <span className="text-sm uppercase tracking-wide">
                            {lastResult.success ? `✓ CHECKED IN: ${lastResult.userName}` : lastResult.message}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Recent Check-ins */}
                <div className="border-4 border-black dark:border-white bg-card/80 backdrop-blur-sm shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
                  <div className="border-b-4 border-black dark:border-white p-4 bg-black dark:bg-white">
                    <h2 className="text-lg font-black uppercase tracking-tight text-white dark:text-black flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      RECENT CHECK-INS
                    </h2>
                  </div>
                  <div className="p-4">
                    {recentCheckIns && recentCheckIns.length > 0 ? (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {recentCheckIns.map((checkIn: { registrationId: string; name: string; email: string; checkInCode: string; attendedAt: number }, idx: number) => (
                          <motion.div
                            key={checkIn.registrationId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="flex items-center justify-between p-3 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 bg-green-400 border-2 border-black dark:border-white flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-black stroke-[3px]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black uppercase truncate">{checkIn.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{checkIn.email}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="text-[10px] font-black font-mono border-2 border-black dark:border-white px-1.5 py-0.5 bg-yellow-400 text-black">
                                {checkIn.checkInCode}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                                {new Date(checkIn.attendedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-black dark:border-white bg-muted/30 flex items-center justify-center mx-auto mb-3">
                          <UserCheck className="h-8 w-8 opacity-40" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">No check-ins yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!selectedEventId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 border-4 border-black dark:border-white bg-muted/20 flex items-center justify-center mx-auto mb-4 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
                <ScanLine className="h-12 w-12 opacity-40" />
              </div>
              <p className="text-xl font-black uppercase tracking-tight text-muted-foreground">Select an event to begin</p>
              <p className="text-sm font-bold text-muted-foreground/60 mt-1 uppercase tracking-wide">Choose an active event from the dropdown above</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventCheckIn() {
  return <EventCheckInContent />;
}