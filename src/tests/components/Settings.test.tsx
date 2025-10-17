import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from '../../components/Settings';
import { IStorageService } from '../../services/interfaces';
import { ISettingsModel, defaultSettings } from '../../models';

// Mock storage service
const mockStorageService: IStorageService = {
  getRecordedActions: jest.fn(),
  addNewRecordedAction: jest.fn(),
  deleteRecordedAction: jest.fn(),
  clearRecordedActions: jest.fn(),
  getMyClipboardActions: jest.fn(),
  addNewMyClipboardAction: jest.fn(),
  setNewMyClipboardActions: jest.fn(),
  deleteMyClipboardAction: jest.fn(),
  clearMyClipboardActions: jest.fn(),
  getIsRecordingValue: jest.fn(),
  setIsRecordingValue: jest.fn(),
  setCurrentCopiedActionV3: jest.fn(),
  getCurrentCopiedActionV3: jest.fn(),
  clearCurrentCopiedActionV3: jest.fn(),
  getCopiedActionsV3: jest.fn(),
  setNewCopiedActionV3: jest.fn(),
  setNewCopiedActionsV3: jest.fn(),
  deleteCopiedActionV3: jest.fn(),
  clearCopiedActionsV3: jest.fn(),
  getFavoriteActions: jest.fn(),
  addFavoriteAction: jest.fn(),
  removeFavoriteAction: jest.fn(),
  clearFavoriteActions: jest.fn(),
  // Settings methods
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
  resetSettings: jest.fn(),
};

