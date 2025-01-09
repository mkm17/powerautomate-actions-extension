export enum AppElement {
    ReactApp,
    Content,
    Background
}

export enum ActionType {
    StartRecording,
    StopRecording,
    CopyAction,
    CheckRecordingPage,
    CheckPowerAutomatePage,
    ActionUpdated,
    DeleteAction,
    GetElementsFromMyClipboard,
    MyClipboardActionsUpdated,
    DeleteMyClipboardAction,
    CheckIfPageHasActionsToCopy,
    CopyAllActionsFromPage,
    
    CheckIsNewPowerAutomateEditorV3,
    SetSelectedActionsIntoClipboardV3,
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