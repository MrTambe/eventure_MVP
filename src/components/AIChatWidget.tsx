import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I check in at an event?",
  "Where do I get my certificate?",
  "How do I register for an event?",
];

export function AIChatWidget() {
  const ask = useAction(api.ai.askEventure);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setError(null);
    setInput("");
    const history = messages.slice(-6);
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    try {
      const result = await ask({ question, history });
      if (result?.success && result.answer) {
        setMessages((m) => [...m, { role: "assistant", content: result.answer! }]);
      } else {
        setError(result?.error || "AI is unavailable right now. Please try again later.");
      }
    } catch (e) {
      console.error("AskEventure failed:", e);
      setError("AI is unavailable right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button - bottom right corner */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-[300] h-14 w-14 rounded-full bg-[#6D28D9] text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex items-center justify-center cursor-pointer"
        title="Ask Eventure AI"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "bot"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-[300] w-[calc(100vw-2.5rem)] max-w-sm border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] flex flex-col"
            style={{ height: "min(560px, calc(100vh - 8rem))" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#6D28D9] text-white border-b-2 border-black dark:border-white">
              <Sparkles className="h-4 w-4" />
              <span className="font-black uppercase tracking-wide text-sm">Ask Eventure AI</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Hi! Ask me anything about Eventure — events, check-in, certificates, and more.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs font-bold border-2 border-black dark:border-white bg-[#FDF8F3] dark:bg-neutral-800 px-3 py-2 hover:bg-[#6D28D9] hover:text-white transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed border-2 ${
                    m.role === "user"
                      ? "ml-auto bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "bg-[#FDF8F3] dark:bg-neutral-800 text-black dark:text-white border-black dark:border-white"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#6D28D9] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#6D28D9] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#6D28D9] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                  Thinking...
                </div>
              )}
              {error && (
                <div className="text-xs font-bold text-red-600 dark:text-red-400 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t-2 border-black dark:border-white p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 min-w-0 border-2 border-black dark:border-white bg-[#FDF8F3] dark:bg-neutral-800 px-3 py-2 text-sm text-black dark:text-white outline-none focus:shadow-[3px_3px_0px_#6D28D9] transition-shadow placeholder:text-neutral-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-9 w-9 flex-shrink-0 bg-[#6D28D9] text-white border-2 border-black dark:border-white flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
