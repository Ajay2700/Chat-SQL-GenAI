import axios from "axios";
import { ChatResponse, ConnectDbResponse, DbConfig, ModelConfig } from "@/types/chat";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
});

export async function connectDb(config: DbConfig): Promise<ConnectDbResponse> {
  const formData = new FormData();
  formData.append("db_type", config.dbType);

  if (config.dbType === "sqlite") {
    if (!config.sqliteFile) {
      throw new Error("Please upload a SQLite file.");
    }
    formData.append("sqlite_file", config.sqliteFile);
  } else {
    formData.append("host", config.host);
    formData.append("user", config.user);
    formData.append("password", config.password);
    formData.append("database", config.database);
    formData.append("port", String(config.port));
  }

  let data: ConnectDbResponse;
  try {
    const response = await http.post<ConnectDbResponse>("/connect-db", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    data = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      throw new Error(detail || error.message || "Failed to connect database.");
    }
    throw error;
  }

  if ((data as unknown as { error?: string }).error) {
    throw new Error((data as unknown as { error: string }).error);
  }

  return data;
}

export async function chat(
  sessionId: string,
  query: string,
  modelConfig: ModelConfig,
  showTrace: boolean,
  allowWrite: boolean
): Promise<ChatResponse> {
  try {
    const { data } = await http.post<ChatResponse>("/chat", {
      session_id: sessionId,
      query,
      provider: modelConfig.provider,
      api_key: modelConfig.apiKey,
      model: modelConfig.model,
      show_trace: showTrace,
      allow_write: allowWrite,
    });

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      throw new Error(detail || error.message || "Chat request failed.");
    }
    throw error;
  }
}

interface StreamHandlers {
  onToken: (token: string) => void;
  onMeta: (meta: { sql_query: string; row_count: number }) => void;
  onDone: (payload: { sql_query: string; data: Record<string, unknown>[] }) => void;
  onError: (message: string) => void;
}

export async function chatStream(
  sessionId: string,
  query: string,
  modelConfig: ModelConfig,
  allowWrite: boolean,
  handlers: StreamHandlers
) {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      query,
      provider: modelConfig.provider,
      api_key: modelConfig.apiKey,
      model: modelConfig.model,
      show_trace: false,
      allow_write: allowWrite,
    }),
  });

  if (!response.ok || !response.body) {
    let message = "Unable to start stream.";
    try {
      const body = await response.json();
      message = body?.detail || body?.message || message;
    } catch {
      message = `${message} (HTTP ${response.status})`;
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const eventBlock of events) {
      const eventLine = eventBlock.split("\n").find((line) => line.startsWith("event:"));
      const dataLine = eventBlock.split("\n").find((line) => line.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const eventName = eventLine.replace("event:", "").trim();
      const rawData = dataLine.replace("data:", "").trim();

      if (eventName === "token") {
        const payload = JSON.parse(rawData) as { token: string };
        handlers.onToken(payload.token);
      }
      if (eventName === "meta") {
        const payload = JSON.parse(rawData) as { sql_query: string; row_count: number };
        handlers.onMeta(payload);
      }
      if (eventName === "done") {
        const payload = JSON.parse(rawData) as { sql_query: string; data: Record<string, unknown>[] };
        handlers.onDone(payload);
      }
      if (eventName === "error") {
        const payload = JSON.parse(rawData) as { message: string };
        handlers.onError(payload.message);
      }
    }
  }
}
