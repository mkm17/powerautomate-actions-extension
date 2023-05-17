import { ExtensionCommunicationService } from "./../../services";
import { ActionType, AppElement, IDataChromeMessage } from "../../models";

describe("ExtensionCommunicationService", () => {
  let communicationService: ExtensionCommunicationService;
  ;
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


  beforeEach(() => {
    communicationService = new ExtensionCommunicationService();
    global['chrome'] = mockChrome as any;
  });

  describe("sendRequest", () => {
    test("should call sendRequestInTabsScript when receiver is AppElement.Content", () => {
      const requestObject: IDataChromeMessage = {
        actionType: ActionType.CheckSharePointPage,
        message: "someMessage",
      };
      const sender = AppElement.Background;
      const receiver = AppElement.Content;
      const callback = jest.fn();
      communicationService['sendRequestInTabsScript'] = jest.fn();
      communicationService['sendRequestInRuntimeScript'] = jest.fn();

      communicationService.sendRequest(requestObject, sender, receiver, callback);

      expect(communicationService['sendRequestInTabsScript']).toHaveBeenCalledWith(
        requestObject,
        sender,
        receiver,
        callback
      );
      expect(communicationService['sendRequestInRuntimeScript']).not.toHaveBeenCalled();
    });

    test("should call sendRequestInRuntimeScript when receiver is AppElement.Background or AppElement.ReactApp", () => {
      const requestObject: IDataChromeMessage = {
        actionType: ActionType.CheckSharePointPage,
        message: "someMessage",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Background;
      const callback = jest.fn();
      communicationService['sendRequestInTabsScript'] = jest.fn();
      communicationService['sendRequestInRuntimeScript'] = jest.fn();

      communicationService.sendRequest(requestObject, sender, receiver, callback);

      expect(communicationService['sendRequestInTabsScript']).not.toHaveBeenCalled();
      expect(communicationService['sendRequestInRuntimeScript']).toHaveBeenCalledWith(
        requestObject,
        sender,
        receiver,
        callback
      );
    });
  });

  describe("sendRequestInTabsScript", () => {
    test("should send message to active tab and invoke callback", () => {
      const request: IDataChromeMessage = {
        actionType: ActionType.ActionUpdated,
        message: "someMessage",
      };
      const sender = AppElement.ReactApp;
      const receiver = AppElement.Content;
      const callback = jest.fn();
      communicationService['sendRequestInTabsScript'] = jest.fn();

      mockChrome.tabs.query.mockImplementationOnce((queryInfo: any, callback: any) => {
        callback([{ id: 1 }]);
      });

      communicationService['sendRequestInTabsScript'](
        request,
        sender,
        receiver,
        callback
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

      communicationService['sendRequestInRuntimeScript'](
        request,
        sender,
        receiver,
        callback
      );

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
