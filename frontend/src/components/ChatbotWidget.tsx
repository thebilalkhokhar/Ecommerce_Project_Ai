"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import api from "@/lib/axios";

type ChatRole = "user" | "bot";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

function generateThreadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [threadId] = useState(generateThreadId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isLoading) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, isLoading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const { data } = await api.post<{ response: string }>("/bot/chat", {
        message: text,
        thread_id: threadId,
      });
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data.response ?? "" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "I'm having trouble reaching the assistant right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[45] bg-textMain/20 backdrop-blur-[2px] transition-colors"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {isOpen ? (
            <div
              className="flex max-h-[min(28rem,calc(100vh-8rem))] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-3xl border border-primary/15 bg-surface shadow-xl shadow-textMain/10 sm:w-96"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <header className="relative shrink-0 overflow-hidden border-b border-primary/10 bg-gradient-to-br from-primary/8 via-surface to-secondary/10 px-4 py-3.5">
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary/15 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2
                        id={titleId}
                        className="text-sm font-semibold tracking-tight text-textMain"
                      >
                        Store assistant
                      </h2>
                      <p className="text-xs text-textMain/60">
                        We typically reply in seconds
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="shrink-0 rounded-xl p-2 text-textMain/65 transition-all hover:bg-primary/10 hover:text-textMain active:scale-95"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </header>

              <div
                ref={scrollRef}
                className="scrollbar-hide min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/40 px-3 py-3"
              >
                {messages.length === 0 && !isLoading ? (
                  <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-3 py-4 text-center">
                    <p className="text-xs font-medium text-textMain">
                      Hi there
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-textMain/65">
                      Ask about products, stock, shipping, or anything in our
                      catalog. Press{" "}
                      <kbd className="rounded border border-primary/20 bg-surface px-1 py-px font-mono text-[10px] text-textMain/80">
                        Esc
                      </kbd>{" "}
                      or click outside to close.
                    </p>
                  </div>
                ) : null}
                {messages.map((m, i) => (
                  <div
                    key={`${i}-${m.role}-${m.content.slice(0, 12)}`}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm font-medium text-white shadow-sm"
                          : "max-w-[88%] rounded-2xl rounded-bl-md border border-primary/10 bg-surface px-3.5 py-2.5 text-sm text-textMain shadow-sm"
                      }
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-primary/10 bg-surface px-3.5 py-2.5 text-sm text-textMain/65 shadow-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex gap-1" aria-hidden>
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.2s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.1s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" />
                        </span>
                        <span>Thinking…</span>
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 border-t border-primary/10 bg-surface p-3">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message…"
                    disabled={isLoading}
                    className="min-w-0 flex-1 rounded-2xl border border-primary/15 bg-background px-3.5 py-2.5 text-sm text-textMain shadow-sm transition-all placeholder:text-textMain/40 focus:border-primary/30 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                    aria-label="Message your store assistant"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="shrink-0 rounded-2xl bg-primary p-2.5 text-white shadow-md transition-all hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 hover:opacity-95 active:scale-95"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-label={isOpen ? "Close assistant" : "Open store assistant chat"}
          >
            <span className="absolute right-1.5 top-1.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-secondary" />
            </span>
            <Bot className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </>
  );
}
