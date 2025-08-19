// === Console Bridge for Development ===
/**
 * Simple Console Bridge - Stream LinkedIn Job Analyzer logs to terminal
 * Based on the EV Travel Visual Comparator console bridge
 */

(function() {
    'use strict';
    
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    function sendToTerminal(level, args) {
        // Only send LinkedIn Job Analyzer logs
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        if (!message.includes('[LinkedIn Job Analyzer]')) {
            return; // Skip non-extension logs
        }
        
        const logData = {
            level,
            message,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        // Send to terminal server
        fetch('http://localhost:8000/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        }).catch(() => {}); // Fail silently if server not available
    }
    
    // Override console methods
    console.log = function(...args) {
        originalLog.apply(console, args);
        sendToTerminal('log', args);
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        sendToTerminal('error', args);
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendToTerminal('warn', args);
    };
    
    console.info = function(...args) {
        originalInfo.apply(console, args);
        sendToTerminal('info', args);
    };
    
    // Send initial connection message
    console.log('[LinkedIn Job Analyzer] Console bridge connected - logs streaming to terminal');
})();
class PopupController {
  constructor() {
    this.selectedFormat = null;
    this.jobData = null;
    this.currentLanguage = 'en';
    this.translations = {
      en: {
        title: 'LinkedIn Job Analyzer',
        predefined_title: '📋 Predefined Format',
        predefined_desc: 'Customize which information to include:',
        custom_title: '✨ Custom Format',
        custom_desc: 'Describe what you want to focus on in your own words',
        job_title_company: 'Job Title & Company',
        salary_compensation: 'Salary & Compensation',
        work_location: 'Work Location & Remote Options',
        benefits_perks: 'Benefits & Perks',
        required_skills: 'Required Skills & Experience',
        team_culture: 'Team & Company Culture',
        company_reviews: 'Company Reviews (Web Search)',
        custom_placeholder: 'e.g., Focus on technical requirements and team structure',
        generate_btn: 'Generate Summary',
        analyzing: 'Analyzing job posting...',
        job_summary_title: 'Job Summary:',
        job_page_detected: '✅ LinkedIn job page detected! Choose a format to analyze this job posting.',
        job_extracted: '✅ Job data extracted successfully! Ready to generate summary.',
        refresh_guidance: 'Almost there! Click on any job posting to open the detailed view, then use this extension.',
        navigate_guidance: 'Please navigate to LinkedIn Jobs:\n\n1. Go to linkedin.com/jobs\n2. Search for jobs\n3. Click on any job posting\n4. Then use this extension',
        linkedin_guidance: 'Please navigate to a LinkedIn job posting:\n\n1. Go to www.linkedin.com/jobs or it.linkedin.com/jobs\n2. Search for jobs\n3. Click on any job posting\n4. The URL should look like: linkedin.com/jobs/view/123456789'
      },
      it: {
        title: 'LinkedIn Job Analyzer',
        predefined_title: '📋 Formato Predefinito',
        predefined_desc: 'Personalizza quali informazioni includere:',
        custom_title: '✨ Formato Personalizzato',
        custom_desc: 'Descrivi su cosa vuoi concentrarti con le tue parole',
        job_title_company: 'Titolo Lavoro e Azienda',
        salary_compensation: 'Stipendio e Compensi',
        work_location: 'Luogo di Lavoro e Remote Working',
        benefits_perks: 'Benefit e Vantaggi',
        required_skills: 'Competenze ed Esperienza Richieste',
        team_culture: 'Team e Cultura Aziendale',
        company_reviews: 'Recensioni Azienda (Ricerca Web)',
        custom_placeholder: 'es. Concentrati sui requisiti tecnici e la struttura del team',
        generate_btn: 'Genera Riassunto',
        analyzing: 'Analizzando l\'offerta di lavoro...',
        job_summary_title: 'Riassunto Lavoro:',
        job_page_detected: '✅ Pagina lavoro LinkedIn rilevata! Scegli un formato per analizzare questa offerta.',
        job_extracted: '✅ Dati del lavoro estratti con successo! Pronto per generare il riassunto.',
        refresh_guidance: 'Ci siamo quasi! Clicca su qualsiasi offerta di lavoro per aprire la vista dettagliata, poi usa questa estensione.',
        navigate_guidance: 'Vai su LinkedIn Jobs:\n\n1. Vai su linkedin.com/jobs\n2. Cerca lavori\n3. Clicca su qualsiasi offerta di lavoro\n4. Poi usa questa estensione',
        linkedin_guidance: 'Vai su una pagina di lavoro LinkedIn:\n\n1. Vai su www.linkedin.com/jobs o it.linkedin.com/jobs\n2. Cerca lavori\n3. Clicca su qualsiasi offerta di lavoro\n4. L\'URL dovrebbe essere: linkedin.com/jobs/view/123456789'
      }
    };
    this.init();
  }

  async init() {
    await this.loadLanguagePreference();
    this.setupEventListeners();
    this.updateLanguageUI();
    this.checkCurrentTab();
  }

  async loadLanguagePreference() {
    try {
      const result = await chrome.storage.sync.get(['language']);
      this.currentLanguage = result.language || 'en';
    } catch (error) {
      console.error('Failed to load language preference:', error);
      this.currentLanguage = 'en';
    }
  }

  async saveLanguagePreference(language) {
    try {
      await chrome.storage.sync.set({ language });
      this.currentLanguage = language;
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
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

    predefinedOption.addEventListener('click', () => {
      this.selectFormat('predefined');
      customInput.style.display = 'none';
      this.updateButtonState();
    });

    customOption.addEventListener('click', () => {
      this.selectFormat('custom');
      customInput.style.display = 'block';
      this.updateButtonState();
    });

    generateBtn.addEventListener('click', () => {
      this.generateSummary();
    });

    document.getElementById('custom-prompt').addEventListener('input', () => {
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
    selectedCard.style.backgroundColor = '#e3f2fd';
    selectedCard.style.border = '2px solid #0077b5';
  }

  updateButtonState() {
    const generateBtn = document.getElementById('generate-btn');
    const customPrompt = document.getElementById('custom-prompt').value.trim();
    
    const canGenerate = this.selectedFormat === 'predefined' || 
                       (this.selectedFormat === 'custom' && customPrompt.length > 0);
    
    generateBtn.disabled = !canGenerate;
  }

  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isLinkedInJobPage(tab.url)) {
        this.showPageGuidance(tab.url);
        return;
      }

      this.showJobPageDetected();
      await this.extractJobData(tab.id);
    } catch (error) {
      this.showError('Unable to access current tab. Please refresh the page and try again.');
    }
  }

  isLinkedInJobPage(url) {
    return url.includes('linkedin.com/jobs/view/') || 
           url.includes('it.linkedin.com/jobs/view/') ||
           url.match(/linkedin\.com\/jobs\/view\/\d+/) ||
           url.match(/it\.linkedin\.com\/jobs\/view\/\d+/);
  }

  showPageGuidance(currentUrl) {
    let guidance = '';
    
    if (currentUrl.includes('linkedin.com')) {
      if (currentUrl.includes('/jobs/')) {
        guidance = `📍 ${this.translations[this.currentLanguage].refresh_guidance}`;
      } else {
        guidance = `📍 ${this.translations[this.currentLanguage].navigate_guidance}`;
      }
    } else {
      guidance = `📍 ${this.translations[this.currentLanguage].linkedin_guidance}`;
    }
    
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
      infoDiv.innerHTML = message.replace(/\n/g, '<br>');
      infoDiv.style.display = 'block';
      infoDiv.className = 'info';
    }
  }

  async extractJobData(tabId) {
    try {
      // Give the page time to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we can communicate with the content script
      try {
        const response = await chrome.tabs.sendMessage(tabId, { action: 'extractJobData' });
        
        if (response && response.success && response.jobData) {
          this.jobData = response.jobData;
          this.validateExtractedData();
        } else if (response && response.error) {
          this.showError(`Extraction failed: ${response.error}`);
        } else {
          this.showError('Unable to extract job data. The page might still be loading - please wait a moment and try again.');
        }
      } catch (connectionError) {
        // Content script not available - try to inject it
        if (connectionError.message.includes('Could not establish connection') || 
            connectionError.message.includes('Receiving end does not exist')) {
          
          console.log('[LinkedIn Job Analyzer] Content script not found, attempting to inject...');
          
          try {
            // Inject the content script manually
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['src/content.js']
            });
            
            // Wait a moment for the script to initialize
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try communication again
            const response = await chrome.tabs.sendMessage(tabId, { action: 'extractJobData' });
            
            if (response && response.success && response.jobData) {
              this.jobData = response.jobData;
              this.validateExtractedData();
            } else {
              this.showError('Unable to extract job data. Please make sure you are on a LinkedIn job posting page.');
            }
            
          } catch (injectionError) {
            console.error('[LinkedIn Job Analyzer] Failed to inject content script:', injectionError);
            this.showError('Unable to connect to the page. Please refresh the LinkedIn job page and try again.');
          }
        } else {
          throw connectionError;
        }
      }
    } catch (error) {
      console.error('[LinkedIn Job Analyzer] Data extraction error:', error);
      this.showError('Unable to communicate with the page. Please refresh the LinkedIn job page and try again.');
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
        ? '⚠️ Alcuni dati del lavoro non sono stati estratti. Il riassunto potrebbe essere incompleto. Prova a ricaricare la pagina o scorrere verso il basso per caricare tutto il contenuto.'
        : '⚠️ Some job data could not be extracted. The summary may be incomplete. Try refreshing the page or scrolling down to load all content.';
      this.showError(errorMsg);
    }
  }

  async generateSummary() {
    console.log('[LinkedIn Job Analyzer] Starting generateSummary function');
    
    if (!this.jobData) {
      console.log('[LinkedIn Job Analyzer] ERROR: No job data available');
      const errorMsg = this.currentLanguage === 'it' 
        ? 'Nessun dato del lavoro disponibile. Ricarica la pagina LinkedIn del lavoro e riprova.'
        : 'No job data available. Please refresh the LinkedIn job page and try again.';
      this.showError(errorMsg);
      return;
    }

    console.log('[LinkedIn Job Analyzer] Job data available, showing loading...');
    this.showLoading(true);
    this.hideError();
    this.hideInfo();

    try {
      let prompt;
      
      if (this.selectedFormat === 'predefined') {
        prompt = this.getPredefinedPrompt();
      } else {
        const customPrompt = document.getElementById('custom-prompt').value.trim();
        prompt = this.getCustomPrompt(customPrompt);
      }

      console.log('[LinkedIn Job Analyzer] Calling AI service...');
      const summary = await this.callAIService(prompt, this.jobData);
      console.log('[LinkedIn Job Analyzer] AI service response received:', summary);
      this.showResult(summary);
      
    } catch (error) {
      console.error('[LinkedIn Job Analyzer] Summary generation error:', error);
      const errorMsg = this.currentLanguage === 'it' 
        ? 'Impossibile generare il riassunto. Riprova.'
        : 'Failed to generate summary. Please try again.';
      this.showError(errorMsg);
    } finally {
      console.log('[LinkedIn Job Analyzer] Hiding loading state');
      this.showLoading(false);
    }
  }

  getPredefinedPrompt() {
    const selectedSections = this.getSelectedSections();
    const hasCompanyReviews = this.hasCompanyReviewsSelected();
    
    if (selectedSections.length === 0) {
      return this.getDefaultPrompt();
    }
    
    if (this.currentLanguage === 'it') {
      const webSearchInstructions = hasCompanyReviews 
        ? `\n- Se sono incluse le "Recensioni Azienda", utilizza la ricerca web per trovare recensioni recenti dei dipendenti dell'azienda menzionata nella descrizione del lavoro su piattaforme come Glassdoor, Indeed e altri siti di recensioni. Cerca informazioni su soddisfazione dei dipendenti, equilibrio vita-lavoro, qualità del management e cultura aziendale.`
        : '';

      return `Analizza la seguente offerta di lavoro e restituisci un oggetto JSON con i campi richiesti.

Campi da includere basati sulle sezioni selezionate:
${selectedSections.map(section => `• ${section}`).join('\n')}

Regole per la risposta:
- Usa SOLO JSON valido con la struttura completa includenedo i nuovi campi: {"jobTitle": "string", "company": "string", "salary": "string", "location": "string", "benefits": "string", "requiredSkills": "string", "teamCulture": "string", "companyReviews": "string", "workLifeBalance": "string", "managementQuality": "string", "companyCultureReviews": "string"}
- Per i campi non richiesti o non disponibili, usa "Non specificato"
- Rispondi in italiano, ma mantieni in inglese i termini tecnici comuni
- Per lo stipendio, includi eventuali fasce, benefit o dettagli sui compensi
- Per la location, specifica opzioni remote/hybrid/in sede se menzionate${webSearchInstructions}`;
    }
    
    const webSearchInstructions = hasCompanyReviews 
      ? `\n- If "Company Reviews" are included, use web search to find recent employee reviews of the company mentioned in the job posting from platforms like Glassdoor, Indeed, and other review sites. Look for information about employee satisfaction, work-life balance, management quality, and company culture.`
      : '';
    
    return `Please analyze the following job posting and return a JSON object with the requested fields.

Fields to include based on selected sections:
${selectedSections.map(section => `• ${section}`).join('\n')}

Response rules:
- Use ONLY valid JSON with complete structure including new fields: {"jobTitle": "string", "company": "string", "salary": "string", "location": "string", "benefits": "string", "requiredSkills": "string", "teamCulture": "string", "companyReviews": "string", "workLifeBalance": "string", "managementQuality": "string", "companyCultureReviews": "string"}
- For fields not requested or not available, use "Not specified"
- For salary, include any mentioned ranges, benefits, or compensation details
- For location, specify remote/hybrid/on-site options if mentioned${webSearchInstructions}`;
  }

  getSelectedSections() {
    const checkboxes = document.querySelectorAll('#predefined-option input[type="checkbox"]');
    const sections = [];
    
    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        const sectionMap = this.currentLanguage === 'it' ? {
          0: 'Titolo Lavoro e Azienda',
          1: 'Stipendio e Compensi',
          2: 'Luogo di Lavoro e Remote Working',
          3: 'Benefit e Vantaggi',
          4: 'Competenze ed Esperienza Richieste',
          5: 'Team e Cultura Aziendale',
          6: 'Recensioni Azienda (Ricerca Web)'
        } : {
          0: 'Job Title & Company',
          1: 'Salary & Compensation',
          2: 'Work Location & Remote Options', 
          3: 'Benefits & Perks',
          4: 'Required Skills & Experience',
          5: 'Team & Company Culture',
          6: 'Company Reviews (Web Search)'
        };
        sections.push(sectionMap[index]);
      }
    });
    
    return sections;
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
          5: ['teamCulture'],
          6: ['companyReviews', 'workLifeBalance', 'managementQuality', 'companyCultureReviews']
        };
        selectedFields.push(...fieldMap[index]);
      }
    });
    
    // Return null if no specific fields selected (use all fields)
    return selectedFields.length > 0 ? selectedFields : null;
  }

  hasCompanyReviewsSelected() {
    const checkboxes = document.querySelectorAll('#predefined-option input[type="checkbox"]');
    return checkboxes[6] && checkboxes[6].checked;
  }

  getDefaultPrompt() {
    if (this.currentLanguage === 'it') {
      return `Analizza la seguente offerta di lavoro e restituisci un oggetto JSON completo.

Regole per la risposta:
- Usa SOLO JSON valido con la struttura: {"jobTitle": "string", "company": "string", "salary": "string", "location": "string", "benefits": "string", "requiredSkills": "string", "teamCulture": "string"}
- Se qualche informazione non è disponibile, usa "Non specificato"
- Rispondi in italiano, ma mantieni in inglese i termini tecnici comuni
- Includi tutte le informazioni disponibili per ogni campo`;
    }
    
    return `Please analyze the following job posting and return a complete JSON object.

Response rules:
- Use ONLY valid JSON with structure: {"jobTitle": "string", "company": "string", "salary": "string", "location": "string", "benefits": "string", "requiredSkills": "string", "teamCulture": "string"}
- If any information is not available, use "Not specified"
- Include all available information for each field`;
  }

  getCustomPrompt(userPrompt) {
    if (this.currentLanguage === 'it') {
      return `Analizza la seguente offerta di lavoro e restituisci un oggetto JSON basato su questa richiesta: "${userPrompt}"

Regole per la risposta:
- Usa SOLO JSON valido con la struttura: {"jobTitle": "string", "company": "string", "salary": "string", "location": "string", "benefits": "string", "requiredSkills": "string", "teamCulture": "string"}
- Concentrati sui campi più rilevanti per la richiesta dell'utente
- Per i campi meno rilevanti, usa "Non specificato" se non disponibili
- Rispondi in italiano, ma mantieni in inglese i termini tecnici comuni`;
    }
    
    return `Please analyze the following job posting and return a JSON object based on this request: "${userPrompt}"

Response rules:
- Use ONLY valid JSON with structure: {"jobTitle": "string", "company": "string", "salary": "string", "location": "string", "benefits": "string", "requiredSkills": "string", "teamCulture": "string"}
- Focus on the fields most relevant to the user's request
- For less relevant fields, use "Not specified" if not available`;
  }

  async callAIService(prompt, jobData) {
    const jobText = `
Job Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Salary: ${jobData.salary}
Description: ${jobData.description}
Benefits: ${jobData.benefits}
Requirements: ${jobData.requirements}
    `.trim();

    const fullPrompt = `${prompt}

Job Posting Data:
${jobText}`;

    // Get selected fields for dynamic schema generation
    const selectedFields = this.getSelectedFieldNames();
    const isCustomFormat = this.selectedFormat === 'custom';
    const customPrompt = isCustomFormat ? document.getElementById('custom-prompt').value.trim() : '';
    const hasCompanyReviews = this.hasCompanyReviewsSelected();

    console.log('[LinkedIn Job Analyzer] Sending message to background script...');
    const response = await chrome.runtime.sendMessage({
      action: 'generateSummary',
      prompt: fullPrompt,
      selectedFields: selectedFields,
      language: this.currentLanguage,
      isCustomFormat: isCustomFormat,
      customPrompt: customPrompt,
      hasCompanyReviews: hasCompanyReviews
    });

    console.log('[LinkedIn Job Analyzer] Background script response:', response);

    if (!response.success) {
      console.error('[LinkedIn Job Analyzer] Background script returned error:', response.error);
      throw new Error(response.error || 'AI service failed');
    }

    // Response is now a JSON object from structured outputs
    return response.summary;
  }

  showLoading(show) {
    const mainContent = document.getElementById('main-content');
    const loading = document.getElementById('loading');
    
    if (show) {
      mainContent.style.display = 'none';
      loading.style.display = 'block';
    } else {
      mainContent.style.display = 'block';
      loading.style.display = 'none';
    }
  }

  showResult(summary) {
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('result-content');
    
    // Check if summary is a JSON object or text (for backward compatibility)
    if (typeof summary === 'object' && summary !== null) {
      if (this.selectedFormat === 'custom') {
        resultContent.innerHTML = this.formatCustomSummary(summary);
      } else {
        resultContent.innerHTML = this.formatStructuredSummary(summary);
      }
    } else {
      // Fallback to old text parsing for any legacy responses
      resultContent.innerHTML = this.formatSummary(summary);
    }
    resultDiv.style.display = 'block';
  }

  formatCustomSummary(data) {
    // For custom format, the field keys are already generated from user's request
    const notSpecifiedValue = this.currentLanguage === 'it' ? 'Non specificato' : 'Not specified';
    const customPrompt = document.getElementById('custom-prompt').value.trim();
    
    // Extract original field labels from user's prompt for display
    const requestedFields = customPrompt
      .split(/[,\n\-•·*]/)
      .map(f => f.trim())
      .filter(f => f.length > 0);
    
    // Create a mapping from camelCase field keys back to original field names
    const fieldKeyToDisplay = {};
    requestedFields.forEach((originalField, index) => {
      const fieldKey = this.createFieldKey(originalField);
      fieldKeyToDisplay[fieldKey] = originalField;
    });
    
    return Object.entries(data).map(([field, value]) => {
      const displayValue = value || notSpecifiedValue;
      const displayField = fieldKeyToDisplay[field] || this.humanizeFieldKey(field);
      
      // Skip fields with "Non specificato" if they weren't explicitly requested
      if (value === notSpecifiedValue && !requestedFields.length) {
        return '';
      }
      
      return `<div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-left: 3px solid #0077b5; border-radius: 0 4px 4px 0;">
                <span style="font-weight: 600; color: #333;">${displayField}:</span>
                <span style="margin-left: 8px; color: #555;">${displayValue}</span>
              </div>`;
    }).filter(html => html.length > 0).join('');
  }
  
  createFieldKey(fieldName) {
    // Mirror the logic from background.js
    return fieldName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '') || 'campo';
  }
  
  humanizeFieldKey(fieldKey) {
    // Convert camelCase back to readable text
    return fieldKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatStructuredSummary(data) {
    const translations = this.currentLanguage === 'it' ? {
      jobTitle: 'Titolo Lavoro',
      company: 'Azienda',
      salary: 'Stipendio',
      location: 'Luogo di Lavoro',
      benefits: 'Benefit',
      requiredSkills: 'Competenze Richieste',
      teamCulture: 'Team e Cultura',
      companyReviews: 'Recensioni Azienda',
      workLifeBalance: 'Equilibrio Vita-Lavoro',
      managementQuality: 'Qualità Management',
      companyCultureReviews: 'Cultura Aziendale (Recensioni)'
    } : {
      jobTitle: 'Job Title',
      company: 'Company',
      salary: 'Salary',
      location: 'Location',
      benefits: 'Benefits',
      requiredSkills: 'Required Skills',
      teamCulture: 'Team Culture',
      companyReviews: 'Company Reviews',
      workLifeBalance: 'Work-Life Balance',
      managementQuality: 'Management Quality',
      companyCultureReviews: 'Company Culture (Reviews)'
    };

    const notSpecifiedValue = this.currentLanguage === 'it' ? 'Non specificato' : 'Not specified';
    const selectedSections = this.getSelectedSections();
    const fieldsToShow = selectedSections.length > 0 ? this.mapSectionsToFields(selectedSections) : Object.keys(translations);
    
    return fieldsToShow.map(field => {
      const value = data[field] || notSpecifiedValue;
      const label = translations[field] || field;
      
      // Skip fields with "Non specificato" / "Not specified" if they weren't explicitly requested
      if ((value === notSpecifiedValue || !value || value.trim() === '') && selectedSections.length > 0) {
        return '';
      }
      
      // Special styling for company review fields
      const isReviewField = ['companyReviews', 'workLifeBalance', 'managementQuality', 'companyCultureReviews'].includes(field);
      const borderColor = isReviewField ? '#28a745' : '#0077b5';
      const backgroundColor = isReviewField ? '#f8fff9' : '#f8f9fa';
      const icon = isReviewField ? '🔍 ' : '';
      
      return `<div style="margin: 8px 0; padding: 8px; background: ${backgroundColor}; border-left: 3px solid ${borderColor}; border-radius: 0 4px 4px 0;">
                <span style="font-weight: 600; color: #333;">${icon}${label}:</span>
                <span style="margin-left: 8px; color: #555;">${value}</span>
              </div>`;
    }).filter(html => html.length > 0).join('');
  }

  mapSectionsToFields(selectedSections) {
    const sectionMap = this.currentLanguage === 'it' ? {
      'Titolo Lavoro e Azienda': ['jobTitle', 'company'],
      'Stipendio e Compensi': ['salary'],
      'Luogo di Lavoro e Remote Working': ['location'],
      'Benefit e Vantaggi': ['benefits'],
      'Competenze ed Esperienza Richieste': ['requiredSkills'],
      'Team e Cultura Aziendale': ['teamCulture'],
      'Recensioni Azienda (Ricerca Web)': ['companyReviews', 'workLifeBalance', 'managementQuality', 'companyCultureReviews']
    } : {
      'Job Title & Company': ['jobTitle', 'company'],
      'Salary & Compensation': ['salary'],
      'Work Location & Remote Options': ['location'],
      'Benefits & Perks': ['benefits'],
      'Required Skills & Experience': ['requiredSkills'],
      'Team & Company Culture': ['teamCulture'],
      'Company Reviews (Web Search)': ['companyReviews', 'workLifeBalance', 'managementQuality', 'companyCultureReviews']
    };
    
    const fields = [];
    selectedSections.forEach(section => {
      if (sectionMap[section]) {
        fields.push(...sectionMap[section]);
      }
    });
    
    return fields.length > 0 ? fields : Object.keys(sectionMap).flatMap(key => sectionMap[key]);
  }

  formatSummary(summary) {
    return summary.split('\n').map(line => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        return '<div style="margin: 8px 0;"></div>';
      }
      
      // Section headers (lines ending with colon)
      if (trimmedLine.endsWith(':')) {
        return `<div style="margin: 12px 0 6px 0; font-weight: bold; color: #0077b5; border-bottom: 1px solid #e3f2fd; padding-bottom: 4px;">${trimmedLine}</div>`;
      }
      
      // Bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        const content = trimmedLine.substring(1).trim();
        const [label, ...valueParts] = content.split(':');
        const value = valueParts.join(':').trim();
        
        if (value) {
          return `<div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-left: 3px solid #0077b5; border-radius: 0 4px 4px 0;">
                    <span style="font-weight: 600; color: #333;">${label.trim()}:</span>
                    <span style="margin-left: 8px; color: #555;">${value}</span>
                  </div>`;
        } else {
          return `<div style="margin: 6px 0; padding: 6px; color: #666;">${content}</div>`;
        }
      }
      
      // Regular text
      return `<div style="margin: 6px 0; color: #555; line-height: 1.4;">${trimmedLine}</div>`;
    }).join('');
  }

  showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  hideError() {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
  }

  hideInfo() {
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
      infoDiv.style.display = 'none';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});