"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
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

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

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
    <div className="pointer-events-none fixed bottom-6 right-6 z-50">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {isOpen && (
          <div
            className="flex h-120 w-80 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 sm:w-96"
            role="dialog"
            aria-label="Store assistant chat"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-50">
                Store Assistant
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-50"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {messages.length === 0 && !isLoading && (
                <p className="px-1 text-center text-xs leading-relaxed text-zinc-500">
                  Ask about products, stock, or anything in our catalog.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={`${i}-${m.role}`}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-50"
                        : "max-w-[85%] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                    }
                  >
                    <p className="whitespace-pre-wrap wrap-break-word">{m.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-500">
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">Thinking</span>
                      <span className="tabular-nums">…</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-zinc-800 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message…"
                  disabled={isLoading}
                  className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-0 disabled:opacity-50"
                  aria-label="Message"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 rounded-md border border-zinc-700 p-2 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-xl transition-transform duration-300 hover:scale-110 hover:shadow-zinc-500/20"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close assistant" : "Open assistant"}
        >
          <span className="absolute right-0 top-0 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-zinc-100 bg-zinc-300" />
          </span>
          <Bot
            className="h-6 w-6 group-hover:animate-pulse"
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
