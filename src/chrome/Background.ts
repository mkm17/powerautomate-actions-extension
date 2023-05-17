import { ActionsService, BackgroundService, ExtensionCommunicationService, StorageService } from "../services";

const storageService = new StorageService();
const actionsService = new ActionsService();
const communicationService = new ExtensionCommunicationService();

const backgroundService = new BackgroundService(storageService, communicationService, actionsService);

const main = async () => {

    chrome.runtime.onMessage.addListener(backgroundService.handleBackgroundAction);
    backgroundService.recordActions();
}

main();


