import { AppElement, IDataChromeMessage } from "../../models";

export interface IExtensionCommunicationService {
    sendRequest(requestObject: IDataChromeMessage, sender: AppElement, receiver: AppElement, callback?: (response: any) => void): void
}