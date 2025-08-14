class PopupController {
  constructor() {
    this.selectedFormat = null;
    this.jobData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkCurrentTab();
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
        guidance = `📍 Almost there! Click on any job posting to open the detailed view, then use this extension.`;
      } else {
        guidance = `📍 Please navigate to LinkedIn Jobs:\n\n1. Go to linkedin.com/jobs\n2. Search for jobs\n3. Click on any job posting\n4. Then use this extension`;
      }
    } else {
      guidance = `📍 Please navigate to a LinkedIn job posting:\n\n1. Go to www.linkedin.com/jobs or it.linkedin.com/jobs\n2. Search for jobs\n3. Click on any job posting\n4. The URL should look like: linkedin.com/jobs/view/123456789`;
    }
    
    this.showInfo(guidance);
  }

  showJobPageDetected() {
    const infoDiv = document.getElementById('info');
    if (infoDiv) {
      infoDiv.innerHTML = '✅ LinkedIn job page detected! Choose a format to analyze this job posting.';
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
      
      const response = await chrome.tabs.sendMessage(tabId, { action: 'extractJobData' });
      
      if (response && response.success && response.jobData) {
        this.jobData = response.jobData;
        this.validateExtractedData();
      } else if (response && response.error) {
        this.showError(`Extraction failed: ${response.error}`);
      } else {
        this.showError('Unable to extract job data. The page might still be loading - please wait a moment and try again.');
      }
    } catch (error) {
      // This could be LinkedIn's extension detection causing errors
      if (error.message.includes('Could not establish connection')) {
        this.showError('Unable to connect to the page. Please refresh the LinkedIn job page and try again.');
      } else {
        this.showError('Unable to communicate with the page. Please refresh the LinkedIn job page and try again.');
      }
      console.error('LinkedIn Job Analyzer: Data extraction error', error);
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
      this.showInfo('✅ Job data extracted successfully! Ready to generate summary.');
    } else {
      this.showError('⚠️ Some job data could not be extracted. The summary may be incomplete. Try refreshing the page or scrolling down to load all content.');
    }
  }

  async generateSummary() {
    if (!this.jobData) {
      this.showError('No job data available. Please refresh the LinkedIn job page and try again.');
      return;
    }

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

      const summary = await this.callAIService(prompt, this.jobData);
      this.showResult(summary);
      
    } catch (error) {
      this.showError('Failed to generate summary. Please try again.');
      console.error('Summary generation error:', error);
    } finally {
      this.showLoading(false);
    }
  }

  getPredefinedPrompt() {
    return `Please analyze the following job posting and create a structured summary with these sections:

• Job Title
• Company
• Salary Range
• Work Location
• Benefits

Format each section as a bullet point with clear, concise information. If any information is not available, indicate "Not specified".`;
  }

  getCustomPrompt(userPrompt) {
    return `Please analyze the following job posting and create a summary based on this request: "${userPrompt}"

Provide a clear, structured response that addresses the user's specific requirements.`;
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

    const response = await chrome.runtime.sendMessage({
      action: 'generateSummary',
      prompt: fullPrompt
    });

    if (!response.success) {
      throw new Error(response.error || 'AI service failed');
    }

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
    
    resultContent.innerHTML = this.formatSummary(summary);
    resultDiv.style.display = 'block';
  }

  formatSummary(summary) {
    return summary.split('\n').map(line => {
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return `<div style="margin: 5px 0;">${line.trim()}</div>`;
      }
      return `<div style="margin: 8px 0; font-weight: ${line.trim().endsWith(':') ? 'bold' : 'normal'};">${line.trim()}</div>`;
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