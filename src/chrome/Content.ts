import { ContentService, StorageService } from "../services";

const contentService = new ContentService();
const chromeService = new StorageService();

const main = () => {
    chrome.runtime.onMessage.addListener(contentService.handleContentAction);
    if (window.location.href.indexOf('michalkornet.com') > -1) {
        contentService.addCopyListener();
    }
    if(!contentService.isSharePointPage) {
        chromeService.setIsRecordingValue(false);
    }
}
main();
