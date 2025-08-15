import { ExtensionCommunicationService } from "./../../services";
import { ActionType, AppElement, IDataChromeMessage } from "../../models";

const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
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

(global as any).chrome = mockChrome;

describe("ExtensionCommunicationService", () => {
  let communicationService: ExtensionCommunicationService;

  beforeEach(() => {
    communicationService = new ExtensionCommunicationService();
    jest.clearAllMocks();
  });

  describe("sendRequest", () => {
    test("should call sendRequestInTabsScript when receiver is AppElement.Content", () => {
      const requestObject: IDataChromeMessage = {
        actionType: ActionType.CheckRecordingPage,
        message: "someMessage",
      };
      const sender = AppElement.Background;
      const receiver = AppElement.Content;
      const callback = jest.fn();
      
      // Spy on private methods
      const sendRequestInTabsScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInTabsScript').mockImplementation(() => {});
      const sendRequestInRuntimeScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInRuntimeScript').mockImplementation(() => {});

      communicationService.sendRequest(requestObject, sender, receiver, callback);

      expect(sendRequestInTabsScriptSpy).toHaveBeenCalledWith(
        requestObject,
        sender,
        receiver,
        callback
      );
      expect(sendRequestInRuntimeScriptSpy).not.toHaveBeenCalled();
    });

    test("should call sendRequestInRuntimeScript when receiver is AppElement.Background", () => {
      const requestObject: IDataChromeMessage = {
        actionType: ActionType.CheckRecordingPage,
        message: "someMessage",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Background;
      const callback = jest.fn();
      
      const sendRequestInTabsScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInTabsScript').mockImplementation(() => {});
      const sendRequestInRuntimeScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInRuntimeScript').mockImplementation(() => {});

      communicationService.sendRequest(requestObject, sender, receiver, callback);

      expect(sendRequestInTabsScriptSpy).not.toHaveBeenCalled();
      expect(sendRequestInRuntimeScriptSpy).toHaveBeenCalledWith(
        requestObject,
        sender,
        receiver,
        callback
      );
    });

    test("should call sendRequestInRuntimeScript when receiver is AppElement.ReactApp", () => {
      const requestObject: IDataChromeMessage = {
        actionType: ActionType.CheckRecordingPage,
        message: "someMessage",
      };
      const sender = AppElement.Background;
      const receiver = AppElement.ReactApp;
      const callback = jest.fn();
      
      const sendRequestInTabsScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInTabsScript').mockImplementation(() => {});
      const sendRequestInRuntimeScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInRuntimeScript').mockImplementation(() => {});

      communicationService.sendRequest(requestObject, sender, receiver, callback);

      expect(sendRequestInTabsScriptSpy).not.toHaveBeenCalled();
      expect(sendRequestInRuntimeScriptSpy).toHaveBeenCalledWith(
        requestObject,
        sender,
        receiver,
        callback
      );
    });

    test("should handle different ActionType values", () => {
      const requestObject: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: "test message",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Background;
      const callback = jest.fn();
      
      const sendRequestInRuntimeScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInRuntimeScript').mockImplementation(() => {});

      communicationService.sendRequest(requestObject, sender, receiver, callback);

      expect(sendRequestInRuntimeScriptSpy).toHaveBeenCalledWith(
        requestObject,
        sender,
        receiver,
        callback
      );
    });

    test("should work without callback function", () => {
      const requestObject: IDataChromeMessage = {
        actionType: ActionType.CheckRecordingPage,
        message: "test message",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Background;
      
      const sendRequestInRuntimeScriptSpy = jest.spyOn(communicationService as any, 'sendRequestInRuntimeScript').mockImplementation(() => {});

      // Should not throw when callback is undefined
      expect(() => {
        communicationService.sendRequest(requestObject, sender, receiver);
      }).not.toThrow();

      // The service should create a fallback callback function
      expect(sendRequestInRuntimeScriptSpy).toHaveBeenCalledWith(
        requestObject,
        sender,
        receiver,
        expect.any(Function) // Should be a function, not undefined
      );
    });
  });

  describe("sendRequestInTabsScript", () => {
    test("should send message to active tab and invoke callback", async () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: "someMessage",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Content;
      const callback = jest.fn();

      // Mock tabs.query to return active tab
      mockChrome.tabs.query.mockImplementation((queryInfo: any, callback: any) => {
        expect(queryInfo).toEqual({ active: true, currentWindow: true });
        callback([{ id: 123 }]);
      });

      // Mock tabs.sendMessage
      mockChrome.tabs.sendMessage.mockImplementation((tabId: number, message: any, callback: any) => {
        expect(tabId).toBe(123);
        expect(message).toEqual({
          ...request,
          from: sender,
          to: receiver,
        });
        if (callback) callback("response");
      });

      // Call the private method directly
      (communicationService as any).sendRequestInTabsScript(request, sender, receiver, callback);

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true }, expect.any(Function));
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        {
          ...request,
          from: sender,
          to: receiver,
        },
        callback
      );
    });

    test("should handle case when no active tabs found", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: "someMessage",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Content;
      const callback = jest.fn();

      // Mock tabs.query to return empty array
      mockChrome.tabs.query.mockImplementation((queryInfo: any, callback: any) => {
        callback([]);
      });

      // This will actually throw because the service tries to access tabs[0].id
      // when there are no tabs, so we should expect it to throw
      expect(() => {
        (communicationService as any).sendRequestInTabsScript(request, sender, receiver, callback);
      }).toThrow();

      expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    test("should handle case when tabs.query returns tabs without id", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: "someMessage",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Content;
      const callback = jest.fn();

      // Mock tabs.query to return tab without id
      mockChrome.tabs.query.mockImplementation((queryInfo: any, callback: any) => {
        callback([{ url: "https://example.com" }]); // Tab without id property
      });

      mockChrome.tabs.sendMessage.mockImplementation((tabId: number, message: any, callback: any) => {
        // This will be called with undefined as tabId
        expect(tabId).toBeUndefined();
      });

      // The service will still call sendMessage even with undefined id
      (communicationService as any).sendRequestInTabsScript(request, sender, receiver, callback);

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        undefined, // tabs[0].id will be undefined
        {
          ...request,
          from: sender,
          to: receiver,
        },
        callback
      );
    });

    test("should work without callback parameter", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: "someMessage",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Content;

      mockChrome.tabs.query.mockImplementation((queryInfo: any, callback: any) => {
        callback([{ id: 123 }]);
      });

      mockChrome.tabs.sendMessage.mockImplementation((tabId: number, message: any, callback: any) => {
        // Callback should be undefined when no callback is provided
        expect(callback).toBeUndefined();
      });

      expect(() => {
        (communicationService as any).sendRequestInTabsScript(request, sender, receiver);
      }).not.toThrow();

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        {
          ...request,
          from: sender,
          to: receiver,
        },
        undefined // Should be undefined when no callback provided
      );
    });
  });

  describe("sendRequestInRuntimeScript", () => {
    test("should send message to runtime script and invoke callback", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: "someMessage",
      };
      const sender = AppElement.Background;
      const receiver = AppElement.ReactApp;
      const callback = jest.fn();

      (communicationService as any).sendRequestInRuntimeScript(request, sender, receiver, callback);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          ...request,
          from: sender,
          to: receiver,
        },
        callback
      );
    });

    test("should work without callback parameter", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.CheckRecordingPage,
        message: "test message",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Background;

      expect(() => {
        (communicationService as any).sendRequestInRuntimeScript(request, sender, receiver);
      }).not.toThrow();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          ...request,
          from: sender,
          to: receiver,
        },
        undefined
      );
    });

    test("should handle different message types", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.CheckRecordingPage,
        message: { data: "complex object" },
      };
      const sender = AppElement.Content;
      const receiver = AppElement.Background;
      const callback = jest.fn();

      (communicationService as any).sendRequestInRuntimeScript(request, sender, receiver, callback);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          ...request,
          from: sender,
          to: receiver,
        },
        callback
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle undefined request object", () => {
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Background;
      const callback = jest.fn();

      expect(() => {
        communicationService.sendRequest(undefined as any, sender, receiver, callback);
      }).not.toThrow();
    });

    test("should handle null message in request", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: null,
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Background;
      const callback = jest.fn();

      expect(() => {
        communicationService.sendRequest(request, sender, receiver, callback);
      }).not.toThrow();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          ...request,
          from: sender,
          to: receiver,
        },
        callback
      );
    });
  });
});
