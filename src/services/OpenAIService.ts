import { IOpenAIService, IOpenAIResponse, IOpenAIMessage, IOpenAIOptions } from './interfaces/IOpenAIService';

export class OpenAIService implements IOpenAIService {
  private readonly apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  private readonly defaultModel = 'gpt-3.5-turbo';

  async generatePowerAutomateAction(description: string, apiKey: string): Promise<IOpenAIResponse> {
    const messages: IOpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a Power Automate HTTP action specialist. Generate complete HTTP action details in JSON format for SharePoint REST API or Microsoft Graph API.
Return ONLY valid JSON without any markdown formatting or explanations. The JSON should follow this structure:
{
  "title": "Descriptive action title",
  "method": "GET/POST/PATCH/DELETE",
  "url": "https://...",
  "headers": {
    "Accept": "application/json;odata=verbose",
    "Content-Type": "application/json;odata=verbose"
  },
  "body": {
    // request body if needed for POST/PATCH
  }
}

For SharePoint REST API, use endpoints like: https://site.sharepoint.com/_api/web/lists/...
For Microsoft Graph API, use endpoints like: https://graph.microsoft.com/v1.0/...
Include all necessary headers (for Graph: Authorization with Bearer token) and body structure with proper OData format.
The title should be a clear description of what the action does.`
      },
      {
        role: 'user',
        content: `Generate HTTP action details for: ${description}`
      }
    ];

    return this.sendMessages(messages, apiKey, {
      responseFormat: 'json_object',
      temperature: 0.7,
      maxTokens: 2000
    });
  }

  async sendMessages(messages: IOpenAIMessage[], apiKey: string, options?: IOpenAIOptions): Promise<IOpenAIResponse> {
    if (!apiKey || apiKey.trim() === '') {
      return {
        success: false,
        error: 'OpenAI API key is required'
      };
    }

    if (!messages || messages.length === 0) {
      return {
        success: false,
        error: 'At least one message is required'
      };
    }

    try {
      const requestBody: any = {
        model: this.defaultModel,
        messages: messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000
      };

      if (options?.responseFormat === 'json_object') {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        return {
          success: false,
          error: errorMessage
        };
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message?.content || '';
        
        let jsonData = undefined;
        if (options?.responseFormat === 'json_object') {
          try {
            jsonData = JSON.parse(content);
          } catch (e) {
            return {
              success: false,
              error: 'Failed to parse JSON response from OpenAI'
            };
          }
        }
        
        return {
          success: true,
          content: content,
          jsonData: jsonData
        };
      }

      return {
        success: false,
        error: 'No response received from OpenAI'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
