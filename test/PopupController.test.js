import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { chrome } from './setup.js';
import '@testing-library/jest-dom';

// Create DOM helper function
function createDOM() {
  document.body.innerHTML = `
    <div id="main-content">
      <div class="language-switcher">
        <button class="lang-btn" data-lang="en">EN</button>
        <button class="lang-btn" data-lang="it">IT</button>
      </div>
      
      <div id="info" style="display: none;"></div>
      <div id="error" style="display: none;"></div>
      
      <div class="option-card" id="predefined-option">
        <h3 data-text="predefined_title">Predefined Format</h3>
        <p data-text="predefined_desc">Customize which information to include:</p>
        <div class="checkboxes">
          <label><input type="checkbox" checked> <span data-text="job_title_company">Job Title & Company</span></label>
          <label><input type="checkbox"> <span data-text="salary_compensation">Salary & Compensation</span></label>
          <label><input type="checkbox"> <span data-text="work_location">Work Location & Remote Options</span></label>
          <label><input type="checkbox"> <span data-text="benefits_perks">Benefits & Perks</span></label>
          <label><input type="checkbox"> <span data-text="required_skills">Required Skills & Experience</span></label>
          <label><input type="checkbox"> <span data-text="team_culture">Team & Company Culture</span></label>
        </div>
      </div>
      
      <div class="option-card" id="custom-option">
        <h3 data-text="custom_title">Custom Format</h3>
        <p data-text="custom_desc">Describe what you want to focus on in your own words</p>
      </div>
      
      <div id="custom-input" style="display: none;">
        <textarea id="custom-prompt" data-placeholder="custom_placeholder" placeholder="e.g., Focus on technical requirements and team structure"></textarea>
      </div>
      
      <button id="generate-btn" data-text="generate_btn" disabled>Generate Summary</button>
    </div>
    
    <div id="loading" style="display: none;">
      <span data-text="analyzing">Analyzing job posting...</span>
    </div>
    
    <div id="result" style="display: none;">
      <h3 data-text="job_summary_title">Job Summary:</h3>
      <div id="result-content"></div>
    </div>
  `;
}

// Mock PopupController class (simplified version for testing)
class PopupController {
  constructor() {
    this.selectedFormat = null;
    this.jobData = null;
    this.currentLanguage = 'en';
    this.translations = {
      en: {
        title: 'LinkedIn Job Analyzer',
        predefined_title: '📋 Predefined Format',
        custom_title: '✨ Custom Format',
        job_title_company: 'Job Title & Company',
        salary_compensation: 'Salary & Compensation',
        work_location: 'Work Location & Remote Options',
        benefits_perks: 'Benefits & Perks',
        required_skills: 'Required Skills & Experience',
        team_culture: 'Team & Company Culture',
        custom_placeholder: 'e.g., Focus on technical requirements and team structure',
        generate_btn: 'Generate Summary',
        analyzing: 'Analyzing job posting...',
        job_summary_title: 'Job Summary:',
        job_page_detected: '✅ LinkedIn job page detected! Choose a format to analyze this job posting.',
        job_extracted: '✅ Job data extracted successfully! Ready to generate summary.',
        linkedin_guidance: 'Please navigate to a LinkedIn job posting:\\n\\n1. Go to www.linkedin.com/jobs or it.linkedin.com/jobs\\n2. Search for jobs\\n3. Click on any job posting\\n4. The URL should look like: linkedin.com/jobs/view/123456789'
      },
      it: {
        title: 'LinkedIn Job Analyzer',
        predefined_title: '📋 Formato Predefinito',
        custom_title: '✨ Formato Personalizzato',
        job_title_company: 'Titolo Lavoro e Azienda',
        salary_compensation: 'Stipendio e Compensi',
        work_location: 'Luogo di Lavoro e Remote Working',
        benefits_perks: 'Benefit e Vantaggi',
        required_skills: 'Competenze ed Esperienza Richieste',
        team_culture: 'Team e Cultura Aziendale',
        custom_placeholder: 'es. Concentrati sui requisiti tecnici e la struttura del team',
        generate_btn: 'Genera Riassunto',
        analyzing: 'Analizzando l\'offerta di lavoro...',
        job_summary_title: 'Riassunto Lavoro:',
        job_page_detected: '✅ Pagina lavoro LinkedIn rilevata! Scegli un formato per analizzare questa offerta.',
        job_extracted: '✅ Dati del lavoro estratti con successo! Pronto per generare il riassunto.',
        linkedin_guidance: 'Vai su una pagina di lavoro LinkedIn:\\n\\n1. Vai su www.linkedin.com/jobs o it.linkedin.com/jobs\\n2. Cerca lavori\\n3. Clicca su qualsiasi offerta di lavoro\\n4. L\'URL dovrebbe essere: linkedin.com/jobs/view/123456789'
      }
    };
  }

