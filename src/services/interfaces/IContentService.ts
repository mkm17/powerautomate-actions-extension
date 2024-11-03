import { ICommunicationChromeMessage } from "../../models";

export interface IContentService {
    handleContentAction(message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender | null, sendResponse: (response?: any) => void): void;
    isRecordingPage(): boolean;
    isPowerAutomatePage(): boolean;
    getElementsFromMyClipboard(): Promise<void>;
    addCopyListener(): void;
}