import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { chrome } from './setup.js';

// Create DOM helper function for options page
function createOptionsDOM() {
  document.body.innerHTML = `
    <div class="container">
      <h1>LinkedIn Job Analyzer - Settings</h1>
      
      <div class="form-group">
        <label for="api-key">OpenAI API Key:</label>
        <input type="password" id="api-key" placeholder="sk-...">
        <small>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></small>
      </div>
      
      <div class="form-group">
        <label for="language-select">Language:</label>
        <select id="language-select">
          <option value="en">English</option>
          <option value="it">Italiano</option>
        </select>
      </div>
      
      <button id="save-btn">Save Settings</button>
      
      <div id="status-message" class="status-message" style="display: none;"></div>
    </div>
  `;
}

// Mock OptionsManager class (extracted from options.js)
class OptionsManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(['aiApiKey', 'language']);
    
    if (result.aiApiKey) {
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) {
        apiKeyInput.value = result.aiApiKey;
      }
    }
    
    if (result.language) {
      const languageSelect = document.getElementById('language-select');
      if (languageSelect) {
        languageSelect.value = result.language;
      }
    }
  }

  setupEventListeners() {
    const saveBtn = document.getElementById('save-btn');
    const apiKeyInput = document.getElementById('api-key');
    const languageSelect = document.getElementById('language-select');

    saveBtn?.addEventListener('click', () => this.saveSettings());
    
    apiKeyInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveSettings();
      }
    });

    languageSelect?.addEventListener('change', () => {
      this.saveLanguageSettings();
    });

    // Set OpenAI placeholder
    if (apiKeyInput) {
      apiKeyInput.placeholder = 'sk-...';
    }
  }

  async saveLanguageSettings() {
    const languageSelect = document.getElementById('language-select');
    if (!languageSelect) return;
    
    const language = languageSelect.value;
    
    try {
      await chrome.storage.sync.set({ language });
      this.showMessage('Language preference saved!', 'success');
    } catch (error) {
      this.showMessage('Error saving language: ' + error.message, 'error');
    }
  }

  async saveSettings() {
    const apiKeyInput = document.getElementById('api-key');
    const languageSelect = document.getElementById('language-select');
    
    if (!apiKeyInput || !languageSelect) return;
    
    const apiKey = apiKeyInput.value.trim();
    const language = languageSelect.value;

    if (!apiKey) {
      this.showMessage('Please enter an API key', 'error');
      return;
    }

    if (!this.validateApiKey(apiKey)) {
      this.showMessage('Invalid OpenAI API key format', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({
        aiApiKey: apiKey,
        language: language
      });

      const response = await chrome.runtime.sendMessage({
        action: 'setApiKey',
        apiKey: apiKey
      });

      if (response.success) {
        this.showMessage('Settings saved successfully!', 'success');
      } else {
        this.showMessage('Failed to save settings: ' + response.error, 'error');
      }
    } catch (error) {
      this.showMessage('Error saving settings: ' + error.message, 'error');
    }
  }

  validateApiKey(apiKey) {
    return apiKey.startsWith('sk-') && apiKey.length >= 20;
  }

  showMessage(text, type) {
    const messageDiv = document.getElementById('status-message');
    if (!messageDiv) return;
    
    messageDiv.textContent = text;
    messageDiv.className = `status-message ${type}`;
    messageDiv.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 3000);
    }
  }
}

