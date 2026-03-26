import { Database, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/store/chat-store";
import { useConnectDb } from "@/hooks/use-chat";

export function Sidebar() {
  const {
    dbConfig,
    modelConfig,
    setDbConfig,
    setModelConfig,
    setShowTrace,
    setAllowWrite,
    showTrace,
    allowWrite,
    clearChat,
    connecting,
    connected,
    connectionError,
  } = useChatStore();
  const connectMutation = useConnectDb();

  return (
    <aside className="h-full w-[340px] overflow-y-auto border-r border-border/70 bg-card/70 p-5 backdrop-blur-md">
      <div className="mb-5 rounded-xl border border-border/70 bg-secondary/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <Database className="h-5 w-5 text-blue-300" />
          Database Config
        </div>
        <p className="text-xs text-muted-foreground">Connect SQLite or MySQL, then chat naturally with your data.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>DB Type</Label>
          <Select value={dbConfig.dbType} onValueChange={(value) => setDbConfig({ dbType: value as "sqlite" | "mysql" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sqlite">SQLite</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dbConfig.dbType === "sqlite" ? (
          <div className="space-y-2">
            <Label>SQLite File (.db)</Label>
            <Input type="file" accept=".db" onChange={(event) => setDbConfig({ sqliteFile: event.target.files?.[0] })} />
          </div>
        ) : (
          <>
            <Input
              placeholder="Host (e.g. 127.0.0.1 or 127.0.0.1:3306)"
              value={dbConfig.host}
              onChange={(event) => setDbConfig({ host: event.target.value })}
            />
            <Input placeholder="User" value={dbConfig.user} onChange={(event) => setDbConfig({ user: event.target.value })} />
            <Input placeholder="Password" type="password" value={dbConfig.password} onChange={(event) => setDbConfig({ password: event.target.value })} />
            <Input placeholder="Database" value={dbConfig.database} onChange={(event) => setDbConfig({ database: event.target.value })} />
            <Input
              placeholder="Port"
              value={String(dbConfig.port)}
              onChange={(event) => setDbConfig({ port: Number(event.target.value) || 3306 })}
            />
          </>
        )}

        <Separator className="my-1" />

        <div className="rounded-md border border-border/70 bg-secondary/25 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">LLM Settings</p>
          <p className="mt-1">Your API key is used only for backend LLM calls.</p>
        </div>

        <Input
          placeholder="API Key"
          type="password"
          value={modelConfig.apiKey}
          onChange={(event) => setModelConfig({ apiKey: event.target.value })}
        />

        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={modelConfig.provider} onValueChange={(value) => setModelConfig({ provider: value as "groq" | "openai" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input placeholder="Model" value={modelConfig.model} onChange={(event) => setModelConfig({ model: event.target.value })} />

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label>Show SQL Agent Trace</Label>
          <Switch checked={showTrace} onCheckedChange={setShowTrace} />
        </div>

        <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center justify-between">
            <Label>Enable Write Queries</Label>
            <Switch checked={allowWrite} onCheckedChange={setAllowWrite} />
          </div>
          <p className="text-xs text-amber-200/90">Allows INSERT/UPDATE/DELETE from chat. Keep OFF unless you want data changes.</p>
        </div>

        <Button className="w-full gap-2" onClick={() => connectMutation.mutate()} disabled={connecting || !modelConfig.apiKey}>
          {connecting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : connected ? (
            "Reconnect"
          ) : (
            "Connect"
          )}
        </Button>

        <div className={`rounded-md border px-3 py-2 text-xs ${connected ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border/70 bg-secondary/30 text-muted-foreground"}`}>
          {connected ? "Connected and ready for chat." : "Not connected. Configure DB and click Connect."}
        </div>

        {connectionError && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{connectionError}</div>
        )}

        <Button variant="secondary" className="w-full" onClick={clearChat}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Chat
        </Button>
      </div>
    </aside>
  );
}
