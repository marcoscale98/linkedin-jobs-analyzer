class LinkedInJobExtractor {
  constructor() {
    this.jobData = null;
    this.isJobPage = this.detectJobPage();
  }

  detectJobPage() {
    const url = window.location.href;
    return url.includes('/jobs/view/') || 
           url.includes('/jobs/collections/') ||
           url.match(/linkedin\.com\/jobs\/view\/\d+/) ||
           url.match(/it\.linkedin\.com\/jobs\/view\/\d+/);
  }

  extractJobData() {
    if (!this.isJobPage) {
      return null;
    }

    try {
      const jobData = {
        title: this.extractJobTitle(),
        company: this.extractCompany(),
        location: this.extractLocation(),
        salary: this.extractSalary(),
        description: this.extractDescription(),
        benefits: this.extractBenefits(),
        requirements: this.extractRequirements(),
        url: window.location.href
      };

      this.jobData = jobData;
      return jobData;
    } catch (error) {
      console.error('Error extracting job data:', error);
      return null;
    }
  }

  extractJobTitle() {
    const selectors = [
      'h1[data-test-job-title]',
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      'h1.top-card-layout__title',
      '.jobs-unified-top-card__job-title a',
      '.job-details-jobs-unified-top-card__job-title a',
      '.jobs-search__job-details--container h1',
      '.jobs-details__main-content h1',
      'h1[class*="job"][class*="title"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return 'Job title not found';
  }

  extractCompany() {
    const selectors = [
      'a[data-test-job-details-job-summary-info-company-name]',
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a',
      '.top-card-layout__card .top-card-layout__entity-info a',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-search__job-details--container .jobs-unified-top-card__company-name',
      'a[data-control-name="job_details_topcard_company_url"]',
      '.jobs-details__main-content .jobs-unified-top-card__company-name'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return 'Company not found';
  }

  extractLocation() {
    const selectors = [
      '.job-details-jobs-unified-top-card__primary-description-text',
      '.jobs-unified-top-card__bullet',
      '.top-card-layout__card .top-card-layout__entity-info .top-card-layout__flavor'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.includes('·')) {
        const parts = element.textContent.split('·');
        if (parts.length >= 2) {
          return parts[0].trim();
        }
      }
      if (element) {
        return element.textContent.trim();
      }
    }

    return 'Location not found';
  }

  extractSalary() {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__primary-description-text',
      '.jobs-unified-top-card__job-insight-text',
      '.job-details-jobs-unified-top-card__job-insight-text'
    ];

    const salaryKeywords = {
      en: ['salary', 'compensation', 'pay', 'wage', 'income'],
      it: ['stipendio', 'retribuzione', 'compenso', 'paga', 'reddito']
    };

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim().toLowerCase();
        
        // Check for currency symbols
        if (element.textContent.includes('$') || element.textContent.includes('€') || 
            element.textContent.includes('£') || element.textContent.includes('USD') ||
            element.textContent.includes('EUR')) {
          return element.textContent.trim();
        }
        
        // Check for salary keywords in English and Italian
        const allKeywords = [...salaryKeywords.en, ...salaryKeywords.it];
        if (allKeywords.some(keyword => text.includes(keyword))) {
          return element.textContent.trim();
        }
      }
    }

    return 'Salary not specified';
  }

  extractDescription() {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-description',
      '.jobs-box__html-content',
      '.job-details-module__content',
      'div[data-job-id] .jobs-description-content__text',
      '.jobs-description-content__text',
      '.jobs-description',
      '.jobs-box--fadeable',
      '.jobs-details__main-content .jobs-description-content__text',
      '[data-module-id="job-details"] .jobs-description-content__text'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 50) {
        return element.textContent.trim();
      }
    }

    // Try to click show more buttons (both English and Italian)
    const showMoreSelectors = [
      'button[aria-label*="Show more"]',
      'button[aria-label*="Mostra di più"]',
      'button[aria-label*="show more"]',
      'button[aria-label*="mostra di più"]',
      '.jobs-description__footer-button',
      'button[data-control-name="job_details_show_more"]'
    ];

    for (const selector of showMoreSelectors) {
      const showMoreBtn = document.querySelector(selector);
      if (showMoreBtn && showMoreBtn.offsetParent !== null) {
        showMoreBtn.click();
        break;
      }
    }

    // If no description found, try one more time after a brief delay
    const tryAgain = () => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 50) {
          return element.textContent.trim();
        }
      }
      return 'Description not found';
    };

    return tryAgain();
  }

  extractBenefits() {
    const benefitsKeywords = {
      en: ['benefits', 'perks', 'insurance', 'vacation', 'pto', 'retirement', '401k', 'health', 'dental'],
      it: ['benefici', 'vantaggi', 'assicurazione', 'ferie', 'pensione', 'salute', 'dentale', 'welfare']
    };
    
    const description = this.extractDescription().toLowerCase();
    const benefits = [];
    
    const allKeywords = [...benefitsKeywords.en, ...benefitsKeywords.it];
    
    allKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        const sentences = description.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.includes(keyword) && sentence.trim().length > 10 && 
              !benefits.some(b => b.includes(sentence.trim()))) {
            benefits.push(sentence.trim());
          }
        });
      }
    });

    return benefits.length > 0 ? benefits.slice(0, 3).join('; ') : 'Benefits not specified';
  }

  extractRequirements() {
    const description = this.extractDescription().toLowerCase();
    const requirementsKeywords = {
      en: ['requirements', 'qualifications', 'skills', 'experience', 'must have', 'required'],
      it: ['requisiti', 'qualifiche', 'competenze', 'esperienza', 'richiesto', 'necessario']
    };
    
    const requirements = [];
    const allKeywords = [...requirementsKeywords.en, ...requirementsKeywords.it];
    
    allKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        const sentences = description.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.includes(keyword) && sentence.trim().length > 15 && 
              !requirements.some(r => r.includes(sentence.trim()))) {
            requirements.push(sentence.trim());
          }
        });
      }
    });

    return requirements.length > 0 ? requirements.slice(0, 3).join('; ') : 'Requirements not specified';
  }
}

let jobExtractor = null;

try {
  jobExtractor = new LinkedInJobExtractor();
  console.log('LinkedIn Job Analyzer: Content script loaded');
} catch (error) {
  console.error('LinkedIn Job Analyzer: Error initializing extractor', error);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'extractJobData') {
      if (!jobExtractor) {
        jobExtractor = new LinkedInJobExtractor();
      }
      
      const jobData = jobExtractor.extractJobData();
      console.log('LinkedIn Job Analyzer: Extracted job data', jobData);
      sendResponse({ jobData: jobData, success: true });
    }
  } catch (error) {
    console.error('LinkedIn Job Analyzer: Error processing message', error);
    sendResponse({ jobData: null, success: false, error: error.message });
  }
  return true;
});