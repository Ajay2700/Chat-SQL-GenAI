import { Sidebar } from "@/components/layout/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";

export function ChatPage() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-background px-3 py-3 text-foreground lg:px-4 lg:py-4">
      <div className="mx-auto flex h-full max-w-[1600px] overflow-hidden rounded-2xl border border-border/80 bg-slate-950/75 shadow-[0_20px_60px_-30px_rgba(30,64,175,0.55)] backdrop-blur-xl">
        <Sidebar />
        <main className="h-full flex-1 overflow-hidden">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
}
