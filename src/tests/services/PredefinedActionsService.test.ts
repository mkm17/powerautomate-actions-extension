import { PredefinedActionsService } from '../../services';
import { IActionModel } from '../../models';

describe('PredefinedActionsService', () => {
  let predefinedActionsService: PredefinedActionsService;
  let chromeStorageMock: { [key: string]: any };

  beforeEach(() => {
    predefinedActionsService = new PredefinedActionsService();
    chromeStorageMock = {};

    // Mock chrome.storage.local
    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback?: any) => {
            if (typeof callback === 'function') {
              const result = typeof keys === 'string' ? { [keys]: chromeStorageMock[keys] } : keys.reduce((acc: any, key: string) => {
                acc[key] = chromeStorageMock[key];
                return acc;
              }, {});
              callback(result);
            } else {
              const result = typeof keys === 'string' ? { [keys]: chromeStorageMock[keys] } : keys.reduce((acc: any, key: string) => {
                acc[key] = chromeStorageMock[key];
                return acc;
              }, {});
              return Promise.resolve(result);
            }
          }),
          set: jest.fn((obj, callback?: any) => {
            Object.assign(chromeStorageMock, obj);
            if (typeof callback === 'function') {
              callback();
            } else {
              return Promise.resolve();
            }
          }),
          remove: jest.fn((keys, callback?: any) => {
            const keysArray = typeof keys === 'string' ? [keys] : keys;
            keysArray.forEach((key: string) => {
              delete chromeStorageMock[key];
            });
            if (typeof callback === 'function') {
              callback();
            } else {
              return Promise.resolve();
            }
          })
        }
      }
    };
  });

  describe('fetchPredefinedActions', () => {
    it('should return empty array for empty URL', async () => {
      const result = await predefinedActionsService.fetchPredefinedActions('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null URL', async () => {
      const result = await predefinedActionsService.fetchPredefinedActions(null as any);
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'structure' })
        } as Response)
      );

      const result = await predefinedActionsService.fetchPredefinedActions('https://example.com/actions.json');
      expect(result).toEqual([]);
    });

    it('should handle network error and return cached data', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const result = await predefinedActionsService.fetchPredefinedActions('https://example.com/actions.json');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should parse valid array of actions', async () => {
      const mockActions: IActionModel[] = [
        {
          id: '1',
          title: 'Test Action',
          url: 'https://api.example.com/test',
          method: 'GET',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockActions)
        } as Response)
      );

      const result = await predefinedActionsService.fetchPredefinedActions('https://example.com/actions.json');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Test Action');
      expect(result[0].category).toBe('Custom');
      expect(result[0].isFavorite).toBe(false);
      expect(result[0].isSelected).toBe(false);
    });

    it('should handle HTTP error response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response)
      );

      const result = await predefinedActionsService.fetchPredefinedActions('https://example.com/actions.json');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('refreshPredefinedActions', () => {
    it('should clear cache and fetch fresh data', async () => {
      const mockActions: IActionModel[] = [
        {
          id: '1',
          title: 'Refreshed Action',
          url: 'https://api.example.com/refreshed',
          method: 'POST',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockActions)
        } as Response)
      );

      const result = await predefinedActionsService.refreshPredefinedActions('https://example.com/actions.json');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Refreshed Action');
      expect(result[0].category).toBe('Custom');
    });
  });

  describe('clearCache', () => {
    it('should clear cache without errors', async () => {
      await expect(predefinedActionsService.clearCache()).resolves.not.toThrow();
    });
  });

  describe('deduplicateActions', () => {
    it('should remove duplicate actions by ID, keeping first occurrence', () => {
      const actions = [
        { id: '1', title: 'Action 1 Custom', url: 'https://example.com', method: 'GET', body: null, icon: 'icon1.png', actionJson: '{}', isSelected: false, category: 'Custom' },
        { id: '2', title: 'Action 2', url: 'https://example.com', method: 'GET', body: null, icon: 'icon2.png', actionJson: '{}', isSelected: false, category: 'Default' },
        { id: '1', title: 'Action 1 Default', url: 'https://example.com', method: 'GET', body: null, icon: 'icon1.png', actionJson: '{}', isSelected: false, category: 'Default' },
        { id: '3', title: 'Action 3', url: 'https://example.com', method: 'GET', body: null, icon: 'icon3.png', actionJson: '{}', isSelected: false, category: 'Default' }
      ];

      const result = predefinedActionsService.deduplicateActions(actions);

      expect(result.length).toBe(3);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Action 1 Custom'); // First occurrence kept
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('should handle empty array', () => {
      const result = predefinedActionsService.deduplicateActions([]);
      expect(result.length).toBe(0);
    });

    it('should return same array when no duplicates exist', () => {
      const actions = [
        { id: '1', title: 'Action 1', url: 'https://example.com', method: 'GET', body: null, icon: 'icon1.png', actionJson: '{}', isSelected: false, category: 'Default' },
        { id: '2', title: 'Action 2', url: 'https://example.com', method: 'GET', body: null, icon: 'icon2.png', actionJson: '{}', isSelected: false, category: 'Default' }
      ];

      const result = predefinedActionsService.deduplicateActions(actions);

      expect(result.length).toBe(2);
      expect(result).toEqual(actions);
    });

    it('should handle multiple duplicates of same ID', () => {
      const actions = [
        { id: '1', title: 'Action 1 - First', url: 'https://example.com', method: 'GET', body: null, icon: 'icon1.png', actionJson: '{}', isSelected: false, category: 'Custom' },
        { id: '1', title: 'Action 1 - Second', url: 'https://example.com', method: 'GET', body: null, icon: 'icon1.png', actionJson: '{}', isSelected: false, category: 'Default' },
        { id: '1', title: 'Action 1 - Third', url: 'https://example.com', method: 'GET', body: null, icon: 'icon1.png', actionJson: '{}', isSelected: false, category: 'Default' }
      ];

      const result = predefinedActionsService.deduplicateActions(actions);

      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Action 1 - First');
    });
  });

  describe('fetchDefaultPredefinedActions', () => {
    const mockGitHubApiUrl = 'https://api.github.com/repos/owner/repo/contents/path';
    const mockRawBaseUrl = 'https://raw.githubusercontent.com/owner/repo/main/path';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch and parse multiple JSON files from GitHub', async () => {
      const mockFileList = [
        { name: 'sharepoint.json', type: 'file' },
        { name: 'teams.json', type: 'file' },
        { name: 'msgraph.json', type: 'file' }
      ];

      const mockSharePointActions: IActionModel[] = [
        {
          id: '1',
          title: 'SharePoint Action',
          url: 'https://api.example.com/sp',
          method: 'GET',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      const mockTeamsActions: IActionModel[] = [
        {
          id: '2',
          title: 'Teams Action',
          url: 'https://api.example.com/teams',
          method: 'POST',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('sharepoint.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSharePointActions)
          } as Response);
        }
        if (url.includes('teams.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTeamsActions)
          } as Response);
        }
        if (url.includes('msgraph.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result.length).toBe(2);
      expect(result[0].category).toBe('sharepoint');
      expect(result[1].category).toBe('teams');
    });

    it('should handle empty file list from GitHub', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response)
      );

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result).toEqual([]);
    });

    it('should filter out non-JSON files', async () => {
      const mockFileList = [
        { name: 'actions.json', type: 'file' },
        { name: 'README.md', type: 'file' },
        { name: 'folder', type: 'dir' },
        { name: 'config.txt', type: 'file' }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('actions.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              {
                id: '1',
                title: 'Action',
                url: 'https://api.example.com/action',
                method: 'GET',
                body: null,
                icon: 'https://example.com/icon.png',
                actionJson: '{}',
                isSelected: false
              }
            ])
          } as Response);
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result.length).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle failed file list fetch from GitHub', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response)
      );

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result).toEqual([]);
    });

    it('should continue fetching other files when one file fetch fails', async () => {
      const mockFileList = [
        { name: 'success.json', type: 'file' },
        { name: 'fail.json', type: 'file' },
        { name: 'success2.json', type: 'file' }
      ];

      const mockSuccessActions: IActionModel[] = [
        {
          id: '1',
          title: 'Success Action',
          url: 'https://api.example.com/success',
          method: 'GET',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('fail.json')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          } as Response);
        }
        if (url.includes('success.json') || url.includes('success2.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSuccessActions)
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result.length).toBe(2);
      expect(result.every(action => action.category === 'success' || action.category === 'success2')).toBe(true);
    });

    it('should handle invalid JSON in a file and continue with others', async () => {
      const mockFileList = [
        { name: 'valid.json', type: 'file' },
        { name: 'error.json', type: 'file' }
      ];

      const mockValidActions: IActionModel[] = [
        {
          id: '1',
          title: 'Valid Action',
          url: 'https://api.example.com/valid',
          method: 'GET',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('valid.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockValidActions)
          } as Response);
        }
        if (url.includes('error.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.reject(new Error('Malformed JSON'))
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
      expect(result[0].category).toBe('valid');
    });

    it('should normalize actions with correct category from filename', async () => {
      const mockFileList = [
        { name: 'sharepoint-common.json', type: 'file' }
      ];

      const mockActions: IActionModel[] = [
        {
          id: '1',
          title: 'Action',
          url: 'https://api.example.com/action',
          method: 'GET',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false,
          isFavorite: true
        }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('sharepoint-common.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockActions)
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('sharepoint-common');
      expect(result[0].isFavorite).toBe(false);
      expect(result[0].isSelected).toBe(false);
    });

    it('should handle network error during file list fetch', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result).toEqual([]);
    });

    it('should accumulate actions from multiple files', async () => {
      const mockFileList = [
        { name: 'file1.json', type: 'file' },
        { name: 'file2.json', type: 'file' },
        { name: 'file3.json', type: 'file' }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        const fileNum = url.match(/file(\d+)/)?.[1];
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: fileNum,
                title: `Action from file ${fileNum}`,
                url: `https://api.example.com/file${fileNum}`,
                method: 'GET',
                body: null,
                icon: 'https://example.com/icon.png',
                actionJson: '{}',
                isSelected: false
              }
            ])
        } as Response);
      });

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('should return empty array when all files return empty arrays', async () => {
      const mockFileList = [
        { name: 'empty1.json', type: 'file' },
        { name: 'empty2.json', type: 'file' }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response);
      });

      const result = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result).toEqual([]);
    });

    it('should cache default actions after successful fetch', async () => {
      const mockFileList = [
        { name: 'cached.json', type: 'file' }
      ];

      const mockActions: IActionModel[] = [
        {
          id: '1',
          title: 'Cached Action',
          url: 'https://api.example.com/cached',
          method: 'GET',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('cached.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockActions)
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result1 = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result1.length).toBe(1);
      expect((global as any).fetch).toHaveBeenCalledTimes(2);

      // Second call should use cache
      (global as any).fetch.mockClear();
      const result2 = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result2.length).toBe(1);
      expect(result2[0].id).toBe('1');
      expect((global as any).fetch).not.toHaveBeenCalled();
    });

    it('should return cached data when GitHub file list fetch fails', async () => {
      const mockFileList = [
        { name: 'action.json', type: 'file' }
      ];

      const mockActions: IActionModel[] = [
        {
          id: '1',
          title: 'Action',
          url: 'https://api.example.com/action',
          method: 'GET',
          body: null,
          icon: 'https://example.com/icon.png',
          actionJson: '{}',
          isSelected: false
        }
      ];

      // First successful fetch to populate cache
      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('action.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockActions)
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result1 = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result1.length).toBe(1);

      // Second call with failed GitHub API, should return cached data
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Server Error'
        } as Response)
      );

      const result2 = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result2.length).toBe(1);
      expect(result2[0].id).toBe('1');
    });

    it('should detect and handle GitHub API rate limit (403)', async () => {
      const mockFileList = [
        { name: 'action.json', type: 'file' }
      ];
      const mockAction = { id: '1', title: 'Action', url: 'https://api.example.com', method: 'GET', body: null, icon: 'https://example.com/icon.png', actionJson: '{}', isSelected: false };

      // First call succeeds and caches data
      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockFileList)
          } as Response);
        }
        if (url.includes('action.json')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([mockAction])
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result1 = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result1.length).toBe(1);

      // Clear the cache so second call will try to fetch
      (chromeStorageMock as any)['defaultPredefinedActionsCache'] = undefined;
      (chromeStorageMock as any)['defaultPredefinedActionsCacheTimestamp'] = undefined;

      // Second call gets rate limited (403) on the file list endpoint
      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          // Return 403 for the file list
          return Promise.resolve({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            json: () => Promise.reject(new Error('Cannot parse 403 response'))
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      // When rate limited, should return stale cached data (from first call)
      // We need to preserve the stale cache for fallback
      (chromeStorageMock as any)['defaultPredefinedActionsCache'] = result1;
      
      const result2 = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result2.length).toBe(1);
      expect(result2[0].id).toBe('1');
      
      // Verify that rate limit was set by checking the mock storage directly
      expect((chromeStorageMock as any)['gitHubRateLimitState']).toBe(true);
      expect((chromeStorageMock as any)['gitHubRateLimitResetTime']).toBeDefined();
      expect((chromeStorageMock as any)['gitHubRateLimitResetTime']).toBeGreaterThan(Date.now());
    });

    it('should bypass GitHub API when rate limited and return cached data', async () => {
      const mockFileList = [{ name: 'action.json', type: 'file' }];
      const mockAction = { id: '1', title: 'Action', url: 'https://api.example.com', method: 'GET', body: null, icon: 'https://example.com/icon.png', actionJson: '{}', isSelected: false };

      // First successful fetch
      global.fetch = jest.fn((url: any) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockFileList) } as Response);
        }
        if (url.includes('action.json')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([mockAction]) } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result1 = await predefinedActionsService.fetchDefaultPredefinedActions();
      expect(result1.length).toBe(1);

      // Mark as rate limited manually
      (chromeStorageMock as any)['gitHubRateLimitState'] = true;
      (chromeStorageMock as any)['gitHubRateLimitResetTime'] = Date.now() + 24 * 60 * 60 * 1000;

      // Third call should use cache without calling fetch
      (global as any).fetch.mockClear();
      const result3 = await predefinedActionsService.fetchDefaultPredefinedActions();
      
      expect(result3.length).toBe(1);
      expect(result3[0].id).toBe('1');
      expect((global as any).fetch).not.toHaveBeenCalled();
    });

    it('should clear rate limit status when reset time is reached', async () => {
      // Set rate limit to past time
      (chromeStorageMock as any)['gitHubRateLimitState'] = true;
      (chromeStorageMock as any)['gitHubRateLimitResetTime'] = Date.now() - 1000;

      const status = await predefinedActionsService.getGitHubRateLimitStatus();
      expect(status.isRateLimited).toBe(false);

      // Verify cache was cleared
      expect((chromeStorageMock as any)['gitHubRateLimitState']).toBeUndefined();
      expect((chromeStorageMock as any)['gitHubRateLimitResetTime']).toBeUndefined();
    });
  });
});