  async init() {
    await this.loadLanguagePreference();
    this.setupEventListeners();
    this.updateLanguageUI();
    await this.checkCurrentTab();
  }

  async loadLanguagePreference() {
    const result = await chrome.storage.sync.get(['language']);
    this.currentLanguage = result.language || 'en';
  }

  async saveLanguagePreference(language) {
    await chrome.storage.sync.set({ language });
    this.currentLanguage = language;
  }

  updateLanguageUI() {
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
    });

    // Update text elements
    document.querySelectorAll('[data-text]').forEach(element => {
      const key = element.dataset.text;
      if (this.translations[this.currentLanguage][key]) {
        element.textContent = this.translations[this.currentLanguage][key];
      }
    });

    // Update placeholder
    const textarea = document.getElementById('custom-prompt');
    if (textarea) {
      const key = textarea.dataset.placeholder;
      if (key && this.translations[this.currentLanguage][key]) {
        textarea.placeholder = this.translations[this.currentLanguage][key];
      }
    }
  }

  setupEventListeners() {
    const predefinedOption = document.getElementById('predefined-option');
    const customOption = document.getElementById('custom-option');
    const generateBtn = document.getElementById('generate-btn');
    const customInput = document.getElementById('custom-input');

    predefinedOption?.addEventListener('click', () => {
      this.selectFormat('predefined');
      if (customInput) customInput.style.display = 'none';
      this.updateButtonState();
    });

    customOption?.addEventListener('click', () => {
      this.selectFormat('custom');
      if (customInput) customInput.style.display = 'block';
      this.updateButtonState();
    });

    generateBtn?.addEventListener('click', () => {
      this.generateSummary();
    });

    document.getElementById('custom-prompt')?.addEventListener('input', () => {
      this.updateButtonState();
    });

    // Language switcher event listeners
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const selectedLang = btn.dataset.lang;
        if (selectedLang !== this.currentLanguage) {
          await this.saveLanguagePreference(selectedLang);
          this.updateLanguageUI();
        }
      });
    });
  }

  selectFormat(format) {
    this.selectedFormat = format;
    
    document.querySelectorAll('.option-card').forEach(card => {
      card.style.backgroundColor = '';
      card.style.border = '1px solid #ddd';
    });

    const selectedCard = document.getElementById(`${format}-option`);
    if (selectedCard) {
      selectedCard.style.backgroundColor = '#e3f2fd';
      selectedCard.style.border = '2px solid #0077b5';
    }
  }

  updateButtonState() {
    const generateBtn = document.getElementById('generate-btn');
    const customPrompt = document.getElementById('custom-prompt')?.value.trim() || '';
    
    const canGenerate = this.selectedFormat === 'predefined' || 
                       (this.selectedFormat === 'custom' && customPrompt.length > 0);
    
    if (generateBtn) {
      generateBtn.disabled = !canGenerate;
    }
  }

  async checkCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!this.isLinkedInJobPage(tab.url)) {
      this.showPageGuidance(tab.url);
      return;
    }

    this.showJobPageDetected();
    await this.extractJobData(tab.id);
  }

  isLinkedInJobPage(url) {
    return !!(url.includes('linkedin.com/jobs/view/') || 
              url.includes('it.linkedin.com/jobs/view/') ||
              url.match(/linkedin\.com\/jobs\/view\/\d+/) ||
              url.match(/it\.linkedin\.com\/jobs\/view\/\d+/));
  }

  showPageGuidance(currentUrl) {
    const guidance = this.translations[this.currentLanguage].linkedin_guidance;
    this.showInfo(guidance);
  }

  showJobPageDetected() {
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
      infoDiv.innerHTML = this.translations[this.currentLanguage].job_page_detected;
      infoDiv.style.display = 'block';
      infoDiv.className = 'info success';
    }
  }

  showInfo(message) {
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
      infoDiv.innerHTML = message.replace(/\\n/g, '<br>');
      infoDiv.style.display = 'block';
      infoDiv.className = 'info';
    }
  }

  async extractJobData(tabId) {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'extractJobData' });
    
    if (response && response.success && response.jobData) {
      this.jobData = response.jobData;
      this.validateExtractedData();
    } else {
      this.showError('Unable to extract job data. The page might still be loading - please wait a moment and try again.');
    }
  }

  validateExtractedData() {
    if (!this.jobData) return;
    
    const hasValidTitle = this.jobData.title && !this.jobData.title.includes('not found');
    const hasValidCompany = this.jobData.company && !this.jobData.company.includes('not found');
    const hasValidDescription = this.jobData.description && 
                               !this.jobData.description.includes('not found') && 
                               this.jobData.description.length > 50;
    
    if (hasValidTitle && hasValidCompany && hasValidDescription) {
      this.showInfo(this.translations[this.currentLanguage].job_extracted);
    } else {
      const errorMsg = this.currentLanguage === 'it' 
        ? '⚠️ Alcuni dati del lavoro non sono stati estratti. Il riassunto potrebbe essere incompleto.'
        : '⚠️ Some job data could not be extracted. The summary may be incomplete.';
      this.showError(errorMsg);
    }
  }

  async generateSummary() {
    if (!this.jobData) {
      const errorMsg = this.currentLanguage === 'it' 
        ? 'Nessun dato del lavoro disponibile. Ricarica la pagina LinkedIn del lavoro e riprova.'
        : 'No job data available. Please refresh the LinkedIn job page and try again.';
      this.showError(errorMsg);
      return;
    }

    this.showLoading(true);
    this.hideError();
    this.hideInfo();

    try {
      const selectedFields = this.getSelectedFieldNames();
      const isCustomFormat = this.selectedFormat === 'custom';
      const customPrompt = isCustomFormat ? document.getElementById('custom-prompt')?.value.trim() || '' : '';

      const response = await chrome.runtime.sendMessage({
        action: 'generateSummary',
        prompt: 'test prompt',
        selectedFields: selectedFields,
        language: this.currentLanguage,
        isCustomFormat: isCustomFormat,
        customPrompt: customPrompt
      });

      if (!response.success) {
        throw new Error(response.error || 'AI service failed');
      }

      this.showResult(response.summary);
      
    } catch (error) {
      const errorMsg = this.currentLanguage === 'it' 
        ? 'Impossibile generare il riassunto. Riprova.'
        : 'Failed to generate summary. Please try again.';
      this.showError(errorMsg);
    } finally {
      this.showLoading(false);
    }
  }

  getSelectedFieldNames() {
    const checkboxes = document.querySelectorAll('#predefined-option input[type="checkbox"]');
    const selectedFields = [];
    
    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        const fieldMap = {
          0: ['jobTitle', 'company'],
          1: ['salary'],
          2: ['location'],
          3: ['benefits'],
          4: ['requiredSkills'],
          5: ['teamCulture']
        };
        selectedFields.push(...fieldMap[index]);
      }
    });
    
    return selectedFields.length > 0 ? selectedFields : null;
  }

  showLoading(show) {
    const mainContent = document.getElementById('main-content');
    const loading = document.getElementById('loading');
    
    if (show) {
      if (mainContent) mainContent.style.display = 'none';
      if (loading) loading.style.display = 'block';
    } else {
      if (mainContent) mainContent.style.display = 'block';
      if (loading) loading.style.display = 'none';
    }
  }

  showResult(summary) {
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('result-content');
    
    if (typeof summary === 'object' && summary !== null) {
      if (this.selectedFormat === 'custom') {
        if (resultContent) resultContent.innerHTML = this.formatCustomSummary(summary);
      } else {
        if (resultContent) resultContent.innerHTML = this.formatStructuredSummary(summary);
      }
    } else {
      if (resultContent) resultContent.innerHTML = this.formatSummary(summary);
    }
    if (resultDiv) resultDiv.style.display = 'block';
  }

  formatCustomSummary(data) {
    const notSpecifiedValue = this.currentLanguage === 'it' ? 'Non specificato' : 'Not specified';
    
    return Object.entries(data).map(([field, value]) => {
      const displayValue = value || notSpecifiedValue;
      const displayField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
      
      return `<div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-left: 3px solid #0077b5; border-radius: 0 4px 4px 0;">
                <span style="font-weight: 600; color: #333;">${displayField}:</span>
                <span style="margin-left: 8px; color: #555;">${displayValue}</span>
              </div>`;
    }).join('');
  }

  formatStructuredSummary(data) {
    const translations = this.currentLanguage === 'it' ? {
      jobTitle: 'Titolo Lavoro',
      company: 'Azienda',
      salary: 'Stipendio',
      location: 'Luogo di Lavoro',
      benefits: 'Benefit',
      requiredSkills: 'Competenze Richieste',
      teamCulture: 'Team e Cultura'
    } : {
      jobTitle: 'Job Title',
      company: 'Company',
      salary: 'Salary',
      location: 'Location',
      benefits: 'Benefits',
      requiredSkills: 'Required Skills',
      teamCulture: 'Team Culture'
    };

    const notSpecifiedValue = this.currentLanguage === 'it' ? 'Non specificato' : 'Not specified';
    
    return Object.entries(data).map(([field, value]) => {
      const displayValue = value || notSpecifiedValue;
      const label = translations[field] || field;
      
      return `<div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-left: 3px solid #0077b5; border-radius: 0 4px 4px 0;">
                <span style="font-weight: 600; color: #333;">${label}:</span>
                <span style="margin-left: 8px; color: #555;">${displayValue}</span>
              </div>`;
    }).join('');
  }

  formatSummary(summary) {
    return summary || 'No summary available';
  }

  showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  hideInfo() {
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
      infoDiv.style.display = 'none';
    }
  }
}

