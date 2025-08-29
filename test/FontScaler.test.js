import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    }
  }
};

// Mock document
global.document = {
  readyState: 'complete',
  documentElement: {
    style: {
      setProperty: vi.fn()
    }
  },
  addEventListener: vi.fn()
};

// Import FontScaler after mocking
const FontScalerModule = await import('../src/font-scaler.js');
const FontScaler = FontScalerModule.default || globalThis.FontScaler;

describe('[LinkedIn Job Analyzer] FontScaler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should have correct default values', () => {
      expect(FontScaler.STORAGE_KEY).toBe('fontScale');
      expect(FontScaler.DEFAULT_SCALE).toBe(100);
      expect(FontScaler.MIN_SCALE).toBe(50);
      expect(FontScaler.MAX_SCALE).toBe(200);
    });
  });

  describe('loadAndApply', () => {
    it('should load scale from storage and apply default when no stored value', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      
      const scale = await FontScaler.loadAndApply();
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('fontScale');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 1);
      expect(scale).toBe(100);
    });

    it('should load and apply stored scale value', async () => {
      chrome.storage.sync.get.mockResolvedValue({ fontScale: 150 });
      
      const scale = await FontScaler.loadAndApply();
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('fontScale');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 1.5);
      expect(scale).toBe(150);
    });

    it('should handle storage errors gracefully', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const scale = await FontScaler.loadAndApply();
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 1);
      expect(scale).toBe(100);
    });
  });

  describe('saveScale', () => {
    it('should save valid scale value', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      
      const result = await FontScaler.saveScale(120);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ fontScale: 120 });
      expect(result).toBe(120);
    });

    it('should clamp scale to minimum value', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      
      const result = await FontScaler.saveScale(30);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ fontScale: 50 });
      expect(result).toBe(50);
    });

    it('should clamp scale to maximum value', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      
      const result = await FontScaler.saveScale(300);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ fontScale: 200 });
      expect(result).toBe(200);
    });

    it('should handle storage errors', async () => {
      chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));
      
      await expect(FontScaler.saveScale(120)).rejects.toThrow('Storage error');
    });
  });

  describe('applyScale', () => {
    it('should apply scale to document root', () => {
      FontScaler.applyScale(150);
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 1.5);
    });

    it('should apply scale to custom document', () => {
      const mockDoc = {
        documentElement: {
          style: {
            setProperty: vi.fn()
          }
        }
      };
      
      FontScaler.applyScale(75, mockDoc);
      
      expect(mockDoc.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 0.75);
    });
  });

  describe('getCurrentScale', () => {
    it('should return stored scale value', async () => {
      chrome.storage.sync.get.mockResolvedValue({ fontScale: 125 });
      
      const scale = await FontScaler.getCurrentScale();
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('fontScale');
      expect(scale).toBe(125);
    });

    it('should return default scale when no stored value', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      
      const scale = await FontScaler.getCurrentScale();
      
      expect(scale).toBe(100);
    });

    it('should handle storage errors', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const scale = await FontScaler.getCurrentScale();
      
      expect(scale).toBe(100);
    });
  });

  describe('resetScale', () => {
    it('should reset scale to default value', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      
      const result = await FontScaler.resetScale();
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ fontScale: 100 });
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 1);
      expect(result).toBe(100);
    });
  });

  describe('applyToAllExtensionPages', () => {
    it('should save scale and send message to other pages', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      chrome.runtime.sendMessage.mockResolvedValue();
      
      await FontScaler.applyToAllExtensionPages(140);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ fontScale: 140 });
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 1.4);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'fontScaleChanged',
        scale: 140
      });
    });

    it('should handle message sending errors gracefully', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      chrome.runtime.sendMessage.mockRejectedValue(new Error('No listeners'));
      
      // Should not throw
      await expect(FontScaler.applyToAllExtensionPages(140)).resolves.toBeUndefined();
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ fontScale: 140 });
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', 1.4);
    });
  });
});