import { ICommunicationChromeMessage } from "../../models";

export interface IContentService {
    handleContentAction(message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender | null, sendResponse: (response?: any) => void): void;
    isSharePointPage(): boolean;
    isPowerAutomatePage(): boolean;
    getElementsFromMyClipboard(): Promise<void>;
    addCopyListener(): void;
}