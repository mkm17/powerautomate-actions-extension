import { BackgroundService } from "../../services";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage } from "../../models";
import { IExtensionCommunicationService } from "../../services/interfaces";

describe("BackgroundService", () => {
    let backgroundService: BackgroundService;
    let storageServiceMock: any;
    let actionsServiceMock: any;
    let communicationServiceMock: jest.Mocked<IExtensionCommunicationService>;

    beforeEach(() => {
        storageServiceMock = {
            getIsRecordingValue: jest.fn().mockImplementation(() => { return true; }),
            setIsRecordingValue: jest.fn().mockImplementation((value) => { return value; }),
            deleteRecordedAction: jest.fn().mockImplementation((message) => { }),
            deleteMyClipboardAction: jest.fn().mockImplementation((message) => { }),
            addNewRecordedAction: jest.fn().mockImplementation((value) => { return value; }),
            getRecordedActions: jest.fn().mockImplementation(() => { return []; }),
        }

        actionsServiceMock = {
            getTitleFromUrl: jest.fn().mockImplementation((url) => { return 'Example'; }),
            getHttpSharePointActionTemplate: jest.fn(),
            getHttpRequestActionTemplate: jest.fn(),
            getCorrectAction: jest.fn(),
        };

        communicationServiceMock = {
            sendRequest: jest.fn(),
        } as jest.Mocked<IExtensionCommunicationService>;

        backgroundService = new BackgroundService(storageServiceMock, communicationServiceMock, actionsServiceMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handleBackgroundAction", () => {
        test("should start recording when ActionType is StartRecording", () => {
            const sendResponseMock = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.StartRecording,
                message: null,
                from: AppElement.Content,
                to: AppElement.Background,
            };

            backgroundService.handleBackgroundAction(
                message,
                null,
                sendResponseMock
            );

            expect(storageServiceMock.setIsRecordingValue).toHaveBeenCalledWith(true);
            expect(sendResponseMock).toHaveBeenCalledWith(true);
        });

        test("should end recording when ActionType is StopRecording", () => {
            const sendResponseMock = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.StopRecording,
                message: null,
                from: AppElement.Content,
                to: AppElement.Background,
            };

            backgroundService.handleBackgroundAction(
                message,
                null,
                sendResponseMock
            );

            expect(storageServiceMock.setIsRecordingValue).toHaveBeenCalledWith(false);
            expect(sendResponseMock).toHaveBeenCalledWith(false);
        });

        test("should remove action when ActionType is DeleteAction", () => {
            const sendResponseMock = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.DeleteAction,
                message: {} as IActionModel,
                from: AppElement.Content,
                to: AppElement.Background,
            };

            backgroundService.handleBackgroundAction(
                message,
                null,
                sendResponseMock
            );

            expect(storageServiceMock.deleteRecordedAction).toHaveBeenCalledWith(message.message);
        });

        test("should remove action when ActionType is DeleteMyClipboardAction", () => {
            const sendResponseMock = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.DeleteMyClipboardAction,
                message: {} as IActionModel,
                from: AppElement.Content,
                to: AppElement.Background,
            };

            backgroundService.handleBackgroundAction(
                message,
                null,
                sendResponseMock
            );

            expect(storageServiceMock.deleteMyClipboardAction).toHaveBeenCalledWith(message.message);
        });

        test("should do nothing when AppElement is incorrect", () => {
            const sendResponseMock = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.StopRecording,
                message: null,
                from: AppElement.Content,
                to: AppElement.Content,
            };

            backgroundService.handleBackgroundAction(
                message,
                null,
                sendResponseMock
            )
        });

    });

    describe("handleRequest", () => {
        it('should not create a new action if isRecording is false', async () => {
            storageServiceMock.getIsRecordingValue.mockResolvedValue(false);

            const req = {
                requestId: '123',
                url: 'https://example.com/_api/web/lists',
                method: 'GET',
                initiator: 'https://example.com',
                requestHeaders: [],
                requestBody: {
                    raw: null,
                },
                documentId: 'documentID',
                documentLifecycle: "prerender",
                frameType: "outermost_frame",
                frameId: 123,
                parentFrameId: 123,
                tabId: 123,
                timeStamp: 123,
                type: "xmlhttprequest"
            } as chrome.webRequest.WebRequestHeadersDetails;

            await backgroundService['handleRequest'](req);

            expect(storageServiceMock.addNewRecordedAction).not.toHaveBeenCalled();
            expect(communicationServiceMock.sendRequest).not.toHaveBeenCalled();
        });

        it('should create a new SharePoint action when isRecording is true and isRecordingPage is true', async () => {
            storageServiceMock.getIsRecordingValue.mockResolvedValue(true);
            backgroundService['checkIfPageIsRecordingPage'] = jest.fn().mockResolvedValue(true);
            actionsServiceMock.getTitleFromUrl.mockReturnValue('lists');

            const req = {
                requestId: '123',
                url: 'https://example.com/_api/web/lists',
                method: 'GET',
                initiator: 'https://example.com',
                requestHeaders: [{ name: 'Header1', value: 'Value1' }],
                documentId: 'documentID',
                documentLifecycle: "prerender",
                frameType: "outermost_frame",
                frameId: 123,
                parentFrameId: 123,
                tabId: 123,
                timeStamp: 123,
                type: "xmlhttprequest"
            } as chrome.webRequest.WebRequestHeadersDetails;

            const returnedValue = {
                icon: "https://conn-afd-prod-endpoint-bmc9bqahasf3grgk.b01.azurefd.net/releases/v1.0.1723/1.0.1723.3986/sharepointonline/icon.png",
                actionJson: test,
                id: '123',
                method: 'GET',
                url: 'https://example.com/_api/web/lists',
                title: 'lists',
                body: null,
            };

            actionsServiceMock.getCorrectAction.mockReturnValue(returnedValue);

            await backgroundService['handleRequest'](req);

            expect(storageServiceMock.addNewRecordedAction).toHaveBeenCalledWith(returnedValue);

            expect(storageServiceMock.getRecordedActions).toHaveBeenCalled();

            expect(communicationServiceMock.sendRequest).toHaveBeenCalledWith(
                { actionType: ActionType.ActionUpdated, message: [] },
                AppElement.Background,
                AppElement.ReactApp
            );
        });


        it('should omit creating a new SharePoint action when isRecording is true and isRecordingPage is true by type is incorrect', async () => {
            storageServiceMock.getIsRecordingValue.mockResolvedValue(true);
            backgroundService['checkIfPageIsRecordingPage'] = jest.fn().mockResolvedValue(true);
            actionsServiceMock.getTitleFromUrl.mockReturnValue('lists');

            const req = {
                requestId: '123',
                url: 'https://example.com/_api/web/lists',
                method: 'GET',
                initiator: 'https://example.com',
                requestHeaders: [{ name: 'Header1', value: 'Value1' }],
                documentId: 'documentID',
                documentLifecycle: "prerender",
                frameType: "outermost_frame",
                frameId: 123,
                parentFrameId: 123,
                tabId: 123,
                timeStamp: 123,
                type: "object"
            } as chrome.webRequest.WebRequestHeadersDetails;

            await backgroundService['handleRequest'](req);

            expect(storageServiceMock.addNewRecordedAction).not.toHaveBeenCalled();

            expect(storageServiceMock.getRecordedActions).not.toHaveBeenCalled();

            expect(communicationServiceMock.sendRequest).not.toHaveBeenCalled();
        });

        it('should create a new Http action for MS Graph when isRecording is true and isRecordingPage is true', async () => {
            storageServiceMock.getIsRecordingValue.mockResolvedValue(true);
            backgroundService['checkIfPageIsRecordingPage'] = jest.fn().mockResolvedValue(true);
            actionsServiceMock.getTitleFromUrl.mockReturnValue('lists');

            const req = {
                requestId: '123',
                url: 'https://graph.microsoft.com/_api/web/lists',
                method: 'GET',
                initiator: 'https://example.com/',
                requestHeaders: [{ name: 'Header1', value: 'Value1' }],
                documentId: 'documentID',
                documentLifecycle: "prerender",
                frameType: "outermost_frame",
                frameId: 123,
                parentFrameId: 123,
                tabId: 123,
                timeStamp: 123,
                type: "xmlhttprequest"
            } as chrome.webRequest.WebRequestHeadersDetails;

            const returnedValue = {
                icon: "https://content.powerapps.com/resource/makerx/static/pauto/images/designeroperations/http.a0aaded8.png",
                actionJson: undefined,
                id: '123',
                method: 'GET',
                url: 'https://graph.microsoft.com/_api/web/lists',
                title: 'lists',
                body: null,
            };

            actionsServiceMock.getCorrectAction.mockReturnValue(returnedValue);

            await backgroundService['handleRequest'](req);

            expect(storageServiceMock.addNewRecordedAction).toHaveBeenCalledWith(returnedValue);

            expect(storageServiceMock.getRecordedActions).toHaveBeenCalled();

            expect(communicationServiceMock.sendRequest).toHaveBeenCalledWith(
                { actionType: ActionType.ActionUpdated, message: [] },
                AppElement.Background,
                AppElement.ReactApp
            );
        });


        it('should do nothing when isRecording is true and isRecordingPage is false', async () => {
            storageServiceMock.getIsRecordingValue.mockResolvedValue(true);
            backgroundService['checkIfPageIsRecordingPage'] = jest.fn().mockResolvedValue(false);
            actionsServiceMock.getTitleFromUrl.mockReturnValue('lists');

            const req = {
                requestId: '123',
                url: 'https://graph.microsoft.com/_api/web/lists',
                method: 'GET',
                initiator: 'https://example.com/',
                requestHeaders: [{ name: 'Header1', value: 'Value1' }],
                documentId: 'documentID',
                documentLifecycle: "prerender",
                frameType: "outermost_frame",
                frameId: 123,
                parentFrameId: 123,
                tabId: 123,
                timeStamp: 123,
                type: "xmlhttprequest"
            } as chrome.webRequest.WebRequestHeadersDetails;

            await backgroundService['handleRequest'](req);

            expect(storageServiceMock.addNewRecordedAction).not.toHaveBeenCalled();

            expect(storageServiceMock.getRecordedActions).not.toHaveBeenCalled();

            expect(communicationServiceMock.sendRequest).not.toHaveBeenCalled();
        });

        it('should omit requests when isRecording is true and isRecordingPage is false but request type is not xmlhttprequest', async () => {
            storageServiceMock.getIsRecordingValue.mockResolvedValue(true);
            backgroundService['checkIfPageIsRecordingPage'] = jest.fn().mockResolvedValue(false);
            actionsServiceMock.getTitleFromUrl.mockReturnValue('lists');

            const req = {
                requestId: '123',
                url: 'https://graph.microsoft.com/_api/web/lists',
                method: 'GET',
                initiator: 'https://example.com/',
                requestHeaders: [{ name: 'Header1', value: 'Value1' }],
                documentId: 'documentID',
                documentLifecycle: "prerender",
                frameType: "outermost_frame",
                frameId: 123,
                parentFrameId: 123,
                tabId: 123,
                timeStamp: 123,
                type: "object"
            } as chrome.webRequest.WebRequestHeadersDetails;

            await backgroundService['handleRequest'](req);

            expect(storageServiceMock.addNewRecordedAction).not.toHaveBeenCalled();

            expect(storageServiceMock.getRecordedActions).not.toHaveBeenCalled();

            expect(communicationServiceMock.sendRequest).not.toHaveBeenCalled();
        });

    });
});
