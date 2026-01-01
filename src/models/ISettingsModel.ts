export interface ISettingsModel {
  isRecordingPage?: boolean | null;
  isClassicPowerAutomatePage?: boolean | null;
  isModernPowerAutomatePage?: boolean | null;
  maximumRecordingTimeMinutes?: number | null;
  showActionSearchBar?: boolean;
  recordingStartTime?: number | null;
  showPredefinedActions?: boolean;
  predefinedActionsUrl?: string;
}

export const defaultSettings: ISettingsModel = {
  isRecordingPage: null,
  isClassicPowerAutomatePage: null,
  isModernPowerAutomatePage: null,
  maximumRecordingTimeMinutes: null,
  showActionSearchBar: true,
  recordingStartTime: null,
  showPredefinedActions: true,
  predefinedActionsUrl: '',
};
