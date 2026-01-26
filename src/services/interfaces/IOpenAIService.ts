export interface IOpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IOpenAIResponse {
  success: boolean;
  content?: string;
  error?: string;
  jsonData?: any;
}

export interface IOpenAIOptions {
  responseFormat?: 'text' | 'json_object';
  temperature?: number;
  maxTokens?: number;
}

export interface IOpenAIService {
  generatePowerAutomateAction(description: string, apiKey: string): Promise<IOpenAIResponse>;
}
