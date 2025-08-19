import { beforeEach, vi } from 'vitest';

// Create Chrome API mocks using Vitest
const createChromeAPIStub = () => ({
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn()
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  }
});

// Create global chrome mock
const chrome = createChromeAPIStub();

// Mock Chrome APIs globally
Object.defineProperty(global, 'chrome', {
  value: chrome,
  writable: true
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock console methods to avoid noise in tests
beforeEach(() => {
  // Reset all chrome API mocks
  chrome.storage.sync.get.mockClear();
  chrome.storage.sync.set.mockClear();
  chrome.runtime.sendMessage.mockClear();
  chrome.tabs.query.mockClear();
  chrome.tabs.sendMessage.mockClear();
  
  // Reset fetch mock
  vi.clearAllMocks();
  
  // Setup default Chrome API responses
  chrome.storage.sync.get.mockResolvedValue({});
  chrome.storage.sync.set.mockResolvedValue();
  chrome.runtime.sendMessage.mockResolvedValue({ success: true });
  chrome.tabs.query.mockResolvedValue([{ 
    id: 1, 
    url: 'https://linkedin.com/jobs/view/123456789',
    active: true 
  }]);
  chrome.tabs.sendMessage.mockResolvedValue({ success: true });
  
  // Suppress console.log in tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  }
});

// Disable Chrome warnings for testing
global.console.warn = vi.fn();

// Export chrome for use in individual tests
export { chrome };