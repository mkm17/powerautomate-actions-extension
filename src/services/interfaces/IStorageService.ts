import { IActionModel } from "../../models";

export interface IStorageService {
    getActions(): Promise<IActionModel[]>;
    setNewAction(action: IActionModel): Promise<IActionModel[]>;
    deleteAction(action: IActionModel): Promise<IActionModel[]>;
    clearActions(): void;
    getMyClipboardActions(): Promise<IActionModel[]>;
    setNewMyClipboardAction(action: IActionModel): Promise<IActionModel[]>;
    setNewMyClipboardActions(actions: IActionModel[]): Promise<IActionModel[]>;
    deleteMyClipboardAction(action: IActionModel): Promise<IActionModel[]>
    clearMyClipboardActions(): Promise<void>
    getIsRecordingValue(): Promise<boolean>;
    setIsRecordingValue (isRecording: boolean): Promise<boolean>;
}