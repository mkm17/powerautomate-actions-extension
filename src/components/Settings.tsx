import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Stack, Text, Separator, Toggle, TooltipHost, TextField, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DefaultButton, MessageBar, MessageBarType } from '@fluentui/react';
import { IStorageService } from '../services/interfaces';
import { ISettingsModel, defaultSettings, IActionModel } from '../models';

interface SettingsProps {
  storageService: IStorageService;
  onSettingsChange?: (settings: ISettingsModel) => void;
  onFavoritesImported?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ storageService, onSettingsChange, onFavoritesImported }) => {
  const [settings, setSettings] = useState<ISettingsModel>(defaultSettings);
  const [message, setMessage] = useState<{ text: string; type: MessageBarType } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storageService.getSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
    });
  }, [storageService]);

  const handlePageModeChange = useCallback(async (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption) => {
    if (!option) return;
    
    const updates: Partial<ISettingsModel> = {
      isRecordingPage: option.key === 'recording' ? true : false,
      isClassicPowerAutomatePage: option.key === 'classic' ? true : false,
      isModernPowerAutomatePage: option.key === 'modern' ? true : false,
    };
    
    if (option.key === 'none') {
      updates.isRecordingPage = false;
      updates.isClassicPowerAutomatePage = false;
      updates.isModernPowerAutomatePage = false;
    }
    
    const updatedSettings = await storageService.updateSettings(updates);
    setSettings(updatedSettings);
    
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  }, [storageService, onSettingsChange]);

  const handleMaximumRecordingTimeChange = useCallback(async (value: string | undefined) => {
    const numValue = value ? parseInt(value, 10) : null;
    const newValue = (!isNaN(numValue!) && numValue! > 0) ? numValue : null;
    const updatedSettings = await storageService.updateSettings({ maximumRecordingTimeMinutes: newValue });
    setSettings(updatedSettings);
  }, [storageService]);

  const getCurrentPageMode = useCallback((): string => {
    if (settings.isRecordingPage === true) return 'recording';
    if (settings.isClassicPowerAutomatePage === true) return 'classic';
    if (settings.isModernPowerAutomatePage === true) return 'modern';
    return 'none';
  }, [settings]);

  const handleShowActionSearchBarChange = useCallback(async (event: React.MouseEvent<HTMLElement>, checked?: boolean) => {
    const newValue = checked ?? true;
    const updatedSettings = await storageService.updateSettings({ showActionSearchBar: newValue });
    setSettings(updatedSettings);
  }, [storageService]);

  const handleShowPredefinedActionsChange = useCallback(async (event: React.MouseEvent<HTMLElement>, checked?: boolean) => {
    const newValue = checked ?? true;
    const updatedSettings = await storageService.updateSettings({ showPredefinedActions: newValue });
    setSettings(updatedSettings);
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  }, [storageService, onSettingsChange]);

  const handlePredefinedActionsUrlChange = useCallback(async (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const url = newValue || '';
    const updatedSettings = await storageService.updateSettings({ predefinedActionsUrl: url });
    setSettings(updatedSettings);
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  }, [storageService, onSettingsChange]);

  const handleExport = useCallback(async () => {
    try {
      const favorites = await storageService.getFavoriteActions();
      
      if (!favorites || favorites.length === 0) {
        setMessage({ text: 'No favorite actions to export', type: MessageBarType.warning });
        return;
      }

      const dataStr = JSON.stringify(favorites, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `power-automate-favorites-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ text: `Successfully exported ${favorites.length} favorite action(s)`, type: MessageBarType.success });
    } catch (error) {
      setMessage({ text: 'Failed to export favorites', type: MessageBarType.error });
      console.error('Export error:', error);
    }
  }, [storageService]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setMessage({ text: 'Please select a valid JSON file', type: MessageBarType.error });
      return;
    }

    try {
      const fileContent = await file.text();
      const importedActions: IActionModel[] = JSON.parse(fileContent);

      if (!Array.isArray(importedActions)) {
        setMessage({ text: 'Invalid file format: Expected an array of actions', type: MessageBarType.error });
        return;
      }

      // Validate that each item has the required IActionModel properties
      const isValid = importedActions.every(action => 
        action.id && action.title && action.actionJson
      );

      if (!isValid) {
        setMessage({ text: 'Invalid file format: Missing required action properties', type: MessageBarType.error });
        return;
      }

      await storageService.setFavoriteActions(importedActions);
      setMessage({ text: `Successfully imported ${importedActions.length} favorite action(s)`, type: MessageBarType.success });
      
      // Trigger favorites list refresh
      if (onFavoritesImported) {
        onFavoritesImported();
      }
    } catch (error) {
      setMessage({ text: 'Failed to import favorites: Invalid JSON format', type: MessageBarType.error });
      console.error('Import error:', error);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [storageService, onFavoritesImported]);

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
      <Stack tokens={{ childrenGap: 8 }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
          Extension Settings
        </Text>
        <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
          Configure how the Power Automate Actions extension behaves
        </Text>
      </Stack>

      {message && (
        <MessageBar
          messageBarType={message.type}
          isMultiline={false}
          onDismiss={() => setMessage(null)}
          dismissButtonAriaLabel="Close"
        >
          {message.text}
        </MessageBar>
      )}

      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
          Favorite Actions Management
        </Text>
        <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
          Import or export your favorite actions as a JSON file
        </Text>
        
        <Stack horizontal tokens={{ childrenGap: 12 }}>
          <PrimaryButton
            text="Import Favorites"
            onClick={handleImport}
            iconProps={{ iconName: 'Download' }}
          />
          <DefaultButton
            text="Export Favorites"
            onClick={handleExport}
            iconProps={{ iconName: 'Upload' }}
          />
        </Stack>
      </Stack>
      <Separator />
      
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
          Page Detection Mode
        </Text>
        
        <ChoiceGroup
          selectedKey={getCurrentPageMode()}
          onChange={handlePageModeChange}
          options={[
            {
              key: 'none',
              text: 'Automatic Detection'
            },
            {
              key: 'recording',
              text: 'Recording Page Override'
            },
            {
              key: 'classic',
              text: 'Classic Power Automate Editor'
            },
            {
              key: 'modern',
              text: 'Modern Power Automate Editor'
            }
          ]}
          styles={{
            root: { marginLeft: '16px' },
            label: { fontWeight: 'normal' }
          }}
        />
      </Stack>

      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1 } }}>
          <Text>Maximum Recording Time (minutes)</Text>
          <TooltipHost
            content="Set a maximum duration for recording sessions. Leave empty for unlimited recording."
            styles={{ root: { display: 'inline-block' } }}
          >
            <span
              data-testid="recording-time-info-icon"
              style={{
                fontSize: 14,
                color: '#0078d4',
                cursor: 'help'
              }}
            >
              ℹ️
            </span>
          </TooltipHost>
        </Stack>
        <TextField
          value={settings.maximumRecordingTimeMinutes?.toString() || ''}
          onChange={(event, newValue) => handleMaximumRecordingTimeChange(newValue)}
          placeholder="No limit"
          type="number"
          min={1}
          styles={{ root: { width: 100 } }}
        />
      </Stack>

      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1 } }}>
          <Text>Show Action Search Bar</Text>
          <TooltipHost
            content="Control whether the action search bar appears in the main interface."
            styles={{ root: { display: 'inline-block' } }}
          >
            <span
              data-testid="search-bar-info-icon"
              style={{
                fontSize: 14,
                color: '#0078d4',
                cursor: 'help'
              }}
            >
              ℹ️
            </span>
          </TooltipHost>
        </Stack>
        <Toggle
          checked={settings.showActionSearchBar ?? true}
          onChange={handleShowActionSearchBarChange}
        />
      </Stack>

      <Separator />

      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
          Predefined Actions
        </Text>
        <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
          Load template actions from a GitHub JSON file for easy reuse
        </Text>

        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1 } }}>
            <Text>Show Predefined Actions</Text>
            <TooltipHost
              content="Display a section with predefined action templates loaded from GitHub."
              styles={{ root: { display: 'inline-block' } }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: '#0078d4',
                  cursor: 'help'
                }}
              >
                ℹ️
              </span>
            </TooltipHost>
          </Stack>
          <Toggle
            checked={settings.showPredefinedActions ?? true}
            onChange={handleShowPredefinedActionsChange}
          />
        </Stack>

        <Stack tokens={{ childrenGap: 8 }}>
          <Text variant="small">GitHub JSON URL</Text>
          <TextField
            value={settings.predefinedActionsUrl || ''}
            onChange={handlePredefinedActionsUrlChange}
            placeholder="https://gist.githubusercontent.com/username/gist-id/raw/predefined-actions.json"
            description="Enter the raw URL to your GitHub Gist or repository JSON file"
            multiline={false}
          />
          <Text variant="small" styles={{ root: { color: '#605e5c', fontStyle: 'italic' } }}>
            Tip: Use GitHub Gist for easy editing. Actions are cached for 1 hour.
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Settings;
