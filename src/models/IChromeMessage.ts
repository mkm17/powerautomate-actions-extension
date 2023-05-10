export enum AppElement {
    ReactApp,
    Content,
    Background
}

export enum ActionType {
    StartRecording,
    StopRecording,
    CopyAction,
    CheckSharePointPage,
    CheckPowerAutomatePage,
    ActionUpdated,
    DeleteAction,
    GetElementsFromMyClipboard,
    MyClipboardActionsUpdated,
    DeleteMyClipboardAction
}

export interface IDataChromeMessage {
    actionType: ActionType;
    message: any;
    callback?: (response: any) => void;
}

export interface ICommunicationChromeMessage  extends IDataChromeMessage{
    from: AppElement;
    to: AppElement;
}