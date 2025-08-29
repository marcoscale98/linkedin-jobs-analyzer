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
      document.getElementById('api-key').value = result.aiApiKey;
    }
    
    if (result.language) {
      document.getElementById('language-select').value = result.language;
    }

    // Load font scale settings
    await this.loadFontScaleSettings();
  }

  async loadFontScaleSettings() {
    const currentScale = await FontScaler.getCurrentScale();
    const slider = document.getElementById('font-scale-slider');
    const display = document.getElementById('font-scale-value');
    
    slider.value = currentScale;
    display.textContent = currentScale;
  }

  setupEventListeners() {
    const saveBtn = document.getElementById('save-btn');
    const apiKeyInput = document.getElementById('api-key');
    const languageSelect = document.getElementById('language-select');

    saveBtn.addEventListener('click', () => this.saveSettings());
    
    apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveSettings();
      }
    });

    languageSelect.addEventListener('change', () => {
      this.saveLanguageSettings();
    });

    // Set OpenAI placeholder
    apiKeyInput.placeholder = 'sk-...';

    // Font scaling event listeners
    this.setupFontScaleListeners();
  }

  setupFontScaleListeners() {
    const slider = document.getElementById('font-scale-slider');
    const display = document.getElementById('font-scale-value');
    const resetBtn = document.getElementById('font-scale-reset');

    // Update display and apply scale as slider moves
    slider.addEventListener('input', async (e) => {
      const scale = parseInt(e.target.value);
      display.textContent = scale;
      
      // Apply scale immediately for live preview
      FontScaler.applyScale(scale);
    });

    // Save scale when user releases slider
    slider.addEventListener('change', async (e) => {
      const scale = parseInt(e.target.value);
      try {
        await FontScaler.applyToAllExtensionPages(scale);
        this.showMessage(`Font size set to ${scale}%`, 'success');
      } catch (error) {
        this.showMessage('Error saving font size: ' + error.message, 'error');
      }
    });

    // Reset button
    resetBtn.addEventListener('click', async () => {
      try {
        const defaultScale = await FontScaler.resetScale();
        slider.value = defaultScale;
        display.textContent = defaultScale;
        await FontScaler.applyToAllExtensionPages(defaultScale);
        this.showMessage('Font size reset to default', 'success');
      } catch (error) {
        this.showMessage('Error resetting font size: ' + error.message, 'error');
      }
    });
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
    const language = document.getElementById('language-select').value;

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
    return apiKey.startsWith('sk-') && apiKey.length > 20;
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