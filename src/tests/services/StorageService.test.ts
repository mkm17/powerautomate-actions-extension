import { StorageService } from "./../../services";
import { IActionModel } from "../../models";

const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
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
});
