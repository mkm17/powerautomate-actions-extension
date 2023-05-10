import { ExtensionCommunicationService, StorageService } from ".";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage } from "../models";

export class ContentService {
    private chromeService = new StorageService();
    private communicationService = new ExtensionCommunicationService();

    public handleContentAction = (message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        if (!this.isCorrectReceiver(message)) { console.log('Incorrect Content Action'); }
        switch (message.actionType) {
            case ActionType.CopyAction:
                this.copyListener(message);
                break;
            case ActionType.GetElementsFromMyClipboard:
                this.getElementsFromMyClipboard(message);
                break;
            case ActionType.CheckSharePointPage:
                sendResponse(this.isSharePointPage());
                break;
            case ActionType.CheckPowerAutomatePage:
                sendResponse(this.isPowerAutomatePage());
                break;
            default:
                console.log('Incorrect Action Type');
        }
    }

    private copyListener = (message: ICommunicationChromeMessage) => {
        const messageContent: IActionModel[] = message.message;
        if (!messageContent || messageContent.length === 0 /*|| typeof message.message !== IActionModel[] */) {
            console.log('Incorrect message');
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
        const element = document.getElementById('SPPageChrome');
        const element2 = document.getElementById('spoAppComponent');
        return !!element || !!element2;
    }

    public isPowerAutomatePage = (): boolean => {
        return window && window.location.href.indexOf('make.powerautomate.com') > -1;
    }

    private isCorrectReceiver = (message: ICommunicationChromeMessage) => {
        return message.to === AppElement.Content;
    }

    public getElementsFromMyClipboard = async (message: ICommunicationChromeMessage) => {
        const elements = document.getElementsByClassName('fl-MyClipboardRecommendationItem');
        const clipBoardActions: IActionModel[] = [];
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i]
            if (!element) { continue; }
            const name = element.getElementsByClassName('fl-MyClipboardRecommendationItem-copy')[0].getElementsByTagName('h3')[0].innerText;
            const icon = element.getElementsByClassName('fl-MyClipboardRecommendationItem-icon')[0].getElementsByTagName('img')[0].src;
            const actionJson = `{
                "id": "a9abf920-e736-4b15-ae5e-463c366da02b",
                "brandColor": "#007ee5",
                "icon": "${icon}",
                "isTrigger": false,
                "operationName": "${name}",
                "operationDefinition": ${element?.querySelector("[id^='fl-IconButton-tooltip']")?.innerHTML} 
            }`;
            const newAction: IActionModel = {
                actionJson: actionJson ? actionJson : '',
                id: this.generateUniqueId(),
                method: '',
                url: '',
                title: name,
                icon: icon,
                isSPAction: false,
            }
            clipBoardActions.push(newAction);

        }

        const actions = await this.chromeService.setNewMyClipboardActions(clipBoardActions);
        this.communicationService.sendRequest(
            { actionType: ActionType.MyClipboardActionsUpdated, message: actions },
            AppElement.Content,
            AppElement.ReactApp);

    }

    public addCopyListener = () => {
        document.addEventListener('copy', (event) => {
            const copiedText = (event?.srcElement as any)['value'];
            const jsonData = JSON.parse(copiedText);

            const newAction: IActionModel = {
                actionJson: copiedText ? copiedText : '',
                id: this.generateUniqueId(),
                method: '',
                url: '',
                icon: jsonData.icon,
                title: jsonData.operationName,
                isSPAction: false,
            }

            this.chromeService.setNewMyClipboardAction(newAction);
        });
    }


    private generateUniqueId() {
        const timestamp = Date.now().toString(16);
        const randomNum = Math.floor(Math.random() * 1000000).toString(16);
        return `${timestamp}-${randomNum}`;
    }
} 