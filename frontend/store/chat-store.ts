import { create } from "zustand";
import { ChatMessage, DbConfig, ModelConfig } from "@/types/chat";

interface ChatState {
  dbConfig: DbConfig;
  modelConfig: ModelConfig;
  sessionId: string;
  showTrace: boolean;
  allowWrite: boolean;
  connected: boolean;
  connecting: boolean;
  connectionError: string;
  messages: ChatMessage[];
  setDbConfig: (payload: Partial<DbConfig>) => void;
  setModelConfig: (payload: Partial<ModelConfig>) => void;
  setShowTrace: (value: boolean) => void;
  setAllowWrite: (value: boolean) => void;
  setSession: (sessionId: string, connected: boolean) => void;
  setConnecting: (value: boolean) => void;
  setConnectionError: (message: string) => void;
  addMessage: (message: ChatMessage) => void;
  patchMessage: (id: string, payload: Partial<ChatMessage>) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  dbConfig: {
    dbType: "sqlite",
    host: "",
    user: "",
    password: "",
    database: "",
    port: 3306,
  },
  modelConfig: {
    apiKey: "",
    model: "llama-3.3-70b-versatile",
    provider: "groq",
  },
  sessionId: "",
  connected: false,
  connecting: false,
  connectionError: "",
  showTrace: false,
  allowWrite: false,
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "Connect your database from the sidebar, then ask a question in natural language.",
    },
  ],
  setDbConfig: (payload) => set((state) => ({ dbConfig: { ...state.dbConfig, ...payload } })),
  setModelConfig: (payload) => set((state) => ({ modelConfig: { ...state.modelConfig, ...payload } })),
  setShowTrace: (value) => set({ showTrace: value }),
  setAllowWrite: (value) => set({ allowWrite: value }),
  setSession: (sessionId, connected) => set({ sessionId, connected }),
  setConnecting: (value) => set({ connecting: value }),
  setConnectionError: (message) => set({ connectionError: message }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  patchMessage: (id, payload) =>
    set((state) => ({
      messages: state.messages.map((message) => (message.id === id ? { ...message, ...payload } : message)),
    })),
  clearChat: () =>
    set({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Chat history cleared. Ask a fresh question.",
        },
      ],
    }),
}));