describe('[LinkedIn Job Analyzer] PopupController', () => {
  let popupController;

  beforeEach(() => {
    // Reset Chrome API mocks
    chrome.flush();

    // Setup default Chrome responses
    chrome.storage.sync.get.resolves({ language: 'en' });
    chrome.tabs.query.resolves([{ 
      id: 1, 
      url: 'https://linkedin.com/jobs/view/123456789',
      active: true 
    }]);
    chrome.tabs.sendMessage.resolves({ 
      success: true, 
      jobData: {
        title: 'Software Engineer',
        company: 'Test Company',
        description: 'A great software engineering position with excellent opportunities for growth and development.'
      }
    });

    // Create DOM
    createDOM();
    
    popupController = new PopupController();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default values', () => {
      expect(popupController.selectedFormat).toBeNull();
      expect(popupController.jobData).toBeNull();
      expect(popupController.currentLanguage).toBe('en');
      expect(popupController.translations).toBeDefined();
    });

    it('should have translations for both languages', () => {
      expect(popupController.translations.en).toBeDefined();
      expect(popupController.translations.it).toBeDefined();
      expect(popupController.translations.en.title).toBe('LinkedIn Job Analyzer');
      expect(popupController.translations.it.title).toBe('LinkedIn Job Analyzer');
    });
  });

  describe('Language Management', () => {
    it('should load language preference from storage', async () => {
      chrome.storage.sync.get.resolves({ language: 'it' });
      
      await popupController.loadLanguagePreference();
      
      expect(chrome.storage.sync.get.calledWith(['language'])).toBe(true);
      expect(popupController.currentLanguage).toBe('it');
    });

    it('should default to English when no preference stored', async () => {
      chrome.storage.sync.get.resolves({});
      
      await popupController.loadLanguagePreference();
      
      expect(popupController.currentLanguage).toBe('en');
    });

    it('should save language preference', async () => {
      await popupController.saveLanguagePreference('it');
      
      expect(chrome.storage.sync.set.calledWith({ language: 'it' })).toBe(true);
      expect(popupController.currentLanguage).toBe('it');
    });

    it('should update UI language elements', () => {
      popupController.currentLanguage = 'it';
      popupController.updateLanguageUI();
      
      const title = document.querySelector('[data-text="predefined_title"]');
      expect(title?.textContent).toBe('📋 Formato Predefinito');
    });

    it('should update language button states', () => {
      popupController.currentLanguage = 'it';
      popupController.updateLanguageUI();
      
      const enBtn = document.querySelector('[data-lang="en"]');
      const itBtn = document.querySelector('[data-lang="it"]');
      
      expect(enBtn?.classList.contains('active')).toBe(false);
      expect(itBtn?.classList.contains('active')).toBe(true);
    });

    it('should update textarea placeholder', () => {
      popupController.currentLanguage = 'it';
      popupController.updateLanguageUI();
      
      const textarea = document.getElementById('custom-prompt');
      expect(textarea?.placeholder).toBe('es. Concentrati sui requisiti tecnici e la struttura del team');
    });
  });

  describe('Format Selection', () => {
    beforeEach(() => {
      popupController.setupEventListeners();
    });

    it('should select predefined format', () => {
      popupController.selectFormat('predefined');
      
      expect(popupController.selectedFormat).toBe('predefined');
      
      const selectedCard = document.getElementById('predefined-option');
      expect(selectedCard?.style.backgroundColor).toBe('rgb(227, 242, 253)');
      expect(selectedCard?.style.border).toBe('2px solid rgb(0, 119, 181)');
    });

    it('should select custom format', () => {
      popupController.selectFormat('custom');
      
      expect(popupController.selectedFormat).toBe('custom');
      
      const selectedCard = document.getElementById('custom-option');
      expect(selectedCard?.style.backgroundColor).toBe('rgb(227, 242, 253)');
    });

    it('should reset other cards when selecting format', () => {
      popupController.selectFormat('predefined');
      popupController.selectFormat('custom');
      
      const predefinedCard = document.getElementById('predefined-option');
      expect(predefinedCard?.style.backgroundColor).toBe('');
      expect(predefinedCard?.style.border).toBe('1px solid rgb(221, 221, 221)');
    });

    it('should handle click events on format options', () => {
      const predefinedOption = document.getElementById('predefined-option');
      const customInput = document.getElementById('custom-input');
      
      predefinedOption?.click();
      
      expect(popupController.selectedFormat).toBe('predefined');
      expect(customInput?.style.display).toBe('none');
    });

    it('should show custom input when custom format selected', () => {
      const customOption = document.getElementById('custom-option');
      const customInput = document.getElementById('custom-input');
      
      customOption?.click();
      
      expect(popupController.selectedFormat).toBe('custom');
      expect(customInput?.style.display).toBe('block');
    });
  });

  describe('Button State Management', () => {
    beforeEach(() => {
      popupController.setupEventListeners();
    });

    it('should enable button when predefined format selected', () => {
      popupController.selectFormat('predefined');
      popupController.updateButtonState();
      
      const generateBtn = document.getElementById('generate-btn');
      expect(generateBtn?.disabled).toBe(false);
    });

    it('should disable button when custom format selected but no prompt', () => {
      popupController.selectFormat('custom');
      popupController.updateButtonState();
      
      const generateBtn = document.getElementById('generate-btn');
      expect(generateBtn?.disabled).toBe(true);
    });

    it('should enable button when custom format selected with prompt', () => {
      popupController.selectFormat('custom');
      const customPrompt = document.getElementById('custom-prompt');
      if (customPrompt) {
        customPrompt.value = 'test prompt';
      }
      popupController.updateButtonState();
      
      const generateBtn = document.getElementById('generate-btn');
      expect(generateBtn?.disabled).toBe(false);
    });

    it('should update button state on input change', () => {
      popupController.selectFormat('custom');
      const customPrompt = document.getElementById('custom-prompt');
      
      if (customPrompt) {
        customPrompt.value = 'test';
        customPrompt.dispatchEvent(new Event('input'));
      }
      
      const generateBtn = document.getElementById('generate-btn');
      expect(generateBtn?.disabled).toBe(false);
    });
  });

  describe('LinkedIn Page Detection', () => {
    it('should detect valid LinkedIn job URLs', () => {
      const validUrls = [
        'https://www.linkedin.com/jobs/view/123456789',
        'https://it.linkedin.com/jobs/view/987654321',
        'https://linkedin.com/jobs/view/555'
      ];
      
      validUrls.forEach(url => {
        expect(popupController.isLinkedInJobPage(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://linkedin.com/feed',
        'https://google.com',
        'https://linkedin.com/jobs',
        'https://linkedin.com/jobs/search'
      ];
      
      invalidUrls.forEach(url => {
        expect(popupController.isLinkedInJobPage(url)).toBe(false);
      });
    });

    it('should show page guidance for non-LinkedIn pages', () => {
      popupController.showPageGuidance('https://google.com');
      
      const infoDiv = document.getElementById('info');
      expect(infoDiv?.style.display).toBe('block');
      expect(infoDiv?.innerHTML).toContain('navigate to a LinkedIn job posting');
    });

    it('should show job page detected message', () => {
      popupController.showJobPageDetected();
      
      const infoDiv = document.getElementById('info');
      expect(infoDiv?.style.display).toBe('block');
      expect(infoDiv?.innerHTML).toContain('LinkedIn job page detected');
      expect(infoDiv?.className).toBe('info success');
    });
  });

  describe('Job Data Extraction', () => {
    it('should extract job data successfully', async () => {
      await popupController.extractJobData(1);
      
      expect(chrome.tabs.sendMessage.calledWith(1, { action: 'extractJobData' })).toBe(true);
      expect(popupController.jobData).toEqual({
        title: 'Software Engineer',
        company: 'Test Company',
        description: 'A great software engineering position with excellent opportunities for growth and development.'
      });
    });

    it('should handle extraction errors', async () => {
      chrome.tabs.sendMessage.resolves({ success: false, error: 'Extraction failed' });
      
      const showErrorSpy = vi.spyOn(popupController, 'showError');
      
      await popupController.extractJobData(1);
      
      expect(showErrorSpy).toHaveBeenCalledWith('Unable to extract job data. The page might still be loading - please wait a moment and try again.');
    });

    it('should validate extracted data quality', () => {
      popupController.jobData = {
        title: 'Software Engineer',
        company: 'Test Company',
        description: 'A great software engineering position with excellent opportunities for growth and development.'
      };
      
      const showInfoSpy = vi.spyOn(popupController, 'showInfo');
      
      popupController.validateExtractedData();
      
      expect(showInfoSpy).toHaveBeenCalledWith(popupController.translations.en.job_extracted);
    });

    it('should show warning for incomplete data', () => {
      popupController.jobData = {
        title: 'not found',
        company: 'Test Company',
        description: 'Short'
      };
      
      const showErrorSpy = vi.spyOn(popupController, 'showError');
      
      popupController.validateExtractedData();
      
      expect(showErrorSpy).toHaveBeenCalledWith('⚠️ Some job data could not be extracted. The summary may be incomplete.');
    });
  });

  describe('Summary Generation', () => {
    beforeEach(() => {
      popupController.jobData = {
        title: 'Software Engineer',
        company: 'Test Company',
        description: 'A great job description'
      };
      popupController.setupEventListeners();
    });

    it('should generate summary successfully', async () => {
      chrome.runtime.sendMessage.resolves({ 
        success: true, 
        summary: { jobTitle: 'Software Engineer', company: 'Test Company' }
      });
      
      popupController.selectFormat('predefined');
      
      const showResultSpy = vi.spyOn(popupController, 'showResult');
      
      await popupController.generateSummary();
      
      expect(chrome.runtime.sendMessage.calledWith({
        action: 'generateSummary',
        prompt: 'test prompt',
        selectedFields: null,
        language: 'en',
        isCustomFormat: false,
        customPrompt: ''
      })).toBe(true);
      
      expect(showResultSpy).toHaveBeenCalledWith({ jobTitle: 'Software Engineer', company: 'Test Company' });
    });

    it('should handle generation errors', async () => {
      chrome.runtime.sendMessage.resolves({ success: false, error: 'API failed' });
      
      popupController.selectFormat('predefined');
      
      const showErrorSpy = vi.spyOn(popupController, 'showError');
      
      await popupController.generateSummary();
      
      expect(showErrorSpy).toHaveBeenCalledWith('Failed to generate summary. Please try again.');
    });

    it('should prevent generation without job data', async () => {
      popupController.jobData = null;
      
      const showErrorSpy = vi.spyOn(popupController, 'showError');
      
      await popupController.generateSummary();
      
      expect(showErrorSpy).toHaveBeenCalledWith('No job data available. Please refresh the LinkedIn job page and try again.');
    });

    it('should show loading state during generation', async () => {
      chrome.runtime.sendMessage.resolves({ success: true, summary: {} });
      
      popupController.selectFormat('predefined');
      
      const showLoadingSpy = vi.spyOn(popupController, 'showLoading');
      
      await popupController.generateSummary();
      
      expect(showLoadingSpy).toHaveBeenCalledWith(true);
      expect(showLoadingSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('Selected Fields Management', () => {
    beforeEach(() => {
      popupController.setupEventListeners();
    });

    it('should get selected field names from checkboxes', () => {
      // First checkbox (jobTitle, company) is checked by default
      const selectedFields = popupController.getSelectedFieldNames();
      
      expect(selectedFields).toEqual(['jobTitle', 'company']);
    });

    it('should return null when no fields selected', () => {
      // Uncheck all checkboxes
      const checkboxes = document.querySelectorAll('#predefined-option input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
      
      const selectedFields = popupController.getSelectedFieldNames();
      
      expect(selectedFields).toBeNull();
    });

    it('should get multiple selected fields', () => {
      const checkboxes = document.querySelectorAll('#predefined-option input[type="checkbox"]');
      checkboxes[0].checked = true; // jobTitle, company
      checkboxes[1].checked = true; // salary
      checkboxes[2].checked = true; // location
      
      const selectedFields = popupController.getSelectedFieldNames();
      
      expect(selectedFields).toEqual(['jobTitle', 'company', 'salary', 'location']);
    });
  });

  describe('UI State Management', () => {
    it('should show loading state', () => {
      popupController.showLoading(true);
      
      const mainContent = document.getElementById('main-content');
      const loading = document.getElementById('loading');
      
      expect(mainContent?.style.display).toBe('none');
      expect(loading?.style.display).toBe('block');
    });

    it('should hide loading state', () => {
      popupController.showLoading(false);
      
      const mainContent = document.getElementById('main-content');
      const loading = document.getElementById('loading');
      
      expect(mainContent?.style.display).toBe('block');
      expect(loading?.style.display).toBe('none');
    });

    it('should show error message', () => {
      popupController.showError('Test error message');
      
      const errorDiv = document.getElementById('error');
      expect(errorDiv?.textContent).toBe('Test error message');
      expect(errorDiv?.style.display).toBe('block');
    });

    it('should hide error message', () => {
      popupController.hideError();
      
      const errorDiv = document.getElementById('error');
      expect(errorDiv?.style.display).toBe('none');
    });

    it('should show info message', () => {
      popupController.showInfo('Test info message');
      
      const infoDiv = document.getElementById('info');
      expect(infoDiv?.innerHTML).toBe('Test info message');
      expect(infoDiv?.style.display).toBe('block');
    });

    it('should hide info message', () => {
      popupController.hideInfo();
      
      const infoDiv = document.getElementById('info');
      expect(infoDiv?.style.display).toBe('none');
    });
  });

  describe('Summary Formatting', () => {
    it('should format structured summary', () => {
      const summary = {
        jobTitle: 'Software Engineer',
        company: 'Test Company',
        salary: 'Not specified'
      };
      
      const formatted = popupController.formatStructuredSummary(summary);
      
      expect(formatted).toContain('Job Title:');
      expect(formatted).toContain('Software Engineer');
      expect(formatted).toContain('Company:');
      expect(formatted).toContain('Test Company');
    });

    it('should format custom summary', () => {
      const summary = {
        customField: 'Custom Value',
        anotherField: 'Another Value'
      };
      
      const formatted = popupController.formatCustomSummary(summary);
      
      expect(formatted).toContain('Custom Field:');
      expect(formatted).toContain('Custom Value');
      expect(formatted).toContain('Another Field:');
      expect(formatted).toContain('Another Value');
    });

    it('should use Italian labels when language is Italian', () => {
      popupController.currentLanguage = 'it';
      
      const summary = {
        jobTitle: 'Ingegnere Software',
        company: 'Azienda Test'
      };
      
      const formatted = popupController.formatStructuredSummary(summary);
      
      expect(formatted).toContain('Titolo Lavoro:');
      expect(formatted).toContain('Azienda:');
    });

    it('should show result in DOM', () => {
      const summary = { jobTitle: 'Software Engineer' };
      
      popupController.showResult(summary);
      
      const resultDiv = document.getElementById('result');
      const resultContent = document.getElementById('result-content');
      
      expect(resultDiv?.style.display).toBe('block');
      expect(resultContent?.innerHTML).toContain('Software Engineer');
    });
  });

  describe('Event Listeners', () => {
    beforeEach(() => {
      popupController.setupEventListeners();
    });

    it('should handle language button clicks', async () => {
      const itBtn = document.querySelector('[data-lang="it"]');
      const saveLanguageSpy = vi.spyOn(popupController, 'saveLanguagePreference').mockImplementation(() => Promise.resolve());
      const updateUISpy = vi.spyOn(popupController, 'updateLanguageUI').mockImplementation(() => {});
      
      itBtn?.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(saveLanguageSpy).toHaveBeenCalledWith('it');
      expect(updateUISpy).toHaveBeenCalled();
    });

    it('should handle generate button click', () => {
      const generateBtn = document.getElementById('generate-btn');
      const generateSpy = vi.spyOn(popupController, 'generateSummary').mockImplementation(() => Promise.resolve());
      
      generateBtn?.click();
      
      expect(generateSpy).toHaveBeenCalled();
    });
  });
});