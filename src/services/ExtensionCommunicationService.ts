import { AppElement, ICommunicationChromeMessage, IDataChromeMessage } from "../models";
import { IExtensionCommunicationService } from "./interfaces";

export class ExtensionCommunicationService implements IExtensionCommunicationService {

    public sendRequest(requestObject: IDataChromeMessage, sender: AppElement, receiver: AppElement, callback?: (response: any) => void) {
        const callbackCheck = callback ? callback : () => { };
        switch (receiver) {
            case AppElement.Content:
                this.sendRequestInTabsScript(requestObject, sender, receiver, callbackCheck);
                break;
            case AppElement.Background:
            case AppElement.ReactApp:
                this.sendRequestInRuntimeScript(requestObject, sender, receiver, callbackCheck)
                break;
        }
    }

    private sendRequestInTabsScript(request: IDataChromeMessage, sender: AppElement, receiver: AppElement, callback: (response: any) => void) {
        const communicationData: ICommunicationChromeMessage = {
            ...request,
            from: sender,
            to: receiver
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id!, communicationData, callback);
        });
    }

    private sendRequestInRuntimeScript(request: any, sender: AppElement, receiver: AppElement, callback: (response: any) => void) {
        const communicationData: ICommunicationChromeMessage = {
            ...request,
            from: sender,
            to: receiver
        }

        chrome.runtime.sendMessage(communicationData, callback);
    }

}