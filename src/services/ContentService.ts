import { Constants } from "../constants/Constants";
import { ActionType, AppElement, IActionModel, ICommunicationChromeMessage, ICopiedActionV3Model } from "../models";
import { IActionBody } from "../models/NewEditorModels";
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
            case ActionType.CheckRecordingPage:
                sendResponse(this.isRecordingPage());
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
            case ActionType.CheckIsNewPowerAutomateEditorV3:
                sendResponse(this.isNewPowerAutomateEditor());
                break;
            case ActionType.SetSelectedActionsIntoClipboardV3:
                sendResponse(this.setSelectedActionsIntoClipboardV3(message));
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

    public isRecordingPage = (): boolean => {
        const spElement = document.getElementById(Constants.SharePointPageClass);
        const spElement2 = document.getElementById(Constants.SharePointPageClass2);
        const classicSpelement = document.getElementById(Constants.SharePointClassicPageClass);
        const isGraphExplorerUrl = window && window.location.href.indexOf(Constants.GraphExplorerUrl) > -1;
        const isSPAdminUrl = window && window.location.href.indexOf(Constants.SharePointAdminUrl) > -1;
        return !!spElement || !!spElement2 || !!classicSpelement || !!isGraphExplorerUrl || !!isSPAdminUrl;
    }

    public isPowerAutomatePage = (): boolean => {
        return window && window.location.href.indexOf(Constants.PowerAutomateUrl) > -1 || window.location.href.indexOf(Constants.PowerAppsUrl) > -1;
    }

    public isNewPowerAutomateEditor = (): boolean => {
        return document.getElementsByClassName(Constants.PowerAutomateNewEditorClassV3).length > 0;
    }

    public setSelectedActionsIntoClipboardV3 = (message: ICommunicationChromeMessage) => {
        const messageContent: IActionModel[] = message.message;
        if (!messageContent || messageContent.length === 0) {
            console.log('Incorrect message');
            return;
        }
        const itemToSave: IActionBody = {
            nodeId: 'Copy_Container',
            serializedOperation: {
                type: 'Scope',
                actions: {},
                runAfter: {},
                metadata: {
                    operationMetadataId: this.getGUID()
                }
            },
            allConnectionData: {},
            staticResults: {},
            isScopeNode: true,
            mslaNode: true
        }

        for (let action of messageContent) {
            const actionJson = JSON.parse(action.actionJson);
            itemToSave.serializedOperation.actions[action.title] = actionJson.operationDefinition;
            itemToSave.serializedOperation.actions[action.title].runAfter = {};
            if (actionJson.operationDefinition.inputs.host && actionJson.operationDefinition.inputs.host.connectionName) {
                itemToSave.serializedOperation.actions[action.title].inputs.host.connection = actionJson.operationDefinition.inputs.host.connectionName;
            }
        }

        return JSON.stringify(itemToSave);
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
                if (copiedTextElementClassName !== Constants.CopyTextareaClassName) { return; }

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

                this.storageService.addNewMyClipboardAction(newAction);
            } catch (e) {
                console.log('Cannot Copy the action');
            }
        });
    }

    public setCurrentCopiedAction = () => {
        const copiedActionSchemaString = window.localStorage.getItem(Constants.PowerAutomateLocalStorageKeyV3);
        if (!copiedActionSchemaString) { return; }

        const copiedActionSchema: ICopiedActionV3Model = JSON.parse(copiedActionSchemaString);

        const copiedAction: IActionModel = {
            actionJson: copiedActionSchemaString ? copiedActionSchemaString : '',
            id: this.generateUniqueId(),
            method: '',
            url: '',
            icon: copiedActionSchema?.nodeData?.operationMetadata?.iconUri,
            title: copiedActionSchema?.nodeData?.id
        }

        this.storageService.setCurrentCopiedActionV3(copiedAction);
        return copiedAction;
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

    private getGUID(): string {
        let d = new Date().getTime();
        const guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return guid;
    }
} 