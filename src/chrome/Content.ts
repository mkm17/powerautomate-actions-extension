import { ContentService, ExtensionCommunicationService, StorageService } from "../services";

const storageService = new StorageService();
const communicationService = new ExtensionCommunicationService();

const contentService = new ContentService(storageService, communicationService);

const main = () => {
    chrome.runtime.onMessage.addListener(contentService.handleContentAction);
    contentService.addCopyListener();
    if (!contentService.isRecordingPage()) {
        storageService.setIsRecordingValue(false);
    }

    if(contentService.isPowerAutomatePage()) {
        contentService.addCopyActionOnPowerAutomateEditorV3Listener();
    }
}

main();