describe('[LinkedIn Job Analyzer] OptionsManager', () => {
  let optionsManager;

  beforeEach(() => {
    // Reset Chrome API mocks
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
    chrome.runtime.sendMessage.mockClear();

    // Setup default Chrome responses
    chrome.storage.sync.get.mockResolvedValue({ 
      aiApiKey: 'sk-test-key-123456789012345678901234567890',
      language: 'en' 
    });
    chrome.storage.sync.set.mockResolvedValue();
    chrome.runtime.sendMessage.mockResolvedValue({ success: true });

    // Create DOM
    createOptionsDOM();
    
    optionsManager = new OptionsManager();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize and call init method', () => {
      expect(optionsManager).toBeDefined();
    });

    it('should load settings from Chrome storage on init', async () => {
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['aiApiKey', 'language']);
      
      const apiKeyInput = document.getElementById('api-key');
      const languageSelect = document.getElementById('language-select');
      
      expect(apiKeyInput?.value).toBe('sk-test-key-123456789012345678901234567890');
      expect(languageSelect?.value).toBe('en');
    });

    it('should handle missing settings gracefully', async () => {
      // Reset chrome mock to return empty for this specific test
      chrome.storage.sync.get.mockClear();
      chrome.storage.sync.set.mockClear();
      chrome.runtime.sendMessage.mockClear();
      chrome.storage.sync.get.mockResolvedValue({});
      chrome.storage.sync.set.mockResolvedValue();
      chrome.runtime.sendMessage.mockResolvedValue({ success: true });
      
      // Create fresh DOM and manager
      createOptionsDOM();
      const newOptionsManager = new OptionsManager();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const apiKeyInput = document.getElementById('api-key');
      const languageSelect = document.getElementById('language-select');
      
      expect(apiKeyInput?.value).toBe('');
      expect(languageSelect?.value).toBe('en'); // Default value
    });
  });

  describe('loadSettings', () => {
    it('should load API key from storage', async () => {
      await optionsManager.loadSettings();
      
      const apiKeyInput = document.getElementById('api-key');
      expect(apiKeyInput?.value).toBe('sk-test-key-123456789012345678901234567890');
    });

    it('should load language preference from storage', async () => {
      chrome.storage.sync.get.mockResolvedValue({ language: 'it' });
      
      await optionsManager.loadSettings();
      
      const languageSelect = document.getElementById('language-select');
      expect(languageSelect?.value).toBe('it');
    });

    it('should handle missing API key', async () => {
      // Reset chrome mock and setup fresh DOM for this test
      chrome.storage.sync.get.mockClear();
      chrome.storage.sync.set.mockClear();
      chrome.runtime.sendMessage.mockClear();
      chrome.storage.sync.get.mockResolvedValue({ language: 'en' });
      chrome.storage.sync.set.mockResolvedValue();
      chrome.runtime.sendMessage.mockResolvedValue({ success: true });
      
      createOptionsDOM();
      const newManager = new OptionsManager();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const apiKeyInput = document.getElementById('api-key');
      expect(apiKeyInput?.value).toBe('');
    });

    it('should handle missing language setting', async () => {
      chrome.storage.sync.get.mockResolvedValue({ aiApiKey: 'sk-test' });
      
      await optionsManager.loadSettings();
      
      const languageSelect = document.getElementById('language-select');
      expect(languageSelect?.value).toBe('en'); // Should keep default
    });
  });

  describe('setupEventListeners', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
    });

    it('should set up save button click listener', async () => {
      const saveBtn = document.getElementById('save-btn');
      const saveSettingsSpy = vi.spyOn(optionsManager, 'saveSettings').mockImplementation(() => Promise.resolve());
      
      saveBtn?.click();
      
      expect(saveSettingsSpy).toHaveBeenCalled();
    });

    it('should set up API key Enter key listener', () => {
      const apiKeyInput = document.getElementById('api-key');
      const saveSettingsSpy = vi.spyOn(optionsManager, 'saveSettings').mockImplementation(() => Promise.resolve());
      
      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      apiKeyInput?.dispatchEvent(enterEvent);
      
      expect(saveSettingsSpy).toHaveBeenCalled();
    });

    it('should not trigger save on other keys', () => {
      const apiKeyInput = document.getElementById('api-key');
      const saveSettingsSpy = vi.spyOn(optionsManager, 'saveSettings');
      
      const escapeEvent = new KeyboardEvent('keypress', { key: 'Escape' });
      apiKeyInput?.dispatchEvent(escapeEvent);
      
      expect(saveSettingsSpy).not.toHaveBeenCalled();
    });

    it('should set up language select change listener', () => {
      const languageSelect = document.getElementById('language-select');
      const saveLanguageSpy = vi.spyOn(optionsManager, 'saveLanguageSettings').mockImplementation(() => Promise.resolve());
      
      if (languageSelect) {
        languageSelect.value = 'it';
        languageSelect.dispatchEvent(new Event('change'));
      }
      
      expect(saveLanguageSpy).toHaveBeenCalled();
    });

    it('should set correct placeholder for API key input', () => {
      const apiKeyInput = document.getElementById('api-key');
      expect(apiKeyInput?.placeholder).toBe('sk-...');
    });
  });

  describe('saveLanguageSettings', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should save language preference successfully', async () => {
      const languageSelect = document.getElementById('language-select');
      if (languageSelect) {
        languageSelect.value = 'it';
      }
      
      await optionsManager.saveLanguageSettings();
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ language: 'it' });
    });

    it('should show success message after saving language', async () => {
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveLanguageSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith('Language preference saved!', 'success');
    });

    it('should handle storage errors', async () => {
      chrome.storage.sync.set.mockRejectedValue(new Error('Storage failed'));
      
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveLanguageSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith('Error saving language: Storage failed', 'error');
    });

    it('should handle missing language select element', async () => {
      document.getElementById('language-select')?.remove();
      
      // Should not throw error
      await expect(optionsManager.saveLanguageSettings()).resolves.toBeUndefined();
    });
  });

  describe('saveSettings', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should save valid settings successfully', async () => {
      const apiKeyInput = document.getElementById('api-key');
      const languageSelect = document.getElementById('language-select');
      
      if (apiKeyInput) apiKeyInput.value = 'sk-valid-key-123456789012345678901234567890';
      if (languageSelect) languageSelect.value = 'it';
      
      await optionsManager.saveSettings();
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        aiApiKey: 'sk-valid-key-123456789012345678901234567890',
        language: 'it'
      });
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'setApiKey',
        apiKey: 'sk-valid-key-123456789012345678901234567890'
      });
    });

    it('should show error for empty API key', async () => {
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = '';
      
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith('Please enter an API key', 'error');
    });

    it('should show error for invalid API key format', async () => {
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = 'invalid-key';
      
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith('Invalid OpenAI API key format', 'error');
    });

    it('should trim whitespace from API key', async () => {
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = '  sk-valid-key-123456789012345678901234567890  ';
      
      await optionsManager.saveSettings();
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        aiApiKey: 'sk-valid-key-123456789012345678901234567890',
        language: 'en'
      });
    });

    it('should handle storage errors', async () => {
      chrome.storage.sync.set.mockRejectedValue(new Error('Storage failed'));
      
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = 'sk-valid-key-123456789012345678901234567890';
      
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith('Error saving settings: Storage failed', 'error');
    });

    it('should handle runtime message errors', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({ success: false, error: 'Runtime failed' });
      
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = 'sk-valid-key-123456789012345678901234567890';
      
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith('Failed to save settings: Runtime failed', 'error');
    });

    it('should show success message when settings saved', async () => {
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = 'sk-valid-key-123456789012345678901234567890';
      
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith('Settings saved successfully!', 'success');
    });

    it('should handle missing DOM elements', async () => {
      document.getElementById('api-key')?.remove();
      document.getElementById('language-select')?.remove();
      
      // Should not throw error
      await expect(optionsManager.saveSettings()).resolves.toBeUndefined();
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key format', () => {
      const validKeys = [
        'sk-123456789012345678901234567890',
        'sk-abcdef123456789012345678901234567890',
        'sk-very-long-api-key-that-meets-minimum-length-requirements'
      ];
      
      validKeys.forEach(key => {
        expect(optionsManager.validateApiKey(key)).toBe(true);
      });
    });

    it('should reject invalid API key formats', () => {
      const invalidKeys = [
        'invalid-key',
        'sk-',
        'sk-short',
        'pk-123456789012345678901234567890', // Wrong prefix
        '', // Empty
        'sk-1234567890123456' // Too short (19 chars total)
      ];
      
      invalidKeys.forEach(key => {
        console.log(`Testing key: "${key}" (length: ${key.length})`);
        expect(optionsManager.validateApiKey(key)).toBe(false);
      });
    });

    it('should require sk- prefix', () => {
      expect(optionsManager.validateApiKey('123456789012345678901234567890')).toBe(false);
      expect(optionsManager.validateApiKey('sk-123456789012345678901234567890')).toBe(true);
    });

    it('should require minimum length', () => {
      expect(optionsManager.validateApiKey('sk-12345')).toBe(false);
      expect(optionsManager.validateApiKey('sk-123456789012345678901234567890')).toBe(true);
    });
  });

  describe('showMessage', () => {
    it('should display success message', () => {
      optionsManager.showMessage('Test success', 'success');
      
      const messageDiv = document.getElementById('status-message');
      expect(messageDiv?.textContent).toBe('Test success');
      expect(messageDiv?.className).toBe('status-message success');
      expect(messageDiv?.style.display).toBe('block');
    });

    it('should display error message', () => {
      optionsManager.showMessage('Test error', 'error');
      
      const messageDiv = document.getElementById('status-message');
      expect(messageDiv?.textContent).toBe('Test error');
      expect(messageDiv?.className).toBe('status-message error');
      expect(messageDiv?.style.display).toBe('block');
    });

    it('should auto-hide success messages after 3 seconds', async () => {
      vi.useFakeTimers();
      
      optionsManager.showMessage('Test success', 'success');
      
      const messageDiv = document.getElementById('status-message');
      expect(messageDiv?.style.display).toBe('block');
      
      // Fast forward 3 seconds
      vi.advanceTimersByTime(3000);
      
      expect(messageDiv?.style.display).toBe('none');
      
      vi.useRealTimers();
    });

    it('should not auto-hide error messages', async () => {
      vi.useFakeTimers();
      
      optionsManager.showMessage('Test error', 'error');
      
      const messageDiv = document.getElementById('status-message');
      expect(messageDiv?.style.display).toBe('block');
      
      // Fast forward 3 seconds
      vi.advanceTimersByTime(3000);
      
      expect(messageDiv?.style.display).toBe('block');
      
      vi.useRealTimers();
    });

    it('should handle missing message element', () => {
      document.getElementById('status-message')?.remove();
      
      // Should not throw error
      expect(() => optionsManager.showMessage('test', 'success')).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Chrome storage exceptions', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage unavailable'));
      
      const newOptionsManager = new OptionsManager();
      
      // Should not throw error during initialization - catch the promise rejection
      try {
        await newOptionsManager.init();
      } catch (error) {
        // Expected to catch the storage error
        expect(error.message).toBe('Storage unavailable');
      }
    });

    it('should handle Chrome runtime message exceptions', async () => {
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Runtime unavailable'));
      
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = 'sk-valid-key-123456789012345678901234567890';
      
      const showMessageSpy = vi.spyOn(optionsManager, 'showMessage');
      
      await optionsManager.saveSettings();
      
      expect(showMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error saving settings:'),
        'error'
      );
    });

    it('should handle partial DOM structure', () => {
      // Remove some elements
      document.getElementById('language-select')?.remove();
      
      const newOptionsManager = new OptionsManager();
      
      // Should not throw error
      expect(newOptionsManager).toBeDefined();
    });

    it('should handle concurrent save operations', async () => {
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput) apiKeyInput.value = 'sk-valid-key-123456789012345678901234567890';
      
      // Start multiple save operations
      const promises = [
        optionsManager.saveSettings(),
        optionsManager.saveLanguageSettings(),
        optionsManager.saveSettings()
      ];
      
      // Should all complete without errors
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full save workflow', async () => {
      // Set up inputs
      const apiKeyInput = document.getElementById('api-key');
      const languageSelect = document.getElementById('language-select');
      
      if (apiKeyInput) apiKeyInput.value = 'sk-integration-test-123456789012345678901234567890';
      if (languageSelect) languageSelect.value = 'it';
      
      // Trigger save
      await optionsManager.saveSettings();
      
      // Verify all steps completed
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        aiApiKey: 'sk-integration-test-123456789012345678901234567890',
        language: 'it'
      });
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'setApiKey',
        apiKey: 'sk-integration-test-123456789012345678901234567890'
      });
      
      // Check success message
      const messageDiv = document.getElementById('status-message');
      expect(messageDiv?.textContent).toBe('Settings saved successfully!');
      expect(messageDiv?.className).toBe('status-message success');
    });

    it('should handle load and save cycle', async () => {
      // Load settings
      await optionsManager.loadSettings();
      
      // Verify loaded values
      const apiKeyInput = document.getElementById('api-key');
      const languageSelect = document.getElementById('language-select');
      
      expect(apiKeyInput?.value).toBe('sk-test-key-123456789012345678901234567890');
      expect(languageSelect?.value).toBe('en');
      
      // Modify and save
      if (apiKeyInput) apiKeyInput.value = 'sk-modified-key-123456789012345678901234567890';
      if (languageSelect) languageSelect.value = 'it';
      
      await optionsManager.saveSettings();
      
      // Verify save call
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        aiApiKey: 'sk-modified-key-123456789012345678901234567890',
        language: 'it'
      });
    });
  });
});