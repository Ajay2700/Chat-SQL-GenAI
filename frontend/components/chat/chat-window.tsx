import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useSendMessage } from "@/hooks/use-chat";

export function ChatWindow() {
  const [query, setQuery] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const { messages, connected, showTrace } = useChatStore();

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = query.trim();
    if (!text) return;
    setQuery("");
    await sendMessage(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col p-6 lg:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">LangChain: Chat with SQL DB</h1>
          <p className="mt-1 text-sm text-muted-foreground">Natural language analytics with structured SQL execution.</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-medium ${connected ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border/80 bg-secondary/30 text-muted-foreground"}`}>
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div ref={chatScrollRef} className="flex-1 min-h-0 space-y-4 overflow-y-auto rounded-2xl border border-border/70 bg-card/35 p-4 shadow-inner shadow-slate-950/30 lg:p-5">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} showTrace={showTrace} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-card/45 p-2 backdrop-blur-sm">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSend();
            }
          }}
          placeholder={connected ? "Ask anything from the database" : "Connect database first..."}
          disabled={!connected}
          className="border-0 bg-transparent focus-visible:ring-0"
        />
        <Button onClick={() => void handleSend()} disabled={!connected || !query.trim()} className="h-10 min-w-10 rounded-lg px-3">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
