import { ContentService } from "../services";

const contentService = new ContentService();

const main = () => {
    chrome.runtime.onMessage.addListener(contentService.handleContentAction);
    if (window.location.href.indexOf('michalkornet.com') > -1) {
        contentService.addCopyListener();
    }
}
main();
