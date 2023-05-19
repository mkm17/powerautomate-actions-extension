import { Constants } from "../constants/Constants";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage } from "../models";
import { IBackgroundService, IStorageService, IExtensionCommunicationService, IActionService } from "./interfaces";

export class BackgroundService implements IBackgroundService {
    private actionsWithBody: chrome.webRequest.WebRequestBodyDetails[] = [];
    private previousUrl = '';
    private isSharePointPageVar = false;

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
                this.storageService.deleteAction(message.message);
                break;
            case ActionType.DeleteMyClipboardAction:
                this.storageService.deleteMyClipboardAction(message.message);
                break;
            default:
                console.log('Incorrect Action Type')
        }
    }

    private handleRequest = async (req: chrome.webRequest.WebRequestHeadersDetails) => {
        try {
            const isRecording = await this.storageService.getIsRecordingValue();
            if (isRecording) {
                const isSharePointPage = await this.checkIfPageIsSharePoint();
                if (!isSharePointPage) { return; }

                const findedAction = this.actionsWithBody.find((action) => action.requestId === req.requestId);
                const rawData: any = findedAction?.requestBody?.raw ? findedAction.requestBody.raw[0] : null;
                const requestBody = rawData && rawData['bytes'] ? JSON.parse(new TextDecoder("utf-8").decode(rawData['bytes'])) : null;
                const isSharePointRequest = req.url.indexOf(req.initiator ? req.initiator : '') > -1;
                const isGraphRequest = req.url.indexOf(Constants.MSGraphUrl) > -1;
                const headers = req.requestHeaders ? req.requestHeaders : [];
                const title = this.actionsService.getTitleFromUrl(req.url);

                if ((!isSharePointRequest && !isGraphRequest) || req.frameType === "sub_frame" || (req.type as any) != 'xmlhttprequest') { return; }
                
                const actionJson = isSharePointRequest ? this.actionsService.getHttpSharePointActionTemplate(req.method, req.url, headers, title, requestBody) :
                    this.actionsService.getHttpRequestActionTemplate(req.method, req.url, headers, title, requestBody);
                const newAction: IActionModel = {
                    icon: isSharePointRequest ? Constants.SharePointIcon : Constants.HttpRequestIcon,
                    actionJson: actionJson,
                    id: req.requestId,
                    method: req.method,
                    url: req.url,
                    title: title,
                    body: requestBody
                }

                this.storageService.setNewAction(newAction);
                const actions = await this.storageService.getActions();
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

    public isSharePointPage(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.communicationService.sendRequest({ actionType: ActionType.CheckSharePointPage, message: "Check SharePoint Page" }, AppElement.Background, AppElement.Content,
                (response) => {
                    resolve(response)
                });
        });
    }

    private checkUrlChange = async () => {
        const url = await this.getCurrentTabUrl();
        return (this.previousUrl !== url);
    }

    private checkIfPageIsSharePoint = async () => {
        const urlHasChanged = await this.checkUrlChange();
        if (urlHasChanged) {
            this.isSharePointPageVar = await this.isSharePointPage();
        }

        return this.isSharePointPageVar
    }

}