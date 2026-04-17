import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Lock, X, CheckCircle, Loader2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  eventName: string;
  amount: number;
  isTeam?: boolean;
  teamName?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  eventName,
  amount,
  isTeam,
  teamName,
}: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [step, setStep] = useState<"form" | "processing" | "success" | "error">("form");

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handlePay = async () => {
    if (!cardNumber || !expiry || !cvv || !cardName) return;
    setStep("processing");

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));

    // 95% success rate mock
    const success = Math.random() < 0.95;
    if (success) {
      try {
        await onSuccess();
        setStep("success");
      } catch {
        setStep("error");
      }
    } else {
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("form");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardName("");
    onClose();
  };

  const isFormValid = cardNumber.replace(/\s/g, "").length >= 12 && expiry.length >= 4 && cvv.length >= 3 && cardName.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget && step === "form") handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-black uppercase tracking-wider">Secure Payment</span>
              </div>
              {step === "form" && (
                <button onClick={handleClose} className="hover:opacity-70 transition-opacity">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="p-6">
              {step === "form" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Order Summary */}
                  <div className="border-2 border-black dark:border-white bg-[#f5f0e8] dark:bg-neutral-800 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Order Summary</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black uppercase text-black dark:text-white">{eventName}</p>
                        {isTeam && teamName && (
                          <p className="text-xs text-muted-foreground mt-0.5">Team: {teamName}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isTeam ? "Team Registration Fee" : "Registration Fee"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-black dark:text-white">₹{amount}</p>
                        <p className="text-[10px] text-muted-foreground">incl. GST</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 text-black dark:text-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 text-black dark:text-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white pr-10"
                        />
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 text-black dark:text-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 text-black dark:text-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    onClick={handlePay}
                    disabled={!isFormValid}
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-wider text-sm py-3.5 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#000]"
                  >
                    Pay ₹{amount}
                  </button>

                  <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    This is a mock payment. No real charges will be made.
                  </p>
                </motion.div>
              )}

              {step === "processing" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-black dark:text-white" />
                  <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                    Processing Payment...
                  </p>
                  <p className="text-xs text-muted-foreground">Please do not close this window</p>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-lg font-black uppercase tracking-tight text-black dark:text-white">
                    Payment Successful!
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    You've been registered for <strong>{eventName}</strong>
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-sm px-8 py-2.5 border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all"
                  >
                    Done
                  </button>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 border-2 border-red-500 flex items-center justify-center">
                    <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-lg font-black uppercase tracking-tight text-black dark:text-white">
                    Payment Failed
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Something went wrong. Please try again.
                  </p>
                  <button
                    onClick={() => setStep("form")}
                    className="mt-2 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-sm px-8 py-2.5 border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] transition-all"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
