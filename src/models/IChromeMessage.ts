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
    SetCurrentCopiedActionFromStorageV3,
    SetCurrentCopiedActionV3,
    AddCopyListenerV3,
    MyCopiedActionsV3Updated,
    RemoveCurrentCopiedActionV3,
    DeleteMyCopiedActionV3,
    ClearCurrentCopiedActionV3
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