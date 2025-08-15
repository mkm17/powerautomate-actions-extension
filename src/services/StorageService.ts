import { IActionModel } from "../models";
import { IStorageService } from "./interfaces";

export class StorageService implements IStorageService {
    private RECORDED_ACTIONS_KEY = "recordedActions";
    private MY_CLIPBOARD_ACTIONS_KEY = "myClipboardActions";
    private IS_RECORDING_KEY = "isRecordingActions";
    private CURRENT_COPIED_ACTION_KEY = "currentCopiedActionV3";
    private COPIED_ACTIONS_V3_KEY = "copiedActionsV3";
    private FAVORITE_ACTIONS_KEY = "favoriteActions";

    public async getRecordedActions(): Promise<IActionModel[]> {
        return await this.getActionsByKey(this.RECORDED_ACTIONS_KEY);
    }

    public async addNewRecordedAction(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getRecordedActions();
        return await this.setNewActionByKey(action, this.RECORDED_ACTIONS_KEY, result);
    }

    public async deleteRecordedAction(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getRecordedActions();
        return await this.deleteActionByKey(action, this.RECORDED_ACTIONS_KEY, result);
    }

    public async clearRecordedActions() {
        await chrome.storage.local.set({ [this.RECORDED_ACTIONS_KEY]: [] });
    }

    public async getMyClipboardActions(): Promise<IActionModel[]> {
        return await this.getActionsByKey(this.MY_CLIPBOARD_ACTIONS_KEY);
    }

    public async addNewMyClipboardAction(action: IActionModel): Promise<IActionModel[]> {
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

    public async setCurrentCopiedActionV3(action: IActionModel): Promise<boolean> {
        try {
            await chrome.storage.local.set({ [this.CURRENT_COPIED_ACTION_KEY]: JSON.stringify(action) });
            return true;
        } catch {
            return false;

        }
    }

    public async getCurrentCopiedActionV3(): Promise<IActionModel> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(this.CURRENT_COPIED_ACTION_KEY, (result) => {
                    resolve(result[this.CURRENT_COPIED_ACTION_KEY])
                });

            }
            catch {
                reject(new Promise(() => { return null; }));
            }
        });
    }

    public async clearCurrentCopiedActionV3() {
        await chrome.storage.local.set({ [this.CURRENT_COPIED_ACTION_KEY]: null });
    }

    public async getCopiedActionsV3(): Promise<IActionModel[]> {
        return await this.getActionsByKey(this.COPIED_ACTIONS_V3_KEY);
    }

    public async setNewCopiedActionV3(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getCopiedActionsV3();
        return await this.setNewActionByKey(action, this.COPIED_ACTIONS_V3_KEY, result);
    }

    public async setNewCopiedActionsV3(actionToAdd: IActionModel, oldActions: IActionModel[]): Promise<IActionModel[]> {
        return await this.setNewActionByKey(actionToAdd, this.COPIED_ACTIONS_V3_KEY, oldActions);
    }

    public async deleteCopiedActionV3(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getCopiedActionsV3();
        return await this.deleteActionByKey(action, this.COPIED_ACTIONS_V3_KEY, result);
    }

    public async clearCopiedActionsV3() {
        await chrome.storage.local.set({ [this.COPIED_ACTIONS_V3_KEY]: [] });
    }

    public async getFavoriteActions(): Promise<IActionModel[]> {
        return await this.getActionsByKey(this.FAVORITE_ACTIONS_KEY) || [];;
    }

    public async addFavoriteAction(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getFavoriteActions();
        const existingIndex = result.findIndex(a => a.id === action.id);
        if (existingIndex === -1) {
            return await this.setNewActionByKey(action, this.FAVORITE_ACTIONS_KEY, result);
        }
        return result;
    }

    public async removeFavoriteAction(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getFavoriteActions();
        return await this.deleteActionByKey(action, this.FAVORITE_ACTIONS_KEY, result);
    }

    public async clearFavoriteActions(): Promise<void> {
        await chrome.storage.local.set({ [this.FAVORITE_ACTIONS_KEY]: [] });
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