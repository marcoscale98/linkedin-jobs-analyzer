class OptionsManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(['aiApiKey', 'aiProvider', 'language']);
    
    if (result.aiProvider) {
      document.getElementById('ai-provider').value = result.aiProvider;
    }
    
    if (result.aiApiKey) {
      document.getElementById('api-key').value = result.aiApiKey;
    }
    
    if (result.language) {
      document.getElementById('language-select').value = result.language;
    }
  }

  setupEventListeners() {
    const saveBtn = document.getElementById('save-btn');
    const apiKeyInput = document.getElementById('api-key');
    const providerSelect = document.getElementById('ai-provider');
    const languageSelect = document.getElementById('language-select');

    saveBtn.addEventListener('click', () => this.saveSettings());
    
    apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveSettings();
      }
    });

    providerSelect.addEventListener('change', () => {
      this.updateApiKeyPlaceholder();
    });

    languageSelect.addEventListener('change', () => {
      this.saveLanguageSettings();
    });

    this.updateApiKeyPlaceholder();
  }

  updateApiKeyPlaceholder() {
    const provider = document.getElementById('ai-provider').value;
    const apiKeyInput = document.getElementById('api-key');
    
    if (provider === 'openai') {
      apiKeyInput.placeholder = 'sk-...';
    } else if (provider === 'anthropic') {
      apiKeyInput.placeholder = 'sk-ant-...';
    }
  }

  async saveLanguageSettings() {
    const language = document.getElementById('language-select').value;
    
    try {
      await chrome.storage.sync.set({ language });
      this.showMessage('Language preference saved!', 'success');
    } catch (error) {
      this.showMessage('Error saving language: ' + error.message, 'error');
    }
  }

  async saveSettings() {
    const apiKey = document.getElementById('api-key').value.trim();
    const provider = document.getElementById('ai-provider').value;
    const language = document.getElementById('language-select').value;

    if (!apiKey) {
      this.showMessage('Please enter an API key', 'error');
      return;
    }

    if (!this.validateApiKey(apiKey, provider)) {
      this.showMessage('Invalid API key format', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({
        aiApiKey: apiKey,
        aiProvider: provider,
        language: language
      });

      const response = await chrome.runtime.sendMessage({
        action: 'setApiKey',
        apiKey: apiKey,
        provider: provider
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

  validateApiKey(apiKey, provider) {
    if (provider === 'openai') {
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    } else if (provider === 'anthropic') {
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    }
    return false;
  }

  showMessage(text, type) {
    const messageDiv = document.getElementById('status-message');
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

document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});