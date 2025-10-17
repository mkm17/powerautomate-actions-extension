import React, { useCallback, useEffect, useState } from 'react';
import { Stack, Text, Separator, Toggle, TooltipHost, TextField, ChoiceGroup, IChoiceGroupOption } from '@fluentui/react';
import { IStorageService } from '../services/interfaces';
import { ISettingsModel, defaultSettings } from '../models';

interface SettingsProps {
  storageService: IStorageService;
  onSettingsChange?: (settings: ISettingsModel) => void;
}

const Settings: React.FC<SettingsProps> = ({ storageService, onSettingsChange }) => {
  const [settings, setSettings] = useState<ISettingsModel>(defaultSettings);

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

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <Stack tokens={{ childrenGap: 8 }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
          Extension Settings
        </Text>
        <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
          Configure how the Power Automate Actions extension behaves
        </Text>
      </Stack>      <Separator />
      
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
    </Stack>
  );
};

export default Settings;
