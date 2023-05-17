import { IActionModel } from "../models";
import { IStorageService } from "./interfaces";

export class StorageService implements IStorageService {
    private ACTIONS_KEY = "recordedActions";
    private MY_CLIPBOARD_ACTIONS_KEY = "myClipboardActions";
    private IS_RECORDING_KEY = "isRecordingActions";

    public async getActions(): Promise<IActionModel[]> {
        return await this.getActionsByKey(this.ACTIONS_KEY);
    }

    public setNewAction = async (action: IActionModel): Promise<IActionModel[]> => {
        const result = await this.getActions();
        return await this.setNewActionByKey(action, this.ACTIONS_KEY, result);
    }

    public deleteAction = async (action: IActionModel): Promise<IActionModel[]> => {
        const result = await this.getActions();
        return await this.deleteActionByKey(action, this.ACTIONS_KEY, result);
    }

    public clearActions = async () => {
        await chrome.storage.local.set({ [this.ACTIONS_KEY]: [] });
    }

    public async getMyClipboardActions(): Promise<IActionModel[]> {
        return await this.getActionsByKey(this.MY_CLIPBOARD_ACTIONS_KEY);
    }

    public async setNewMyClipboardAction(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getMyClipboardActions();
        return await this.setNewActionByKey(action, this.MY_CLIPBOARD_ACTIONS_KEY, result);
    }

    public async setNewMyClipboardActions(actions: IActionModel[]): Promise<IActionModel[]> {
        const result = await this.getMyClipboardActions();
        return await this.setNewActionsByKey(actions, this.MY_CLIPBOARD_ACTIONS_KEY, result)
    }

    public deleteMyClipboardAction = async (action: IActionModel): Promise<IActionModel[]> => {
        const result = await this.getMyClipboardActions();
        return await this.deleteActionByKey(action, this.MY_CLIPBOARD_ACTIONS_KEY, result);
    }

    public clearMyClipboardActions = async () => {
        await chrome.storage.local.set({ [this.MY_CLIPBOARD_ACTIONS_KEY]: [] });
    }

    public async getIsRecordingValue(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(this.IS_RECORDING_KEY, (result) => {
                    resolve(result[this.IS_RECORDING_KEY]);
                });
            }
            catch {
                reject(new Promise(() => { return false; }));
            }
        });
    }

    public setIsRecordingValue = async (isRecording: boolean) => {
        await chrome.storage.local.set({ [this.IS_RECORDING_KEY]: isRecording });
        return isRecording;
    }

    private async getActionsByKey(key: string): Promise<IActionModel[]> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(key, (result) => {
                    resolve(result[key])
                });

            }
            catch {
                reject(new Promise(() => { return []; }));
            }
        });
    }

    private async setNewActionByKey(action: IActionModel, key: string, oldActions: IActionModel[]): Promise<IActionModel[]> {
        const myArray = oldActions || [];
        myArray.push(action);
        await chrome.storage.local.set({ [key]: myArray });
        return myArray;
    }

    private async setNewActionsByKey(actions: IActionModel[], key: string, oldActions: IActionModel[]): Promise<IActionModel[]> {
        const myArray = oldActions || [];
        actions.forEach(action => {
            myArray.push(action);
        });
        await chrome.storage.local.set({ [key]: myArray });
        return myArray;
    }

    private deleteActionByKey = async (action: IActionModel, key: string, oldActions: IActionModel[]): Promise<IActionModel[]> => {
        const myArray = oldActions || [];
        const index = myArray.findIndex((a) => a.id === action.id);
        myArray.splice(index, 1);
        await chrome.storage.local.set({ [key]: myArray });
        return myArray;
    }
}