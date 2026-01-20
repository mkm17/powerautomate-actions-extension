import { IActionModel } from "../models";
import { Constants } from "../constants/Constants";

export class PredefinedActionsService {
    private CACHE_DURATION_MS = 60 * 60 * 1000;
    private CACHE_KEY = "predefinedActionsCache";
    private CACHE_TIMESTAMP_KEY = "predefinedActionsCacheTimestamp";

    public async fetchPredefinedActions(url: string): Promise<IActionModel[]> {
        if (!url || url.trim() === '') {
            return [];
        }

        try {
            const cachedData = await this.getCachedActions();
            if (cachedData) {
                return cachedData;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid JSON structure: expected array of actions');
            }

            if (data.length === 0) {
                return [];
            }

            const normalizedData = this.normalizeActions(data, 'Custom');
            await this.cacheActions(normalizedData);
            return normalizedData;
        } catch (error) {
            console.error('Error fetching predefined actions:', error);
            const cachedData = await this.getCachedActionsIgnoreExpiry();
            return cachedData || [];
        }
    }

    public async refreshPredefinedActions(url: string): Promise<IActionModel[]> {
        await this.clearCache();
        return await this.fetchPredefinedActions(url);
    }

    private normalizeActions(actions: IActionModel[], defaultCategory?: string): IActionModel[] {
        return actions.map(action => ({
            ...action,
            isFavorite: false,
            isSelected: false,
            category: action.category ?? defaultCategory
        }));
    }

    private async getCachedActions(): Promise<IActionModel[] | null> {
        try {
            const result = await chrome.storage.local.get([this.CACHE_KEY, this.CACHE_TIMESTAMP_KEY]);
            const cachedActions = result[this.CACHE_KEY];
            const timestamp = result[this.CACHE_TIMESTAMP_KEY];

            if (!cachedActions || !timestamp) {
                return null;
            }

            const now = Date.now();
            if (now - timestamp > this.CACHE_DURATION_MS) {
                return null;
            }

            return cachedActions;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    private async getCachedActionsIgnoreExpiry(): Promise<IActionModel[] | null> {
        try {
            const result = await chrome.storage.local.get([this.CACHE_KEY]);
            return result[this.CACHE_KEY] || null;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    private async cacheActions(actions: IActionModel[]): Promise<void> {
        try {
            await chrome.storage.local.set({
                [this.CACHE_KEY]: actions,
                [this.CACHE_TIMESTAMP_KEY]: Date.now()
            });
        } catch (error) {
            console.error('Error caching actions:', error);
        }
    }

    public async clearCache(): Promise<void> {
        try {
            await chrome.storage.local.remove([this.CACHE_KEY, this.CACHE_TIMESTAMP_KEY]);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    public async fetchDefaultPredefinedActions(): Promise<IActionModel[]> {
        const allActions: IActionModel[] = [];

        try {
            const listResponse = await fetch(Constants.PredefinedActionsGitHubApiUrl);
            if (!listResponse.ok) {
                console.error(`Failed to fetch file list from GitHub: ${listResponse.status}`);
                return [];
            }

            const fileList = await listResponse.json();
            const jsonFiles = fileList
                .filter((file: any) => file.name.endsWith('.json') && file.type === 'file')
                .map((file: any) => file.name);

            for (const fileName of jsonFiles) {
                try {
                    const url = `${Constants.PredefinedActionsBaseUrl}/${fileName}`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        console.error(`Failed to load ${fileName} from GitHub: ${response.status}`);
                        continue;
                    }

                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const category = fileName.replace(/\.json$/i, '');
                        const normalized = this.normalizeActions(data, category);
                        allActions.push(...normalized);
                    }
                } catch (error) {
                    console.error(`Error loading ${fileName} from GitHub:`, error);
                }
            }
        } catch (error) {
            console.error('Error fetching default predefined actions:', error);
        }

        return allActions;
    }
}
