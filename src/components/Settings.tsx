import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Stack, Text, Separator, Toggle, TooltipHost, TextField, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DefaultButton, MessageBar, MessageBarType, IconButton, Label, Icon } from '@fluentui/react';
import { IStorageService } from '../services/interfaces';
import { ISettingsModel, defaultSettings, IActionModel } from '../models';
import { GlobalPlaceholders, PlaceholderService } from '../services/PlaceholderService';

interface SettingsProps {
  storageService: IStorageService;
  onSettingsChange?: (settings: ISettingsModel) => void;
  onFavoritesImported?: () => void;
  placeholderService?: PlaceholderService;
}

const Settings: React.FC<SettingsProps> = ({ storageService, onSettingsChange, onFavoritesImported, placeholderService }) => {
  const [settings, setSettings] = useState<ISettingsModel>(defaultSettings);
  const [message, setMessage] = useState<{ text: string; type: MessageBarType } | null>(null);
  const [globalPlaceholders, setGlobalPlaceholders] = useState<GlobalPlaceholders>({});
  const [newPlaceholderKey, setNewPlaceholderKey] = useState('');
  const [newPlaceholderValue, setNewPlaceholderValue] = useState('');
  const [newVariantInputs, setNewVariantInputs] = useState<Record<string, string>>({});
  const [isPlaceholdersExpanded, setIsPlaceholdersExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGlobalPlaceholders = useCallback(async () => {
    if (!placeholderService) return;
    const globals = await placeholderService.getGlobalPlaceholders();
    setGlobalPlaceholders(globals);
  }, [placeholderService]);

  useEffect(() => {
    loadGlobalPlaceholders();
  }, [loadGlobalPlaceholders]);

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

  const handleLoadDefaultPredefinedActionsChange = useCallback(async (event: React.MouseEvent<HTMLElement>, checked?: boolean) => {
    const newValue = checked ?? true;
    const updatedSettings = await storageService.updateSettings({ loadDefaultPredefinedActions: newValue });
    setSettings(updatedSettings);
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  }, [storageService, onSettingsChange]);

  const handleDeleteGlobalPlaceholder = useCallback(async (key: string) => {
    if (!placeholderService) return;
    const updated = await placeholderService.deleteGlobalPlaceholder(key);
    setGlobalPlaceholders({ ...updated });
  }, [placeholderService]);

  const handleResetAllGlobalPlaceholders = useCallback(async () => {
    if (!placeholderService) return;
    await placeholderService.clearGlobalPlaceholders();
    setGlobalPlaceholders({});
  }, [placeholderService]);

  const handleRemoveGlobalPlaceholderVariant = useCallback(async (key: string, value: string) => {
    if (!placeholderService) return;
    const updated = await placeholderService.removeGlobalPlaceholderValue(key, value);
    setGlobalPlaceholders({ ...updated });
  }, [placeholderService]);

  const handleUpdateGlobalPlaceholderVariant = useCallback(async (key: string, oldValue: string, newValue: string) => {
    if (!placeholderService) return;
    const updated = await placeholderService.updateGlobalPlaceholderValue(key, oldValue, newValue);
    setGlobalPlaceholders({ ...updated });
  }, [placeholderService]);

  const handleAddGlobalPlaceholder = useCallback(async () => {
    const key = newPlaceholderKey.trim().toUpperCase().replace(/\s+/g, '_');
    const value = newPlaceholderValue.trim();
    if (!key || !value || !placeholderService) return;
    const updated = await placeholderService.addGlobalPlaceholderValue(key, value);
    setGlobalPlaceholders({ ...updated });
    setNewPlaceholderKey('');
    setNewPlaceholderValue('');
  }, [newPlaceholderKey, newPlaceholderValue, placeholderService]);

  const handleAddVariantToKey = useCallback(async (key: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed || !placeholderService) return;
    const updated = await placeholderService.addGlobalPlaceholderValue(key, trimmed);
    setGlobalPlaceholders({ ...updated });
  }, [placeholderService]);

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

      const existingFavorites = await storageService.getFavoriteActions();
      const existingIds = new Set(existingFavorites.map(a => a.id));
      const newActions = importedActions.filter(a => !existingIds.has(a.id));
      await storageService.setFavoriteActions([...existingFavorites, ...newActions]);
      setMessage({ text: `Successfully imported ${newActions.length} new favorite action(s) (${importedActions.length - newActions.length} duplicate(s) skipped)`, type: MessageBarType.success });
      
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

        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1 } }}>
            <Text>Load Default Actions</Text>
            <TooltipHost
              content="Load default predefined actions from the extension's built-in collection."
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
            checked={settings.loadDefaultPredefinedActions ?? true}
            onChange={handleLoadDefaultPredefinedActionsChange}
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

      {placeholderService && (
        <>
          <Separator />
          <Stack tokens={{ childrenGap: 12 }}>
            <Stack
              horizontal
              horizontalAlign="space-between"
              verticalAlign="center"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsPlaceholdersExpanded(prev => !prev)}
            >
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
                <Icon iconName={isPlaceholdersExpanded ? 'ChevronDown' : 'ChevronRight'} style={{ fontSize: 12 }} />
                <Stack tokens={{ childrenGap: 4 }}>
                  <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    Global Placeholder Variables
                  </Text>
                  <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
                    Values automatically used to fill in placeholders (e.g. <code>{'{{SITE_NAME}}'}</code>) across all actions
                  </Text>
                </Stack>
              </Stack>
              {isPlaceholdersExpanded && (
                <DefaultButton
                  text="Reset all"
                  iconProps={{ iconName: 'Delete' }}
                  onClick={(e) => { e.stopPropagation(); handleResetAllGlobalPlaceholders(); }}
                  disabled={Object.keys(globalPlaceholders).length === 0}
                />
              )}
            </Stack>

            {isPlaceholdersExpanded && (
              <>
                {(() => {
                  const knownKeys = placeholderService.getKnownPlaceholderKeys();
                  const allKeys = Array.from(new Set([...knownKeys, ...Object.keys(globalPlaceholders)])).sort();
                  if (allKeys.length === 0) {
                    return (
                      <Text variant="small" styles={{ root: { color: '#605e5c', fontStyle: 'italic' } }}>
                        No global placeholders yet. Add one below.
                      </Text>
                    );
                  }
                  return allKeys.map((key) => {
                    const isBuiltIn = placeholderService.hasKnownPlaceholderOptions(key);
                    const builtInOptions = isBuiltIn ? placeholderService.getPlaceholderOptions(key, {}) : [];
                    const userVariants = globalPlaceholders[key] ?? [];
                    const builtInValues = new Set(builtInOptions.map(o => o.value));
                    const editableVariants = userVariants.filter(v => !builtInValues.has(v));

                    return (
                      <Stack key={key} tokens={{ childrenGap: 6 }} style={{ paddingBottom: 8, borderBottom: '1px solid #edebe9' }}>
                        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
                            <Label style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>{`{{${key}}}`}</Label>
                            {isBuiltIn && (
                              <Text variant="small" style={{ color: '#605e5c', fontStyle: 'italic' }}>(built-in)</Text>
                            )}
                          </Stack>
                          {!isBuiltIn && (
                            <IconButton
                              iconProps={{ iconName: 'Delete' }}
                              title={`Remove {{${key}}} and all its variants`}
                              ariaLabel={`Remove ${key}`}
                              onClick={() => handleDeleteGlobalPlaceholder(key)}
                              styles={{ root: { height: 24, width: 24 } }}
                            />
                          )}
                        </Stack>

                        {builtInOptions.map((option) => (
                          <TooltipHost key={option.value} content={option.tooltip}>
                            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                              <Text
                                variant="small"
                                style={{
                                  fontWeight: 600,
                                  color: '#292a73',
                                  backgroundColor: '#eef1fb',
                                  border: '1px solid #c7d1f2',
                                  borderRadius: 4,
                                  padding: '2px 8px',
                                  whiteSpace: 'nowrap',
                                  minWidth: 100,
                                  textAlign: 'center',
                                }}
                              >
                                {option.label}
                              </Text>
                              <TextField
                                value={option.value}
                                readOnly
                                styles={{ root: { flex: 1 }, field: { backgroundColor: '#f3f2f1', color: '#605e5c' } }}
                              />
                            </Stack>
                          </TooltipHost>
                        ))}

                        {editableVariants.map((variant) => (
                          <Stack key={variant} horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                            <TextField
                              value={variant}
                              onChange={(_e, val) => handleUpdateGlobalPlaceholderVariant(key, variant, val ?? '')}
                              styles={{ root: { flex: 1 } }}
                            />
                            <IconButton
                              iconProps={{ iconName: 'Cancel' }}
                              ariaLabel={`Remove variant ${variant} from ${key}`}
                              onClick={() => handleRemoveGlobalPlaceholderVariant(key, variant)}
                              styles={{ root: { height: 28, width: 28 } }}
                            />
                          </Stack>
                        ))}

                        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                          <TextField
                            placeholder="Add another variant..."
                            value={newVariantInputs[key] ?? ''}
                            onChange={(_e, val) => setNewVariantInputs(prev => ({ ...prev, [key]: val ?? '' }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleAddVariantToKey(key, newVariantInputs[key] ?? '');
                                setNewVariantInputs(prev => ({ ...prev, [key]: '' }));
                              }
                            }}
                            styles={{ root: { flex: 1 } }}
                          />
                          <DefaultButton
                            text="Add variant"
                            iconProps={{ iconName: 'Add' }}
                            onClick={() => {
                              handleAddVariantToKey(key, newVariantInputs[key] ?? '');
                              setNewVariantInputs(prev => ({ ...prev, [key]: '' }));
                            }}
                            disabled={!(newVariantInputs[key] ?? '').trim()}
                          />
                        </Stack>
                      </Stack>
                    );
                  });
                })()}

                <Stack tokens={{ childrenGap: 4 }}>
                  <Text variant="small" style={{ fontWeight: 600 }}>Add new placeholder</Text>
                  <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
                    <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
                      <Text variant="small">Key</Text>
                      <TextField
                        placeholder="SITE_NAME"
                        value={newPlaceholderKey}
                        onChange={(_e, val) => setNewPlaceholderKey(val ?? '')}
                      />
                    </Stack>
                    <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
                      <Text variant="small">Value</Text>
                      <TextField
                        placeholder="AcceleratorComm"
                        value={newPlaceholderValue}
                        onChange={(_e, val) => setNewPlaceholderValue(val ?? '')}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddGlobalPlaceholder(); }}
                      />
                    </Stack>
                    <DefaultButton
                      text="Add"
                      iconProps={{ iconName: 'Add' }}
                      onClick={handleAddGlobalPlaceholder}
                      disabled={!newPlaceholderKey.trim() || !newPlaceholderValue.trim()}
                    />
                  </Stack>
                  <Text variant="small" styles={{ root: { color: '#605e5c', fontStyle: 'italic' } }}>
                    Tip: using a key that already exists adds another variant to it instead of replacing it.
                  </Text>
                </Stack>
              </>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default Settings;
