import { PredefinedActionsService } from '../../services';
import { IActionModel } from '../../models';

describe('PredefinedActionsService', () => {
  let predefinedActionsService: PredefinedActionsService;

  beforeEach(() => {
    predefinedActionsService = new PredefinedActionsService();
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
      expect(result).toEqual(mockActions);
      expect(result.length).toBe(1);
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
      expect(result).toEqual(mockActions);
    });
  });

  describe('clearCache', () => {
    it('should clear cache without errors', async () => {
      await expect(predefinedActionsService.clearCache()).resolves.not.toThrow();
    });
  });
});
