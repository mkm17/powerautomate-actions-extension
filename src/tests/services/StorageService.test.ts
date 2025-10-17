import { StorageService } from "./../../services";
import { IActionModel, defaultSettings } from "../../models";

const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
};

(global as any).chrome = mockChrome;

describe("StorageService", () => {
  let storageService: StorageService;

  const mockAction: IActionModel = {
    id: "test-action-1",
    url: "https://example.com",
    icon: "icon-url",
    title: "Test Action",
    actionJson: '{"type": "test"}',
    method: "POST",
    isSelected: false,
    body: { test: "data" }
  };

  const mockAction2: IActionModel = {
    id: "test-action-2",
    url: "https://example2.com",
    icon: "icon-url-2",
    title: "Test Action 2",
    actionJson: '{"type": "test2"}',
    method: "GET",
    isSelected: true,
    body: { test2: "data2" }
  };

  beforeEach(() => {
    storageService = new StorageService();
    jest.clearAllMocks();
  });

  describe("Recorded Actions", () => {
    describe("getRecordedActions", () => {
      test("should return empty array when no actions stored", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: undefined });
        });

        const result = await storageService.getRecordedActions();
        expect(result).toBeUndefined();
      });

      test("should return stored actions", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [mockAction] });
        });
        
        const result = await storageService.getRecordedActions();
        expect(result).toEqual([mockAction]);
      });
    });

    describe("addNewRecordedAction", () => {
      test("should add action to empty list", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.addNewRecordedAction(mockAction);
        
        expect(result).toEqual([mockAction]);
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'recordedActions': [mockAction] });
      });

      test("should add action to existing list", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [mockAction] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.addNewRecordedAction(mockAction2);
        
        expect(result).toEqual([mockAction, mockAction2]);
      });
    });

    describe("deleteRecordedAction", () => {
      test("should delete action from list", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [mockAction, mockAction2] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.deleteRecordedAction(mockAction);
        
        expect(result).toEqual([mockAction2]);
      });
    });

    describe("clearRecordedActions", () => {
      test("should clear actions in local storage", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        await storageService.clearRecordedActions();

        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'recordedActions': [] });
      });
    });
  });

  describe("My Clipboard Actions", () => {
    describe("getMyClipboardActions", () => {
      test("should return stored clipboard actions", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [mockAction] });
        });
        
        const result = await storageService.getMyClipboardActions();
        expect(result).toEqual([mockAction]);
      });
    });

    describe("addNewMyClipboardAction", () => {
      test("should add action to clipboard", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.addNewMyClipboardAction(mockAction);
        
        expect(result).toEqual([mockAction]);
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'myClipboardActions': [mockAction] });
      });
    });

    describe("setNewMyClipboardActions", () => {
      test("should set multiple actions to clipboard", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        const newActions = [mockAction, mockAction2];
        
        const result = await storageService.setNewMyClipboardActions(newActions);
        
        expect(result).toEqual(newActions);
      });
    });

    describe("deleteMyClipboardAction", () => {
      test("should delete action from clipboard", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [mockAction, mockAction2] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.deleteMyClipboardAction(mockAction);
        
        expect(result).toEqual([mockAction2]);
      });
    });

    describe("clearMyClipboardActions", () => {
      test("should clear clipboard actions in local storage", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        await storageService.clearMyClipboardActions();

        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'myClipboardActions': [] });
      });
    });
  });

  describe("Recording State", () => {
    describe("getIsRecordingValue", () => {
      test("should return recording state", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: true });
        });
        
        const result = await storageService.getIsRecordingValue();
        
        expect(result).toBe(true);
      });
    });

    describe("setIsRecordingValue", () => {
      test("should set the value of isRecording in local storage", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        const isRecording = true;

        const result = await storageService.setIsRecordingValue(isRecording);

        expect(result).toBe(true);
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'isRecordingActions': isRecording });
      });
    });
  });

  describe("Current Copied Action V3", () => {
    describe("setCurrentCopiedActionV3", () => {
      test("should set current copied action successfully", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.setCurrentCopiedActionV3(mockAction);
        
        expect(result).toBe(true);
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 
          'currentCopiedActionV3': JSON.stringify(mockAction) 
        });
      });

      test("should handle storage errors gracefully", async () => {
        mockChrome.storage.local.set.mockImplementation(() => {
          throw new Error("Storage error");
        });
        
        const result = await storageService.setCurrentCopiedActionV3(mockAction);
        
        expect(result).toBe(false);
      });
    });

    describe("getCurrentCopiedActionV3", () => {
      test("should return current copied action", async () => {
        const serializedAction = JSON.stringify(mockAction);
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: serializedAction });
        });
        
        const result = await storageService.getCurrentCopiedActionV3();
        
        expect(result).toBe(serializedAction);
      });
    });

    describe("clearCurrentCopiedActionV3", () => {
      test("should clear current copied action", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        await storageService.clearCurrentCopiedActionV3();
        
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'currentCopiedActionV3': null });
      });
    });
  });

  describe("Copied Actions V3", () => {
    describe("getCopiedActionsV3", () => {
      test("should return stored copied actions", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [mockAction, mockAction2] });
        });
        
        const result = await storageService.getCopiedActionsV3();
        expect(result).toEqual([mockAction, mockAction2]);
      });
    });

    describe("setNewCopiedActionV3", () => {
      test("should add new copied action to list", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.setNewCopiedActionV3(mockAction);
        
        expect(result).toEqual([mockAction]);
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'copiedActionsV3': [mockAction] });
      });
    });

    describe("setNewCopiedActionsV3", () => {
      test("should add action to provided old actions list", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        const oldActions = [mockAction];
        
        const result = await storageService.setNewCopiedActionsV3(mockAction2, oldActions);
        
        expect(result).toEqual([mockAction, mockAction2]);
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'copiedActionsV3': [mockAction, mockAction2] });
      });
    });

    describe("deleteCopiedActionV3", () => {
      test("should delete copied action from list", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: [mockAction, mockAction2] });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });
        
        const result = await storageService.deleteCopiedActionV3(mockAction);
        
        expect(result).toEqual([mockAction2]);
      });
    });

    describe("clearCopiedActionsV3", () => {
      test("should clear copied actions V3 in local storage", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        await storageService.clearCopiedActionsV3();

        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 'copiedActionsV3': [] });
      });
    });
  });

  describe("Settings Object Management", () => {
    describe("getSettings", () => {
      test("should return default settings when no settings stored", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: undefined });
        });

        const result = await storageService.getSettings();

        expect(result).toEqual(defaultSettings);
        expect(mockChrome.storage.local.get).toHaveBeenCalledWith('appSettings', expect.any(Function));
      });

      test("should return stored settings", async () => {
        const storedSettings = { 
          isRecordingPage: true,
          isClassicPowerAutomatePage: false,
          maximumRecordingTimeMinutes: 30 
        };
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: storedSettings });
        });

        const result = await storageService.getSettings();

        expect(result).toEqual({ ...defaultSettings, ...storedSettings });
      });

      test("should merge with defaults for partial settings", async () => {
        const partialSettings = { isRecordingPage: true }; // Missing other settings
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: partialSettings });
        });

        const result = await storageService.getSettings();

        expect(result).toEqual({ ...defaultSettings, ...partialSettings });
      });
    });

    describe("updateSettings", () => {
      test("should update partial settings and return merged result", async () => {
        // Mock getSettings call
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: defaultSettings });
        });
        // Mock set call
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        const result = await storageService.updateSettings({ isRecordingPage: true });

        expect(result).toEqual({ ...defaultSettings, isRecordingPage: true });
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 
          'appSettings': { ...defaultSettings, isRecordingPage: true } 
        });
      });

      test("should preserve existing settings when updating", async () => {
        const existingSettings = { ...defaultSettings, isRecordingPage: false, maximumRecordingTimeMinutes: 60 };
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: existingSettings });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        const result = await storageService.updateSettings({ isRecordingPage: true });

        expect(result).toEqual({ ...existingSettings, isRecordingPage: true });
      });
    });

    describe("resetSettings", () => {
      test("should reset settings to defaults", async () => {
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        const result = await storageService.resetSettings();

        expect(result).toEqual(defaultSettings);
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ 
          'appSettings': defaultSettings 
        });
      });
    });

    describe("New Settings Features", () => {
      test("should update Power Automate page settings", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: defaultSettings });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        const result = await storageService.updateSettings({ 
          isClassicPowerAutomatePage: true,
          isModernPowerAutomatePage: false 
        });

        expect(result).toEqual({ 
          ...defaultSettings, 
          isClassicPowerAutomatePage: true,
          isModernPowerAutomatePage: false 
        });
      });

      test("should update maximum recording time", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: defaultSettings });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        const result = await storageService.updateSettings({ maximumRecordingTimeMinutes: 30 });

        expect(result).toEqual({ ...defaultSettings, maximumRecordingTimeMinutes: 30 });
      });

      test("should update show action search bar setting", async () => {
        mockChrome.storage.local.get.mockImplementation((key, callback) => {
          callback({ [key]: defaultSettings });
        });
        mockChrome.storage.local.set.mockImplementation((data, callback) => {
          callback && callback();
        });

        const result = await storageService.updateSettings({ showActionSearchBar: false });

        expect(result).toEqual({ ...defaultSettings, showActionSearchBar: false });
      });
    });
  });
});
