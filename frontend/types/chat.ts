export type DbType = "sqlite" | "mysql";
export type Provider = "groq" | "openai";

export interface DbConfig {
  dbType: DbType;
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  sqliteFile?: File;
}

export interface ModelConfig {
  apiKey: string;
  model: string;
  provider: Provider;
}

export interface StructuredResponse {
  summary: string;
  key_points: string[];
  cautions: string[];
  suggested_followups: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sqlQuery?: string;
  tableData?: Record<string, unknown>[];
  trace?: string[];
  structured?: StructuredResponse;
  isStreaming?: boolean;
}

export interface ConnectDbResponse {
  session_id: string;
  db_type: DbType;
  message: string;
}

export interface ChatResponse {
  response: string;
  sql_query: string;
  data: Record<string, unknown>[];
  trace: string[];
  structured?: StructuredResponse;
}
