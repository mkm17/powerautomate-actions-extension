export interface IActionService {
    getHttpSharePointActionTemplate(method: string, requestUrl: string, headers: chrome.webRequest.HttpHeader[], name: string, requestBody: any): string;
    getHttpRequestActionTemplate(method: string, requestUrl: string, headers: chrome.webRequest.HttpHeader[], name: string, requestBody: any): string;
    getTitleFromUrl(url: string): string;
}