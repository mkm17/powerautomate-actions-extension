import { IActionModel } from "../models";
import { Constants } from "../constants/Constants";

interface IGitHubFile {
    name: string;
    type: string;
    sha?: string;
    size?: number;
    url?: string;
    html_url?: string;
    git_url?: string;
    download_url?: string;
}

export class PredefinedActionsService {
    private CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
    private RATE_LIMIT_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (when rate limited)
    private CACHE_KEY = "predefinedActionsCache";
    private CACHE_TIMESTAMP_KEY = "predefinedActionsCacheTimestamp";
    private DEFAULT_CACHE_KEY = "defaultPredefinedActionsCache";
    private DEFAULT_CACHE_TIMESTAMP_KEY = "defaultPredefinedActionsCacheTimestamp";
    private RATE_LIMIT_STATE_KEY = "gitHubRateLimitState";
    private RATE_LIMIT_RESET_TIME_KEY = "gitHubRateLimitResetTime";

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

    public deduplicateActions(actions: IActionModel[]): IActionModel[] {
        const seen = new Set<string>();
        const result: IActionModel[] = [];
        
        // Keep first occurrence of each ID
        for (const action of actions) {
            if (!seen.has(action.id)) {
                seen.add(action.id);
                result.push(action);
            }
        }
        
        return result;
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
            await chrome.storage.local.remove([
                this.CACHE_KEY,
                this.CACHE_TIMESTAMP_KEY,
                this.DEFAULT_CACHE_KEY,
                this.DEFAULT_CACHE_TIMESTAMP_KEY
            ]);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    public async fetchDefaultPredefinedActions(): Promise<IActionModel[]> {
        try {
            const isRateLimited = await this.isGitHubRateLimited();
            if (isRateLimited) {
                console.warn('GitHub API rate limit detected. Using cached data.');
                const cachedData = await this.getCachedDefaultActionsIgnoreExpiry();
                return cachedData || [];
            }

            const cachedData = await this.getCachedDefaultActions();
            if (cachedData) {
                return cachedData;
            }

            let allActions: IActionModel[] = [];
            const listResponse = await fetch(Constants.PredefinedActionsGitHubApiUrl);
            
            if (!listResponse.ok) {
                if (listResponse.status === 403) {
                    console.error('GitHub API rate limit exceeded (403 Forbidden)');
                    await this.setGitHubRateLimited();
                } else {
                    console.error(`Failed to fetch file list from GitHub: ${listResponse.status}`);
                }
                const cachedDataIgnoreExpiry = await this.getCachedDefaultActionsIgnoreExpiry();
                return cachedDataIgnoreExpiry || [];
            }

            const fileList = await listResponse.json();
            const jsonFiles = fileList
                .filter((file: IGitHubFile) => file.name.endsWith('.json') && file.type === 'file')
                .map((file: IGitHubFile) => file.name);

            // Fetch all files concurrently using Promise.all for better performance
            const fetchPromises = jsonFiles.map(async (fileName: string) => {
                try {
                    const url = `${Constants.PredefinedActionsBaseUrl}/${fileName}`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        if (response.status === 403) {
                            console.error('GitHub API rate limit exceeded while fetching file (403 Forbidden)');
                            await this.setGitHubRateLimited();
                        } else {
                            console.error(`Failed to load ${fileName} from GitHub: ${response.status}`);
                        }
                        return [];
                    }

                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const category = fileName.replace(/\.json$/i, '');
                        return this.normalizeActions(data, category);
                    }
                    return [];
                } catch (error) {
                    console.error(`Error loading ${fileName} from GitHub:`, error);
                    return [];
                }
            });

            const results = await Promise.all(fetchPromises);
            allActions = results.flat();

            if (allActions.length > 0) {
                await this.cacheDefaultActions(allActions);
            }
            return allActions;
        } catch (error) {
            console.error('Error fetching default predefined actions:', error);
            const cachedData = await this.getCachedDefaultActionsIgnoreExpiry();
            return cachedData || [];
        }
    }

    private async getCachedDefaultActions(): Promise<IActionModel[] | null> {
        try {
            const result = await chrome.storage.local.get([
                this.DEFAULT_CACHE_KEY,
                this.DEFAULT_CACHE_TIMESTAMP_KEY
            ]);
            const cachedActions = result[this.DEFAULT_CACHE_KEY];
            const timestamp = result[this.DEFAULT_CACHE_TIMESTAMP_KEY];

            if (!cachedActions || !timestamp) {
                return null;
            }

            const now = Date.now();
            if (now - timestamp > this.CACHE_DURATION_MS) {
                return null;
            }

            return cachedActions;
        } catch (error) {
            console.error('Error reading default cache:', error);
            return null;
        }
    }

    private async getCachedDefaultActionsIgnoreExpiry(): Promise<IActionModel[] | null> {
        try {
            const result = await chrome.storage.local.get([this.DEFAULT_CACHE_KEY]);
            return result[this.DEFAULT_CACHE_KEY] || null;
        } catch (error) {
            console.error('Error reading default cache:', error);
            return null;
        }
    }

    private async cacheDefaultActions(actions: IActionModel[]): Promise<void> {
        try {
            await chrome.storage.local.set({
                [this.DEFAULT_CACHE_KEY]: actions,
                [this.DEFAULT_CACHE_TIMESTAMP_KEY]: Date.now()
            });
        } catch (error) {
            console.error('Error caching default actions:', error);
        }
    }

    private async isGitHubRateLimited(): Promise<boolean> {
        try {
            const result = await chrome.storage.local.get([this.RATE_LIMIT_RESET_TIME_KEY]);
            const resetTime = result[this.RATE_LIMIT_RESET_TIME_KEY];

            if (!resetTime) {
                return false;
            }

            const now = Date.now();
            if (now >= resetTime) {
                await chrome.storage.local.remove([this.RATE_LIMIT_STATE_KEY, this.RATE_LIMIT_RESET_TIME_KEY]);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking rate limit state:', error);
            return false;
        }
    }

    private async setGitHubRateLimited(): Promise<void> {
        try {
            const resetTime = Date.now() + this.RATE_LIMIT_CACHE_DURATION_MS;
            await chrome.storage.local.set({
                [this.RATE_LIMIT_STATE_KEY]: true,
                [this.RATE_LIMIT_RESET_TIME_KEY]: resetTime
            });
            console.warn(`GitHub rate limit set. Will retry after ${new Date(resetTime).toLocaleString()}`);
        } catch (error) {
            console.error('Error setting rate limit state:', error);
        }
    }

    public async getGitHubRateLimitStatus(): Promise<{ isRateLimited: boolean; resetTime?: number }> {
        try {
            const result = await chrome.storage.local.get([this.RATE_LIMIT_STATE_KEY, this.RATE_LIMIT_RESET_TIME_KEY]);
            const isRateLimited = result[this.RATE_LIMIT_STATE_KEY] === true;
            const resetTime = result[this.RATE_LIMIT_RESET_TIME_KEY];

            if (!isRateLimited || !resetTime) {
                return { isRateLimited: false };
            }

            const now = Date.now();
            if (now >= resetTime) {
                await chrome.storage.local.remove([this.RATE_LIMIT_STATE_KEY, this.RATE_LIMIT_RESET_TIME_KEY]);
                return { isRateLimited: false };
            }

            return { isRateLimited: true, resetTime };
        } catch (error) {
            console.error('Error getting rate limit status:', error);
            return { isRateLimited: false };
        }
    }
}