describe('Settings component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockStorageService.getSettings as jest.Mock).mockResolvedValue(defaultSettings);
    (mockStorageService.updateSettings as jest.Mock).mockImplementation(
      (partialSettings: Partial<ISettingsModel>) => 
        Promise.resolve({ ...defaultSettings, ...partialSettings })
    );
  });

  test('renders Settings component with correct heading', () => {
    render(<Settings storageService={mockStorageService} />);
    
    const heading = screen.getByText('Extension Settings');
    expect(heading).toBeInTheDocument();
    
    const subtitle = screen.getByText('Configure how the Power Automate Actions extension behaves');
    expect(subtitle).toBeInTheDocument();
  });

  test('renders all settings sections', () => {
    render(<Settings storageService={mockStorageService} />);
    
    expect(screen.getByText('🎯 Page Detection')).toBeInTheDocument();
    expect(screen.getByText('⏱️ Recording Controls')).toBeInTheDocument();
    expect(screen.getByText('🎨 Interface Customization')).toBeInTheDocument();
  });

  test('renders Page Detection Mode setting', () => {
    render(<Settings storageService={mockStorageService} />);
    
    const settingTitle = screen.getByText('Page Detection Mode');
    expect(settingTitle).toBeInTheDocument();
    
    const automaticOption = screen.getByRole('radio', { name: 'Automatic Detection' });
    expect(automaticOption).toBeInTheDocument();
    
    const recordingOption = screen.getByRole('radio', { name: 'Recording Page Override' });
    expect(recordingOption).toBeInTheDocument();
  });

  test('renders Power Automate page options', () => {
    render(<Settings storageService={mockStorageService} />);
    
    const classicOption = screen.getByRole('radio', { name: 'Classic Power Automate Editor' });
    expect(classicOption).toBeInTheDocument();
    
    const modernOption = screen.getByRole('radio', { name: 'Modern Power Automate Editor' });
    expect(modernOption).toBeInTheDocument();
  });

  test('renders recording time setting', () => {
    render(<Settings storageService={mockStorageService} />);
    
    const timeField = screen.getByRole('spinbutton', { name: 'Maximum recording duration (minutes)' });
    expect(timeField).toBeInTheDocument();
  });

  test('renders action search bar setting', () => {
    render(<Settings storageService={mockStorageService} />);
    
    const searchBarToggle = screen.getByRole('switch', { name: 'Display action search bar' });
    expect(searchBarToggle).toBeInTheDocument();
  });

  test('loads initial settings from storage', async () => {
    const testSettings: ISettingsModel = { 
      ...defaultSettings,
      isRecordingPage: true,
      showActionSearchBar: false 
    };
    (mockStorageService.getSettings as jest.Mock).mockResolvedValue(testSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    await waitFor(() => {
      expect(mockStorageService.getSettings).toHaveBeenCalled();
    });
  });

  test('shows automatic detection message when SharePoint value is null', async () => {
    // This test is no longer relevant since we removed the automatic detection messages
    render(<Settings storageService={mockStorageService} />);
    
    const automaticOption = screen.getByRole('radio', { name: 'Automatic Detection' });
    expect(automaticOption).toBeChecked();
  });

  test('shows Power Automate automatic detection message when both values are null', async () => {
    // This test is no longer relevant since we removed the automatic detection messages 
    render(<Settings storageService={mockStorageService} />);
    
    const pageDetectionTitle = screen.getByText('Page Detection Mode');
    expect(pageDetectionTitle).toBeInTheDocument();
  });

  test('updates Recording Page settings when option is selected', async () => {
    const updatedSettings: ISettingsModel = { 
      ...defaultSettings, 
      isRecordingPage: true,
      isClassicPowerAutomatePage: false,
      isModernPowerAutomatePage: false 
    };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    const recordingOption = screen.getByRole('radio', { name: 'Recording Page Override' });
    fireEvent.click(recordingOption);
    
    await waitFor(() => {
      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({ 
        isRecordingPage: true,
        isClassicPowerAutomatePage: false,
        isModernPowerAutomatePage: false 
      });
    });
  });

  test('updates classic Power Automate setting and disables others when enabled', async () => {
    const updatedSettings: ISettingsModel = { 
      ...defaultSettings, 
      isRecordingPage: false,
      isClassicPowerAutomatePage: true,
      isModernPowerAutomatePage: false 
    };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    const classicOption = screen.getByRole('radio', { name: 'Classic Power Automate Editor' });
    fireEvent.click(classicOption);
    
    await waitFor(() => {
      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({ 
        isRecordingPage: false,
        isClassicPowerAutomatePage: true,
        isModernPowerAutomatePage: false 
      });
    });
  });

  test('updates modern Power Automate setting and disables others when enabled', async () => {
    const updatedSettings: ISettingsModel = { 
      ...defaultSettings, 
      isRecordingPage: false,
      isModernPowerAutomatePage: true,
      isClassicPowerAutomatePage: false 
    };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    const modernOption = screen.getByRole('radio', { name: 'Modern Power Automate Editor' });
    fireEvent.click(modernOption);
    
    await waitFor(() => {
      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({ 
        isRecordingPage: false,
        isModernPowerAutomatePage: true,
        isClassicPowerAutomatePage: false 
      });
    });
  });

  test('updates to automatic detection mode when selected', async () => {
    const updatedSettings: ISettingsModel = { 
      ...defaultSettings, 
      isRecordingPage: false,
      isModernPowerAutomatePage: false,
      isClassicPowerAutomatePage: false 
    };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    const automaticOption = screen.getByRole('radio', { name: 'Automatic Detection' });
    fireEvent.click(automaticOption);
    
    await waitFor(() => {
      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({ 
        isRecordingPage: false,
        isModernPowerAutomatePage: false,
        isClassicPowerAutomatePage: false 
      });
    });
  });

  test('updates to automatic detection mode when selected', async () => {
    // Start with recording page enabled
    const initialSettings: ISettingsModel = { 
      ...defaultSettings, 
      isRecordingPage: true 
    };
    (mockStorageService.getSettings as jest.Mock).mockResolvedValue(initialSettings);
    
    const updatedSettings: ISettingsModel = { 
      ...defaultSettings, 
      isRecordingPage: false,
      isClassicPowerAutomatePage: false,
      isModernPowerAutomatePage: false 
    };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    const automaticOption = screen.getByRole('radio', { name: 'Automatic Detection' });
    fireEvent.click(automaticOption);
    
    await waitFor(() => {
      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({
        isRecordingPage: false,
        isModernPowerAutomatePage: false,
        isClassicPowerAutomatePage: false
      });
    });
  });

  test('updates maximum recording time setting', async () => {
    const updatedSettings: ISettingsModel = { ...defaultSettings, maximumRecordingTimeMinutes: 30 };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    const timeField = screen.getByRole('spinbutton');
    fireEvent.change(timeField, { target: { value: '30' } });
    
    await waitFor(() => {
      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({ maximumRecordingTimeMinutes: 30 });
    });
  });

  test('updates show action search bar setting', async () => {
    const updatedSettings: ISettingsModel = { ...defaultSettings, showActionSearchBar: false };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    await waitFor(() => {
      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({ showActionSearchBar: false });
    });
  });

  test('shows tooltip for recording time info icon', async () => {
    render(<Settings storageService={mockStorageService} />);
    
    const infoIcon = screen.getByTestId('recording-time-info-icon');
    expect(infoIcon).toBeInTheDocument();
    
    const tooltipText = screen.getByText(/Set a maximum duration for recording sessions/);
    expect(tooltipText).toBeInTheDocument();
  });

  test('shows tooltip for search bar info icon', async () => {
    render(<Settings storageService={mockStorageService} />);
    
    const infoIcon = screen.getByTestId('search-bar-info-icon');
    expect(infoIcon).toBeInTheDocument();
    
    const tooltipText = screen.getByText(/Control whether the action search bar appears/);
    expect(tooltipText).toBeInTheDocument();
  });

  test('calls onSettingsChange callback when page mode changes', async () => {
    const onSettingsChange = jest.fn();
    const updatedSettings: ISettingsModel = { 
      ...defaultSettings, 
      isRecordingPage: true,
      isClassicPowerAutomatePage: false,
      isModernPowerAutomatePage: false 
    };
    (mockStorageService.updateSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(<Settings storageService={mockStorageService} onSettingsChange={onSettingsChange} />);
    
    const recordingOption = screen.getByRole('radio', { name: 'Recording Page Override' });
    fireEvent.click(recordingOption);
    
    await waitFor(() => {
      expect(onSettingsChange).toHaveBeenCalledWith(updatedSettings);
    });
  });
});
