import React, { useState, useCallback } from 'react';
import { Stack, TextField, PrimaryButton, MessageBar, MessageBarType, Spinner, SpinnerSize, Text, DefaultButton } from '@fluentui/react';
import { IOpenAIService } from '../services/interfaces/IOpenAIService';
import { IStorageService } from '../services/interfaces';
import { ActionsService } from '../services';
import { IActionModel } from '../models/IActionModel';

interface OpenAIPromptProps {
  openAIService: IOpenAIService;
  storageService: IStorageService;
  onFavoritesUpdated?: () => Promise<void>;
}

const OpenAIPrompt: React.FC<OpenAIPromptProps> = ({ openAIService, storageService, onFavoritesUpdated }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [jsonData, setJsonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePromptChange = useCallback((event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setPrompt(newValue || '');
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const settings = await storageService.getSettings();

      if (!settings.enableOpenAiIntegration) {
        setError('OpenAI integration is not enabled. Please enable it in Settings.');
        setIsLoading(false);
        return;
      }

      if (!settings.openAiApiKey) {
        setError('OpenAI API key is not configured. Please add it in Settings.');
        setIsLoading(false);
        return;
      }

      const result = await openAIService.generatePowerAutomateAction(prompt, settings.openAiApiKey);

      if (result.success && result.content) {
        setResponse(result.content);
        if (result.jsonData) {
          setJsonData(result.jsonData);
        }
      } else {
        setError(result.error || 'Failed to get response from OpenAI');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, openAIService, storageService]);

  const addToFavorites = useCallback(async () => {
    if (!jsonData || !response) return;

    try {
      const aiData = jsonData;
      const actionsService = new ActionsService();
      const computedTitle = aiData.title || actionsService.getTitleFromUrl(aiData.url || '');
      const titleWithAiTag = `${computedTitle} (AI)`;
      const template = actionsService.getActionTemplateForDetails(
        aiData.method || 'GET',
        aiData.url || '',
        aiData.headers || {},
        titleWithAiTag,
        aiData.body || undefined
      );

      const action: IActionModel = {
        id: `ai-generated-${Date.now()}`,
        title: titleWithAiTag,
        url: aiData.url || '',
        method: aiData.method || 'GET',
        icon: template.icon,
        actionJson: template.actionJson,
        body: aiData.body,
        isFavorite: true
      };

      const currentFavorites = await storageService.getFavoriteActions();
      await storageService.setFavoriteActions([...currentFavorites, action]);

      if (onFavoritesUpdated) {
        await onFavoritesUpdated();
      }

      setError(null);
      setSuccessMessage('Added to favorites!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      setError('Failed to add to favorites');
    }
  }, [jsonData, response, storageService, onFavoritesUpdated]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
          Generate HTTP Action
        </Text>
        <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
          AI generates HTTP details for SharePoint REST or MS Graph
        </Text>
      </Stack>

      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => setError(null)}
          dismissButtonAriaLabel="Close"
        >
          {error}
        </MessageBar>
      )}

      {successMessage && (
        <MessageBar
          messageBarType={MessageBarType.success}
          isMultiline={false}
          onDismiss={() => setSuccessMessage(null)}
          dismissButtonAriaLabel="Close"
        >
          {successMessage}
        </MessageBar>
      )}

      <TextField
        label="Description"
        multiline
        rows={3}
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyPress}
        placeholder="e.g., 'Get SharePoint list items where Status=Active' or 'Get user profile from Graph'"
        disabled={isLoading}
      />

      <Stack horizontal tokens={{ childrenGap: 12 }}>
        <PrimaryButton
          text={isLoading ? 'Processing...' : 'Generate'}
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          iconProps={isLoading ? undefined : { iconName: 'Send' }}
        />
        {response && !isLoading && jsonData && (
          <DefaultButton
            text="Add to Favorites"
            onClick={addToFavorites}
            iconProps={{ iconName: 'FavoriteStar' }}
          />
        )}
      </Stack>

      {isLoading && (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 8 }}>
          <Spinner size={SpinnerSize.medium} label="Waiting for OpenAI response..." />
        </Stack>
      )}

      {response && !isLoading && (
        <Stack tokens={{ childrenGap: 6 }}>
          <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
            Result:
          </Text>
          {jsonData && (
            <MessageBar messageBarType={MessageBarType.success} isMultiline={false}>
              Ready to add to favorites
            </MessageBar>
          )}
          <TextField
            multiline
            rows={10}
            value={response}
            readOnly
            styles={{
              field: {
                backgroundColor: '#f3f2f1',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 12
              }
            }}
          />
        </Stack>
      )}
    </Stack>
  );
};

export default OpenAIPrompt;
