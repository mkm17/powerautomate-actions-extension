import { BackgroundService } from "../services/BackgroundService";

const backgroundService = new BackgroundService();

const main = async () => {
    
    chrome.runtime.onMessage.addListener(backgroundService.handleBackgroundAction);
    backgroundService.recordActions();
}

main();


