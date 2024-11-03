import { Constants } from "../constants/Constants";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage } from "../models";
import { IBackgroundService, IStorageService, IExtensionCommunicationService, IActionService } from "./interfaces";

export class BackgroundService implements IBackgroundService {
    private actionsWithBody: chrome.webRequest.WebRequestBodyDetails[] = [];
    private previousUrl = '';
    private isRecordingPageVar = false;

    constructor(private storageService: IStorageService, private communicationService: IExtensionCommunicationService, private actionsService: IActionService) {
    }

    public handleBackgroundAction = (message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender | null, sendResponse: (response?: any) => void) => {
        if (!this.isCorrectReceiver(message)) { console.log('Incorrect Background Action'); }
        switch (message.actionType) {
            case ActionType.StartRecording:
                this.storageService.setIsRecordingValue(true);
                sendResponse(true);
                break;
            case ActionType.StopRecording:
                this.storageService.setIsRecordingValue(false);
                sendResponse(false);
                break;
            case ActionType.DeleteAction:
                this.storageService.deleteRecordedAction(message.message);
                break;
            case ActionType.DeleteMyClipboardAction:
                this.storageService.deleteMyClipboardAction(message.message);
                break;
            case ActionType.DeleteMyCopiedActionV3:
                this.storageService.deleteCopiedActionV3(message.message);
                break;
            default:
                console.log('Incorrect Action Type')
        }
    }

    private handleRequest = async (req: chrome.webRequest.WebRequestHeadersDetails) => {
        try {
            const isRecording = await this.storageService.getIsRecordingValue();
            if (isRecording) {
                const isRecordingPage = await this.checkIfPageIsRecordingPage();
                if (!isRecordingPage) { return; }

                const foundAction = this.actionsWithBody.find((action) => action.requestId === req.requestId);
                const newAction = this.actionsService.getCorrectAction(req, foundAction);

                if(!newAction) { return; }

                this.storageService.addNewRecordedAction(newAction);
                const actions = await this.storageService.getRecordedActions();
                this.communicationService.sendRequest(
                    { actionType: ActionType.ActionUpdated, message: actions },
                    AppElement.Background,
                    AppElement.ReactApp);

            }
        } catch (e) {
            console.log(e);
        }
    }

    public recordActions = () => {
        chrome.webRequest.onBeforeRequest.addListener((req) => {
            this.actionsWithBody.push(req);
        }, {
            urls: ["<all_urls>"],
            types: ["xmlhttprequest"]
        },
            ["requestBody"]);

        chrome.webRequest.onBeforeSendHeaders.addListener((req) => {
            this.handleRequest(req);
        }, {
            urls: ["<all_urls>"],
            types: ["xmlhttprequest"]
        }, [
            'requestHeaders',
        ]);
    }

    private isCorrectReceiver = (message: ICommunicationChromeMessage) => {
        return message.to === AppElement.Background;
    }

    public getCurrentTabUrl(): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    const tab = tabs[0];
                    resolve(tab.url ? tab.url : '');
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    public isRecordingPage(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.communicationService.sendRequest({ actionType: ActionType.CheckRecordingPage, message: "Check Recording Page" }, AppElement.Background, AppElement.Content,
                (response) => {
                    resolve(response)
                });
        });
    }

    private checkUrlChange = async () => {
        const url = await this.getCurrentTabUrl();
        return (this.previousUrl !== url);
    }

    private checkIfPageIsRecordingPage = async () => {
        const urlHasChanged = await this.checkUrlChange();
        if (urlHasChanged) {
            this.isRecordingPageVar = await this.isRecordingPage();
        }

        return this.isRecordingPageVar
    }
}