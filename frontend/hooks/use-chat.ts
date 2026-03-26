import { useMutation } from "@tanstack/react-query";

import { chat, chatStream, connectDb } from "@/services/api";
import { uid } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";

export function useConnectDb() {
  const { dbConfig, setSession, setConnecting, setConnectionError } = useChatStore();

  return useMutation({
    mutationFn: async () => {
      setConnecting(true);
      setConnectionError("");
      return connectDb(dbConfig);
    },
    onSuccess: (data) => {
      setSession(data.session_id, true);
      setConnecting(false);
      setConnectionError("");
    },
    onError: (error) => {
      setSession("", false);
      setConnecting(false);

      let message = "Connection failed.";
      if (error instanceof Error) {
        message = error.message;
      }
      setConnectionError(message);
    },
  });
}

export function useSendMessage() {
  const { sessionId, modelConfig, showTrace, allowWrite, addMessage, patchMessage } = useChatStore();

  return async (query: string) => {
    const userId = uid();
    const assistantId = uid();

    addMessage({ id: userId, role: "user", content: query });
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    });

    if (!sessionId) {
      patchMessage(assistantId, {
        content: "Please connect a database first.",
        isStreaming: false,
      });
      return;
    }

    try {
      if (showTrace) {
        const response = await chat(sessionId, query, modelConfig, true, allowWrite);
        patchMessage(assistantId, {
          content: response.response,
          sqlQuery: response.sql_query,
          tableData: response.data,
          trace: response.trace,
          structured: response.structured,
          isStreaming: false,
        });
        return;
      }

      await chatStream(sessionId, query, modelConfig, allowWrite, {
        onToken: (token) => {
          const current = useChatStore.getState().messages.find((message) => message.id === assistantId)?.content ?? "";
          patchMessage(assistantId, { content: `${current}${token}` });
        },
        onMeta: (meta) => {
          patchMessage(assistantId, { sqlQuery: meta.sql_query });
        },
        onDone: (payload) => {
          patchMessage(assistantId, {
            sqlQuery: payload.sql_query,
            tableData: payload.data,
            isStreaming: false,
          });
        },
        onError: (message) => {
          patchMessage(assistantId, {
            content: `Error: ${message}`,
            isStreaming: false,
          });
        },
      });
    } catch (error) {
      patchMessage(assistantId, {
        content: error instanceof Error ? error.message : "Unexpected error",
        isStreaming: false,
      });
    }
  };
}
