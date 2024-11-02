import { ICommunicationChromeMessage } from "../../models";

export interface IBackgroundService {
    handleBackgroundAction(message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): void;
    recordActions(): void;
    getCurrentTabUrl(): Promise<string>;
    isRecordingPage(): Promise<boolean>;
}