import { StorageService } from "./../../services";
import { IActionModel } from "../../models";

describe("StorageService", () => {
  let storageService: StorageService;
  const mockChrome = {
    storage: {
      local: {
        get: jest.fn().mockImplementation((key) => {
          switch (key) {
            case 'ACTIONS_KEY': return [];
            case 'MY_CLIPBOARD_ACTIONS_KEY': return [];
            case 'IS_RECORDING_KEY': true;
          }
        }
        ),
        set: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn(),
    },
    runtime: {
      sendMessage: jest.fn(),
    },
  };


  beforeEach(() => {
    storageService = new StorageService();
    global['chrome'] = mockChrome as any;
  });


  describe("clearActions", () => {
    test("should clear actions in local storage", async () => {
      await storageService.clearActions();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [storageService['ACTIONS_KEY']]: [] });
    });
  });

  describe("clearMyClipboardActions", () => {
    test("should clear myClipboardActions in local storage", async () => {
      await storageService.clearMyClipboardActions();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [storageService['MY_CLIPBOARD_ACTIONS_KEY']]: [] });
    });
  });


  describe("setIsRecordingValue", () => {
    test("should set the value of isRecording in local storage", async () => {
      const isRecording = true;

      await storageService.setIsRecordingValue(isRecording);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [storageService['IS_RECORDING_KEY']]: isRecording });
    });
  });
});
