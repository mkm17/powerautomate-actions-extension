import { IActionModel, Mode } from ".";

export interface IInitialState {
    isRecording: boolean;
    isPowerAutomatePage: boolean;
    isRecordingPage: boolean;
    hasActionsOnPageToCopy: boolean;
    actions: IActionModel[];
    myClipboardActions: IActionModel[];
    currentMode: Mode;
    myCopiedActionsV3: IActionModel[];
    favoriteActions: IActionModel[];
}