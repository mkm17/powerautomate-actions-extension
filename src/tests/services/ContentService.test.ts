import { ContentService } from "./../../services";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage } from "../../models";
import { IStorageService, IExtensionCommunicationService } from "../../services/interfaces";

describe("ContentService", () => {
    let contentService: ContentService;
    let storageServiceMock: jest.Mocked<IStorageService>;
    let communicationServiceMock: any;

    beforeEach(() => {
        storageServiceMock = {
        } as jest.Mocked<IStorageService>;

        communicationServiceMock = {
            sendRequest: jest.fn(),
            copyListener: jest.fn()
        };

        contentService = new ContentService(storageServiceMock, communicationServiceMock);
    });

    describe("handleContentAction", () => {
        test("should call copyListener when ActionType is CopyAction", () => {
            const sendResponseMock = jest.fn();
            contentService['copyListener'] = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.CopyAction,
                message: [],
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };

            contentService.handleContentAction(
                message,
                null,
                sendResponseMock
            );

            expect(contentService['copyListener']).toHaveBeenCalledWith(message);
        });

        test("should call getElementsFromMyClipboard when ActionType is GetElementsFromMyClipboard", () => {
            const sendResponseMock = jest.fn();
            contentService['getElementsFromMyClipboard'] = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.GetElementsFromMyClipboard,
                message: [],
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };

            contentService.handleContentAction(
                message,
                null,
                sendResponseMock
            );

            expect(contentService['getElementsFromMyClipboard']).toHaveBeenCalled();
        });

        test("should call isSharePointPage when ActionType is CheckSharePointPage", () => {
            const sendResponseMock = jest.fn();
            contentService['isRecordingPage'] = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.CheckRecordingPage,
                message: [],
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };

            contentService.handleContentAction(
                message,
                null,
                sendResponseMock
            );

            expect(contentService['isRecordingPage']).toHaveBeenCalled();
        });

        test("should call isPowerAutomatePage when ActionType is CheckPowerAutomatePage", () => {
            const sendResponseMock = jest.fn();
            contentService['isPowerAutomatePage'] = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.CheckPowerAutomatePage,
                message: [],
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };

            contentService.handleContentAction(
                message,
                null,
                sendResponseMock
            );

            expect(contentService['isPowerAutomatePage']).toHaveBeenCalled();
        });

        test("should call hasActionsToCopy when ActionType is CheckIfPageHasActionsToCopy", () => {
            const sendResponseMock = jest.fn();
            contentService['hasActionsToCopy'] = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.CheckIfPageHasActionsToCopy,
                message: [],
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };

            contentService.handleContentAction(
                message,
                null,
                sendResponseMock
            );

            expect(contentService['hasActionsToCopy']).toHaveBeenCalled();
        });

        test("should call copyAllActionsFromPage when ActionType is CopyAllActionsFromPage", () => {
            const sendResponseMock = jest.fn();
            contentService['copyAllActionsFromPage'] = jest.fn();
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.CopyAllActionsFromPage,
                message: [],
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };

            contentService.handleContentAction(
                message,
                null,
                sendResponseMock
            );

            expect(contentService['copyAllActionsFromPage']).toHaveBeenCalled();
        });

    });

    describe("copyListener", () => {

        test('should copy and paste the action JSON', () => {
            const action: IActionModel = {
                icon: 'icon',
                actionJson: '{}',
                id: 'actionId',
                method: 'GET',
                url: 'http://example.com',
                title: 'Example Action',
                body: null
            };
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.ActionUpdated,
                message: [action],
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };

            document.execCommand = jest.fn();

            contentService['copyListener'](message);
            expect(document.execCommand).toHaveBeenCalledWith('paste');
        });

        test('should log an error message if message content is incorrect', () => {
            const message: ICommunicationChromeMessage = {
                actionType: ActionType.ActionUpdated,
                message: null,
                from: AppElement.ReactApp,
                to: AppElement.Content,
            };


            console.log = jest.fn();

            contentService['copyListener'](message);

            expect(console.log).toHaveBeenCalledWith('Incorrect message');
        });
    });

    describe("copyAllActionsFromPage", () => {
        test('should copy all actions from the page and update clipboard actions', async () => {
            // Prepare test data
            const actionJsonText = '{"icon": "icon1", "operationName": "Operation 1"}';
            const elementMock = {
                innerText: actionJsonText
            };
            const elementsMock = [elementMock, elementMock, elementMock];
            const expectedNewActions: IActionModel[] = [
                {
                    actionJson: actionJsonText,
                    id: 'uniqueId1',
                    method: '',
                    url: '',
                    icon: 'icon1',
                    title: 'Operation 1'
                },
                {
                    actionJson: actionJsonText,
                    id: 'uniqueId2',
                    method: '',
                    url: '',
                    icon: 'icon1',
                    title: 'Operation 1'
                },
                {
                    actionJson: actionJsonText,
                    id: 'uniqueId3',
                    method: '',
                    url: '',
                    icon: 'icon1',
                    title: 'Operation 1'
                }
            ];
            const actionsUpdatedMessage = {
                actionType: ActionType.MyClipboardActionsUpdated,
                message: expectedNewActions,
            };

            document.getElementsByClassName = jest.fn().mockReturnValue(elementsMock);
            storageServiceMock.setNewMyClipboardActions = jest.fn().mockResolvedValue(expectedNewActions);
            communicationServiceMock.sendRequest = jest.fn();

            await contentService['copyAllActionsFromPage']();

            expect(document.getElementsByClassName).toHaveBeenCalledWith('powerAutomateCode');
            expect(storageServiceMock.setNewMyClipboardActions).toHaveBeenCalledWith([
                {
                    actionJson: actionJsonText,
                    id: expect.any(String),
                    method: '',
                    url: '',
                    icon: 'icon1',
                    title: 'Operation 1'
                },
                {
                    actionJson: actionJsonText,
                    id: expect.any(String),
                    method: '',
                    url: '',
                    icon: 'icon1',
                    title: 'Operation 1'
                },
                {
                    actionJson: actionJsonText,
                    id: expect.any(String),
                    method: '',
                    url: '',
                    icon: 'icon1',
                    title: 'Operation 1'
                }
            ]);
            expect(communicationServiceMock.sendRequest).toHaveBeenCalledWith(actionsUpdatedMessage, AppElement.Content, AppElement.ReactApp);
        });

        test('should log an error message if copying actions from the page fails', async () => {
            console.log = jest.fn();
            document.getElementsByClassName = jest.fn().mockImplementation(() => {
                throw new Error('Error accessing elements');
            });

            await contentService['copyAllActionsFromPage']();

            expect(console.log).toHaveBeenCalledWith('Cannot Copy the actions from the page');
        });


        test('should log a message if actions array is empty', async () => {
            console.log = jest.fn();
            document.getElementsByClassName = jest.fn().mockImplementation(() => {
                return [];
            });

            await contentService['copyAllActionsFromPage']();

            expect(console.log).toHaveBeenCalledWith('Cannot Copy the actions from the page');
        });

        test('should log a message if actions JSON is corrupted', async () => {
            // Prepare test data
            const actionJsonText = 'Corrupted JSON}';
            const elementMock = {
                innerText: actionJsonText
            };
            const elementsMock = [elementMock, elementMock, elementMock];
            const expectedNewActions: IActionModel[] = [
                {
                    actionJson: actionJsonText,
                    id: 'uniqueId1',
                    method: '',
                    url: '',
                    icon: 'icon1',
                    title: 'Operation 1'
                }
            ];
            const actionsUpdatedMessage = {
                actionType: ActionType.MyClipboardActionsUpdated,
                message: expectedNewActions,
            };

            document.getElementsByClassName = jest.fn().mockReturnValue(elementsMock);
            storageServiceMock.setNewMyClipboardActions = jest.fn().mockResolvedValue(expectedNewActions);
            communicationServiceMock.sendRequest = jest.fn();

            await contentService['copyAllActionsFromPage']();

            expect(console.log).toHaveBeenCalledWith('Cannot Copy the actions from the page');
        });
    });

    describe("getElementsFromMyClipboard", () => {
        test('should retrieve elements from my clipboard, update clipboard actions, and send update message', async () => {
            // Prepare test data
            const elementMock = {
                getElementsByClassName: jest.fn().mockReturnValue([
                    {
                        getElementsByTagName: jest.fn().mockReturnValue([
                            {
                                innerText: 'Action 1'
                            }
                        ])
                    }
                ]),
                querySelector: jest.fn().mockReturnValue({
                    innerHTML: '{}'
                })
            };
            const elementsMock = [elementMock, elementMock];
            const expectedNewActions: IActionModel[] = [
                {
                    actionJson: `{
                  "id": "a9abf920-e736-4b15-ae5e-463c366da02b",
                  "brandColor": "#007ee5",
                  "icon": undefined,
                  "isTrigger": false,
                  "operationName": "Action 1",
                  "operationDefinition": {}
                }`,
                    id: 'uniqueId1',
                    method: '',
                    url: '',
                    title: 'Action 1',
                    icon: 'undefined'
                }
            ];
            const actionsUpdatedMessage = {
                actionType: ActionType.MyClipboardActionsUpdated,
                message: expectedNewActions
            };

            document.getElementsByClassName = jest.fn().mockReturnValue(elementsMock);
            document.querySelector = jest.fn().mockReturnValue({
                innerHTML: '{}'
            });
            storageServiceMock.setNewMyClipboardActions = jest.fn().mockResolvedValue(expectedNewActions);
            communicationServiceMock.sendRequest = jest.fn();

            await contentService['getElementsFromMyClipboard']();
            expect(document.getElementsByClassName).toHaveBeenCalledWith('fl-MyClipboardRecommendationItem');

            expect(storageServiceMock.setNewMyClipboardActions).toHaveBeenCalled();
            expect(communicationServiceMock.sendRequest).toHaveBeenCalledWith(actionsUpdatedMessage, AppElement.Content, AppElement.ReactApp);
        });

        test('should do nothing for empty array from my clipboard', async () => {

            document.getElementsByClassName = jest.fn().mockReturnValue([]);

            communicationServiceMock.sendRequest = jest.fn();
            storageServiceMock.setNewMyClipboardActions = jest.fn();

            await contentService['getElementsFromMyClipboard']();
            expect(document.getElementsByClassName).toHaveBeenCalledWith('fl-MyClipboardRecommendationItem');

            expect(storageServiceMock.setNewMyClipboardActions).not.toHaveBeenCalled();
            expect(communicationServiceMock.sendRequest).not.toHaveBeenCalled();
        });

        test('should skip for elements with incorrect structure from my clipboard', async () => {
            // Prepare test data
            const elementMock = {
                getElementsByClassName: jest.fn().mockReturnValue([
                    {
                        getElementsByTagName: jest.fn().mockReturnValue([
                            {
                                innerText: 'Action 1'
                            }
                        ])
                    }
                ]),
                querySelector: jest.fn().mockReturnValue({
                    innerHTML: '{Incorrect JSON//sada'
                })
            };
            const elementsMock = [elementMock, elementMock];
            const expectedNewActions: IActionModel[] = [
                {
                    actionJson: `{
                  "id": "a9abf920-e736-4b15-ae5e-463c366da02b",
                  "brandColor": "#007ee5",
                  "icon": undefined,
                  "isTrigger": false,
                  "operationName": "Action 1",
                  "operationDefinition": {}
                }`,
                    id: 'uniqueId1',
                    method: '',
                    url: '',
                    title: 'Action 1',
                    icon: 'undefined'
                }
            ];
            const actionsUpdatedMessage = {
                actionType: ActionType.MyClipboardActionsUpdated,
                message: expectedNewActions
            };

            document.getElementsByClassName = jest.fn().mockReturnValue(elementsMock);
            document.querySelector = jest.fn().mockReturnValue({
                innerHTML: '{}'
            });
            storageServiceMock.setNewMyClipboardActions = jest.fn().mockResolvedValue(expectedNewActions);
            communicationServiceMock.sendRequest = jest.fn();

            await contentService['getElementsFromMyClipboard']();
            expect(document.getElementsByClassName).toHaveBeenCalledWith('fl-MyClipboardRecommendationItem');

            expect(storageServiceMock.setNewMyClipboardActions).not.toHaveBeenCalled();
            expect(communicationServiceMock.sendRequest).not.toHaveBeenCalled();
        });
    });
});
