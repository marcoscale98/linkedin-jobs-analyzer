import { beforeEach, vi } from 'vitest';
import chrome from 'sinon-chrome';
import '@testing-library/jest-dom';

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
  chrome.flush();
  
  // Reset fetch mock
  vi.clearAllMocks();
  
  // Setup default Chrome API responses
  chrome.storage.sync.get.callsArgWith(1, {});
  chrome.storage.sync.set.callsArgWith(1);
  chrome.runtime.sendMessage.callsArgWith(1, { success: true });
  chrome.tabs.query.callsArgWith(1, [{ 
    id: 1, 
    url: 'https://linkedin.com/jobs/view/123456789',
    active: true 
  }]);
  chrome.tabs.sendMessage.callsArgWith(2, { success: true });
  
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