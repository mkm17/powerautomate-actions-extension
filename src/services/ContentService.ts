import { Constants } from "../constants/Constants";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage } from "../models";
import { IStorageService, IExtensionCommunicationService, IContentService } from "./interfaces";

export class ContentService implements IContentService {
    constructor(private storageService: IStorageService, private communicationService: IExtensionCommunicationService) {
    }

    public handleContentAction = (message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender | null, sendResponse: (response?: any) => void) => {
        if (!this.isCorrectReceiver(message)) { console.log('Incorrect Content Action'); }
        switch (message.actionType) {
            case ActionType.CopyAction:
                this.copyListener(message);
                break;
            case ActionType.GetElementsFromMyClipboard:
                this.getElementsFromMyClipboard();
                break;
            case ActionType.CheckSharePointPage:
                sendResponse(this.isSharePointPage());
                break;
            case ActionType.CheckPowerAutomatePage:
                sendResponse(this.isPowerAutomatePage());
                break;
            case ActionType.CheckIfPageHasActionsToCopy:
                sendResponse(this.hasActionsToCopy());
                break;
            case ActionType.CopyAllActionsFromPage:
                sendResponse(this.copyAllActionsFromPage());
                break;
            default:
                console.log('Incorrect Action Type');
        }
    }

    private copyListener = (message: ICommunicationChromeMessage) => {
        const messageContent: IActionModel[] = message.message;
        if (!messageContent || messageContent.length === 0) {
            console.log('Incorrect message');
            return;
        }

        for (let action of messageContent) {
            this.copyText(action.actionJson);
            document.execCommand('paste');
        }
    }

    private copyText = (textToCopy: string) => {
        var tempTextarea = document.createElement("textarea");
        tempTextarea.value = textToCopy;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextarea);
    }

    public isSharePointPage = (): boolean => {
        const element = document.getElementById(Constants.SharePointPageClass);
        const element2 = document.getElementById(Constants.SharePointPageClass2);
        return !!element || !!element2;
    }

    public isPowerAutomatePage = (): boolean => {
        return window && window.location.href.indexOf(Constants.PowerAutomateUrl) > -1;
    }

    private isCorrectReceiver = (message: ICommunicationChromeMessage) => {
        return message.to === AppElement.Content;
    }

    private hasActionsToCopy = (): boolean => {
        const elements = document.getElementsByClassName(Constants.BlogActionClass);
        return elements && elements.length > 0;
    }

    private copyAllActionsFromPage = async () => {
        try {
            const elements = document.getElementsByClassName(Constants.BlogActionClass);

            const newActions = Array.from(elements).map((element: any) => {
                const actionJsonText = element.innerText;
                const actionJson = JSON.parse(actionJsonText);
                const newAction: IActionModel = {
                    actionJson: actionJsonText ? actionJsonText : '',
                    id: this.generateUniqueId(),
                    method: '',
                    url: '',
                    icon: actionJson.icon,
                    title: actionJson.operationName
                }
                return newAction;
            });
            const actions = await this.storageService.setNewMyClipboardActions(newActions);
            this.communicationService.sendRequest(
                { actionType: ActionType.MyClipboardActionsUpdated, message: actions },
                AppElement.Content,
                AppElement.ReactApp);
        } catch (e) {
            console.log('Cannot Copy the actions from the page');
        }
    }

    public getElementsFromMyClipboard = async () => {
        const elements = document.getElementsByClassName(Constants.MyClipboardItemClass);
        const clipBoardActions: IActionModel[] = [];

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i]
            if (!element) { continue; }
            const name = element.getElementsByClassName(Constants.MyClipboardItemNameClass)[0].getElementsByTagName('h3')[0].innerText;
            const icon = element.getElementsByClassName(Constants.MyClipboardItemIconClass)[0].getElementsByTagName('img')[0].src;
            const operationDefinition = element?.querySelector(`[id^='${Constants.MyClipboardItemDetailsId}']`)?.innerHTML;

            if (!this.isCorrectJSON(operationDefinition)) { continue; }

            const actionJson = `{
                "id": "a9abf920-e736-4b15-ae5e-463c366da02b",
                "brandColor": "#007ee5",
                "icon": "${icon}",
                "isTrigger": false,
                "operationName": "${name}",
                "operationDefinition": ${element?.querySelector(`[id^='${Constants.MyClipboardItemDetailsId}']`)?.innerHTML} 
            }`;
            const newAction: IActionModel = {
                actionJson: actionJson ? actionJson : '',
                id: this.generateUniqueId(),
                method: '',
                url: '',
                title: name,
                icon: icon
            }
            clipBoardActions.push(newAction);

        }

        if (clipBoardActions.length === 0) { return; }

        const actions = await this.storageService.setNewMyClipboardActions(clipBoardActions);
        this.communicationService.sendRequest(
            { actionType: ActionType.MyClipboardActionsUpdated, message: actions },
            AppElement.Content,
            AppElement.ReactApp);

    }

    public addCopyListener = () => {
        document.addEventListener('copy', (event) => {
            try {
                const copiedTextElementClassName = (event?.srcElement as any)['className'];
                if(copiedTextElementClassName !== Constants.CopyTextareaClassName) { return; }

                const copiedText = (event?.srcElement as any)['value'];
                
                if (!this.isCorrectJSON(copiedText)) { return; }

                const jsonData = JSON.parse(copiedText);

                const newAction: IActionModel = {
                    actionJson: copiedText ? copiedText : '',
                    id: this.generateUniqueId(),
                    method: '',
                    url: '',
                    icon: jsonData.icon,
                    title: jsonData.operationName
                }

                this.storageService.setNewMyClipboardAction(newAction);
            } catch (e) {
                console.log('Cannot Copy the action');
            }
        });
    }


    private generateUniqueId() {
        const timestamp = Date.now().toString(16);
        const randomNum = Math.floor(Math.random() * 1000000).toString(16);
        return `${timestamp}-${randomNum}`;
    }

    private isCorrectJSON = (json: string | undefined) => {
        if (!json) { return false; }
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }
} 