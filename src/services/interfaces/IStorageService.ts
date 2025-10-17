import { IActionModel, ISettingsModel } from "../../models";

export interface IStorageService {
    getRecordedActions(): Promise<IActionModel[]>;
    addNewRecordedAction(action: IActionModel): Promise<IActionModel[]>;
    deleteRecordedAction(action: IActionModel): Promise<IActionModel[]>;
    clearRecordedActions(): void;
    getMyClipboardActions(): Promise<IActionModel[]>;
    addNewMyClipboardAction(action: IActionModel): Promise<IActionModel[]>;
    setNewMyClipboardActions(actions: IActionModel[]): Promise<IActionModel[]>;
    deleteMyClipboardAction(action: IActionModel): Promise<IActionModel[]>
    clearMyClipboardActions(): Promise<void>
    getIsRecordingValue(): Promise<boolean>;
    setIsRecordingValue(isRecording: boolean): Promise<boolean>;

    setCurrentCopiedActionV3(action?: IActionModel): Promise<boolean>;
    getCurrentCopiedActionV3(): Promise<IActionModel>;
    clearCurrentCopiedActionV3(): Promise<void>;

    getCopiedActionsV3(): Promise<IActionModel[]>;
    setNewCopiedActionV3(action: IActionModel): Promise<IActionModel[]>;
    setNewCopiedActionsV3(actionToAdd: IActionModel, oldActions: IActionModel[]): Promise<IActionModel[]>;
    deleteCopiedActionV3(action: IActionModel): Promise<IActionModel[]>;
    clearCopiedActionsV3(): Promise<void>;

    getFavoriteActions(): Promise<IActionModel[]>;
    addFavoriteAction(action: IActionModel): Promise<IActionModel[]>;
    removeFavoriteAction(action: IActionModel): Promise<IActionModel[]>;
    clearFavoriteActions(): Promise<void>;
    
    getSettings(): Promise<ISettingsModel>;
    updateSettings(partialSettings: Partial<ISettingsModel>): Promise<ISettingsModel>;
    resetSettings(): Promise<ISettingsModel>;
}