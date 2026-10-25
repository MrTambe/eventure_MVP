import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

// Must match the code the backend system prompt tells Gemini to emit for
// unrelated questions (see src/convex/ai.ts askEventure).
const OFF_TOPIC_CODE = "EVENTURE_OFF_TOPIC";

// Canned apologies shown (at random) when the AI flags a question as off-topic.
// Swapping a code for one of these saves API tokens vs composing an apology.
const OFF_TOPIC_APOLOGIES = [
  "Oops, that's outside my event-planning powers! Ask me about Eventure instead. 🙈",
  "Sorry, I only speak Eventure! Try asking about events, check-in or certificates. 😅",
  "That one's a bit off the map for me — I'm the Eventure helper, after all! 🗺️",
  "I wish I could help, but that's not in my event handbook! 📔",
  "Whoops! My brain is 100% Eventure. Ask me about registering for events! 🎪",
  "Sorry, that's beyond my campus-event radar! 📡",
  "I'm just a humble event assistant — that question went over my head! 🎈",
  "Hmm, that's not really my department. Events, tickets, check-in? I've got you! ✅",
  "Sorry, I can't help with that one — but I CAN talk about Eventure all day! 🤓",
  "That's off my stage! I only perform on the Eventure stage. 🎭",
  "Oof, that question broke my event-detecting sensors! 🤖",
  "Sorry, no dice on that one. Ask me how to check in at an event though! 🎟️",
  "I'm all out of answers for that — but never out of Eventure tips! 💡",
  "That's outside my job description, sorry! Event stuff is my jam though. 🍇",
  "Sorry, I don't know about that — but your next event? I know EVERYTHING. 📅",
  "I'd love to help, but that's not on the Eventure menu! 🍽️",
  "Sorry! My expertise begins and ends with awesome campus events. 🎉",
  "That one's not in my toolbox — but I have plenty of event tools! 🧰",
  "Apologies, I'm strictly Eventure-brained. Try me on events, tickets or teams! 🧠",
  "Can't help there, sorry! Ask me about certificates instead? 🏅",
  "Sorry, that's a no from me — but a big YES for Eventure questions! 👍",
  "I'm blushing, but I really can't answer that. Events though? Always! 😳",
  "Sorry, that question isn't on today's schedule! Check the Eventure agenda instead. ⏰",
  "Oops, wrong doorway! I only open doors to Eventure answers. 🚪",
  "That's beyond my badge level, sorry! 🎫",
  "I'd fail that quiz — but ask me anything about Eventure and I'll ace it! 🎓",
  "Sorry, I can't chat about that. My chat topics are 100% events! 💬",
  "Not my circus, not my... wait, actually I DO love a good event! But no, I can't help with that. 🎪",
  "Sorry, I'm booked solid with Eventure knowledge only! 📚",
  "That's outside the venue, sorry! Come back inside for event help. 🏟️",
  "I have no clue about that, but I know check-in codes inside out! 🔑",
  "Sorry, that's not my event! Try asking about registering or certificates. 📝",
  "Beep boop — topic not found! Eventure questions always compute though. 🤖",
  "Sorry, can't shine a light on that one. Event questions are my spotlight! 🔦",
  "I'm tapping out on that one — but never on Eventure questions! 🥊",
  "Sorry, my answer drawer is empty for that topic. Full of event tips though! 🗄️",
  "That's a bit too universal for me — I specialize in campus events! 🌍",
  "Sorry, I don't do that kind of magic. Event magic? Absolutely. ✨",
  "I'd better not guess! But event how-tos? I never guess, I know. 🎯",
  "Sorry, that's not in the Eventure playbook! 🏈",
  "That's off the guest list, sorry! Event questions are always VIP here. 🎫",
  "I'm only wise in the ways of Eventure! Ask away about events. 🦉",
  "Sorry, that one sails past my harbor — I'm anchored to event help! ⚓",
  "No can do on that, sorry! But certificates, tickets, check-in? Right this way. ➡️",
  "Sorry! If it's about Eventure or events, I'm your bot. Otherwise, I'm stumped! 🤷",
];

// Stable per-browser id so guests (not logged in) still get their own 1/min
// AI rate limit. Logged-in users are limited by their auth identity instead.
function getClientId(): string {
  try {
    let id = localStorage.getItem("eventure_client_id");
    if (!id) {
      id = `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem("eventure_client_id", id);
    }
    return id;
  } catch {
    return "c_unknown";
  }
}

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
      const result = await ask({ question, clientId: getClientId(), history });
      if (result?.success && result.answer) {
        const answer = (result.answer || "").trim();
        if (answer === OFF_TOPIC_CODE) {
          // Swap the token-saving code for a random canned apology.
          const apology = OFF_TOPIC_APOLOGIES[Math.floor(Math.random() * OFF_TOPIC_APOLOGIES.length)];
          setMessages((m) => [...m, { role: "assistant", content: apology }]);
        } else {
          setMessages((m) => [...m, { role: "assistant", content: result.answer! }]);
        }
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
