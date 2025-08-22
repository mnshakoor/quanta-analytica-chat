
export enum ChatRole {
  User = 'user',
  Model = 'model',
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
}

export interface MessagePart {
  text?: string;
  fileData?: FileData;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: ChatRole;
  parts: MessagePart[];
  timestamp: number;
  sources?: GroundingSource[];
  isError?: boolean;
}
