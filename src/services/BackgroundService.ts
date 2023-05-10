import { ActionsService, ExtensionCommunicationService, StorageService } from ".";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage } from "../models";

export class BackgroundService {
    private actionsWithBody: chrome.webRequest.WebRequestBodyDetails[] = [];
    private chromeService = new StorageService();
    private contentService = new ActionsService();
    private communicationService = new ExtensionCommunicationService();

    public handleBackgroundAction = (message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        if (!this.isCorrectReceiver(message)) { console.log('Incorrect Background Action'); }
        switch (message.actionType) {
            case ActionType.StartRecording:
                this.chromeService.setIsRecordingValue(true);
                sendResponse(true);
                break;
            case ActionType.StopRecording:
                this.chromeService.setIsRecordingValue(false);
                sendResponse(false);
                break;
            case ActionType.DeleteAction:
                this.chromeService.deleteAction(message.message);
                break;
            case ActionType.DeleteMyClipboardAction:
                this.chromeService.deleteMyClipboardAction(message.message);
                break;
            default:
                console.log('Incorrect Action Type')
        }
    }

    private handleRequest = async (req: chrome.webRequest.WebRequestHeadersDetails) => {
        const isRecording = await this.chromeService.getIsRecordingValue();
        if (isRecording) {
            const findedAction = this.actionsWithBody.find((action) => action.requestId === req.requestId);
            const rawData: any = findedAction?.requestBody?.raw ? findedAction.requestBody.raw[0] : null;
            const requestBody = rawData && rawData['bytes'] ? JSON.parse(new TextDecoder("utf-8").decode(rawData['bytes'])) : null;
            const isSharePointPage = req.url.indexOf(req.initiator ? req.initiator : '') > -1;
            const headers = req.requestHeaders ? req.requestHeaders : [];
            const title = this.contentService.getTitleFromUrl(req.url);

            const actionJson = isSharePointPage ? this.contentService.getHttpSharePointActionTemplate(req.method, req.url, headers, title, requestBody) :
                this.contentService.getHttpRequestActionTemplate(req.method, req.url, headers, title, requestBody);
            console.log(actionJson);
            const newAction: IActionModel = {
                icon: 'https://connectoricons-prod.azureedge.net/releases/v1.0.1627/1.0.1627.3238/sharepointonline/icon.png',
                actionJson: actionJson,
                id: req.requestId,
                method: req.method,
                url: req.url,
                title: title,
                isSPAction: isSharePointPage,
                body: requestBody
            }

            this.chromeService.setNewAction(newAction);
            const actions = await this.chromeService.getActions();
            this.communicationService.sendRequest(
                { actionType: ActionType.ActionUpdated, message: actions },
                AppElement.Background,
                AppElement.ReactApp);

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

}