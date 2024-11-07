import { IActionModel } from "../../models";

export interface IActionService {
    getCorrectAction(req: chrome.webRequest.WebRequestHeadersDetails, foundAction: chrome.webRequest.WebRequestBodyDetails | undefined): IActionModel | null;
}