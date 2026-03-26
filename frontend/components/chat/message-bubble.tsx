import { motion } from "framer-motion";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChatMessage } from "@/types/chat";
import { ResultsTable } from "@/components/chat/results-table";

export function MessageBubble({ message, showTrace }: { message: ChatMessage; showTrace: boolean }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={isUser ? "ml-auto max-w-2xl" : "mr-auto max-w-4xl"}
    >
      <Card className={isUser ? "border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10" : "border-border/80 bg-card/80"}>
        <CardHeader className="pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{isUser ? "User" : "Assistant"}</CardHeader>
        <CardContent className="space-y-3">
          {message.structured ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-200/85">Summary</p>
                <p className="leading-6">{message.structured.summary}</p>
              </div>

              {message.structured.key_points?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-200/85">Key Points</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {message.structured.key_points.map((item, index) => (
                      <li key={`${message.id}-kp-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {message.structured.cautions?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-200/90">Cautions</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {message.structured.cautions.map((item, index) => (
                      <li key={`${message.id}-caution-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {message.structured.suggested_followups?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Suggested Follow-ups</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {message.structured.suggested_followups.map((item, index) => (
                      <li key={`${message.id}-next-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6">{message.content || (message.isStreaming ? "Thinking..." : "")}</p>
          )}

          {!!message.sqlQuery && (
            <div className="rounded-lg border border-border/80 bg-secondary/25 p-3 text-xs">
              <p className="mb-2 font-semibold uppercase tracking-wide text-sky-200/90">SQL Query</p>
              <code className="whitespace-pre-wrap leading-5 text-slate-100">{message.sqlQuery}</code>
            </div>
          )}

          {message.tableData && message.tableData.length > 0 && <ResultsTable data={message.tableData} />}

          {showTrace && message.trace && message.trace.length > 0 && (
            <div className="rounded-lg border border-border/80 bg-secondary/25 p-3 text-xs">
              <p className="mb-1 font-semibold uppercase tracking-wide text-violet-200/90">Trace</p>
              <ul className="list-disc space-y-1 pl-4">
                {message.trace.map((item, index) => (
                  <li key={`${message.id}-trace-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
