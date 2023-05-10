import { IActionModel } from "../models";

export class StorageService {
    private ACTIONS_KEY = "recordedActions";
    private MY_CLIPBOARD_ACTIONS_KEY = "myClipboardActions";
    private IS_RECORDING_KEY = "isRecordingActions";

    public async getActions(): Promise<IActionModel[]> {
        return new Promise((resolve) => {
            chrome.storage.local.get(this.ACTIONS_KEY, (result) => {
                resolve(result[this.ACTIONS_KEY])
            });
        });
    }

    public setNewAction = async (action: IActionModel): Promise<IActionModel[]> => {
        const result = await this.getActions();
        const myArray = result || [];
        myArray.push(action);
        await chrome.storage.local.set({ [this.ACTIONS_KEY]: myArray });
        return myArray;
    }

    public deleteAction = async (action: IActionModel): Promise<IActionModel[]> => {
        const result = await this.getActions();
        const myArray = result || [];
        const index = myArray.findIndex((a) => a.id === action.id);
        myArray.splice(index, 1);
        await chrome.storage.local.set({ [this.ACTIONS_KEY]: myArray });
        return myArray;
    }

    public clearActions = async () => {
        await chrome.storage.local.set({ [this.ACTIONS_KEY]: [] });
    }

    public async getMyClipboardActions(): Promise<IActionModel[]> {
        return new Promise((resolve) => {
            chrome.storage.local.get(this.MY_CLIPBOARD_ACTIONS_KEY, async (result) => {
                resolve(result[this.MY_CLIPBOARD_ACTIONS_KEY]);
            });
        });
    }

    public async setNewMyClipboardAction(action: IActionModel): Promise<IActionModel[]> {
        const result = await this.getMyClipboardActions();
        const myArray = result || [];
        myArray.push(action);
        await chrome.storage.local.set({ [this.MY_CLIPBOARD_ACTIONS_KEY]: myArray });
        return myArray;
    }
    
    public async setNewMyClipboardActions(actions: IActionModel[]): Promise<IActionModel[]> {
        const result = await this.getMyClipboardActions();
        const myArray = result || [];
        actions.forEach(action => {
            myArray.push(action);
        });
        await chrome.storage.local.set({ [this.MY_CLIPBOARD_ACTIONS_KEY]: myArray });
        return myArray;
    }

    public deleteMyClipboardAction = async (action: IActionModel): Promise<IActionModel[]> => {
        const result = await this.getMyClipboardActions();
        const myArray = result || [];
        const index = myArray.findIndex((a) => a.id === action.id);
        myArray.splice(index, 1);
        await chrome.storage.local.set({ [this.MY_CLIPBOARD_ACTIONS_KEY]: myArray });
        return myArray;
    }

    public clearMyClipboardActions = async () => {
        await chrome.storage.local.set({ [this.MY_CLIPBOARD_ACTIONS_KEY]: [] });
    }

    public async getIsRecordingValue(): Promise<boolean> {
        return new Promise((resolve) => {
            chrome.storage.local.get(this.IS_RECORDING_KEY, (result) => {
                resolve(result[this.IS_RECORDING_KEY]);
            });
        });
    }

    public setIsRecordingValue = async (isRecording: boolean) => {
        await chrome.storage.local.set({ [this.IS_RECORDING_KEY]: isRecording });
        return isRecording;
    }
}