import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock DOM helper functions
function createMockDOM() {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Create mock LinkedIn job page elements
  const container = document.createElement('div');
  container.innerHTML = `
    <h1 data-test-job-title>Senior Software Engineer</h1>
    <a data-test-job-details-job-summary-info-company-name href="#">Tech Corporation</a>
    <div class="job-details-jobs-unified-top-card__primary-description-text">
      San Francisco, CA · Remote
    </div>
    <div class="job-details-jobs-unified-top-card__job-insight">
      $120,000 - $160,000 per year
    </div>
    <div class="jobs-description-content__text">
      We are looking for a talented Senior Software Engineer to join our dynamic team. 
      The ideal candidate will have strong experience in JavaScript, React, and Node.js.
      This role offers great benefits including health insurance, dental coverage, 
      401k matching, and flexible vacation time. The successful candidate must have 
      at least 5 years of experience in software development and strong communication skills.
      Our team culture emphasizes collaboration, innovation, and work-life balance.
    </div>
  `;
  document.body.appendChild(container);
}

function createMockDOMWithMissingElements() {
  document.body.innerHTML = `
    <div class="some-other-content">Not a job page</div>
  `;
}

function createMockDOMWithAlternativeSelectors() {
  document.body.innerHTML = `
    <h1 class="jobs-unified-top-card__job-title">Alternative Title Format</h1>
    <div class="jobs-unified-top-card__company-name">Alternative Company</div>
    <div class="jobs-unified-top-card__bullet">Alternative Location</div>
    <div class="jobs-unified-top-card__job-insight-text">€80,000 - €120,000</div>
    <div class="jobs-box__html-content">Alternative description content with benefits like health insurance and requirements including JavaScript skills.</div>
  `;
}

// Mock LinkedInJobExtractor class (extracted from content.js)
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

    // If no description found, try one more time
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 50) {
        return element.textContent.trim();
      }
    }

    return 'Description not found';
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

describe('[LinkedIn Job Analyzer] LinkedInJobExtractor', () => {
  let extractor;

  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = { href: 'https://linkedin.com/jobs/view/123456789' };
    
    createMockDOM();
    extractor = new LinkedInJobExtractor();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor and Page Detection', () => {
    it('should initialize with job page detection', () => {
      expect(extractor.jobData).toBeNull();
      expect(extractor.isJobPage).toBe(true);
    });

    it('should detect valid LinkedIn job URLs', () => {
      const validUrls = [
        'https://linkedin.com/jobs/view/123456789',
        'https://it.linkedin.com/jobs/view/987654321',
        'https://www.linkedin.com/jobs/view/555',
        'https://linkedin.com/jobs/collections/recommended'
      ];
      
      validUrls.forEach(url => {
        window.location.href = url;
        const testExtractor = new LinkedInJobExtractor();
        expect(testExtractor.detectJobPage()).toBe(true);
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
        window.location.href = url;
        const testExtractor = new LinkedInJobExtractor();
        expect(testExtractor.detectJobPage()).toBe(false);
      });
    });
  });

  describe('extractJobData', () => {
    it('should extract complete job data successfully', () => {
      const jobData = extractor.extractJobData();
      
      expect(jobData).not.toBeNull();
      expect(jobData.title).toBe('Senior Software Engineer');
      expect(jobData.company).toBe('Tech Corporation');
      expect(jobData.location).toBe('San Francisco, CA');
      expect(jobData.salary).toBe('$120,000 - $160,000 per year');
      expect(jobData.description).toContain('talented Senior Software Engineer');
      expect(jobData.url).toBe('https://linkedin.com/jobs/view/123456789');
    });

    it('should return null for non-job pages', () => {
      window.location.href = 'https://linkedin.com/feed';
      const nonJobExtractor = new LinkedInJobExtractor();
      
      const jobData = nonJobExtractor.extractJobData();
      
      expect(jobData).toBeNull();
    });

    it('should handle extraction errors gracefully', () => {
      // Mock an error in one of the extraction methods
      const originalExtractTitle = extractor.extractJobTitle;
      extractor.extractJobTitle = () => { throw new Error('Test error'); };
      
      const jobData = extractor.extractJobData();
      
      expect(jobData).toBeNull();
      
      // Restore original method
      extractor.extractJobTitle = originalExtractTitle;
    });

    it('should store extracted data in jobData property', () => {
      const jobData = extractor.extractJobData();
      
      expect(extractor.jobData).toEqual(jobData);
    });
  });

  describe('extractJobTitle', () => {
    it('should extract job title from primary selector', () => {
      const title = extractor.extractJobTitle();
      expect(title).toBe('Senior Software Engineer');
    });

    it('should try alternative selectors when primary fails', () => {
      createMockDOMWithAlternativeSelectors();
      
      const title = extractor.extractJobTitle();
      expect(title).toBe('Alternative Title Format');
    });

    it('should return fallback message when no title found', () => {
      createMockDOMWithMissingElements();
      
      const title = extractor.extractJobTitle();
      expect(title).toBe('Job title not found');
    });

    it('should handle empty title elements', () => {
      document.querySelector('h1[data-test-job-title]').textContent = '   ';
      
      const title = extractor.extractJobTitle();
      expect(title).toBe('Job title not found');
    });
  });

  describe('extractCompany', () => {
    it('should extract company name from primary selector', () => {
      const company = extractor.extractCompany();
      expect(company).toBe('Tech Corporation');
    });

    it('should try alternative selectors when primary fails', () => {
      createMockDOMWithAlternativeSelectors();
      
      const company = extractor.extractCompany();
      expect(company).toBe('Alternative Company');
    });

    it('should return fallback message when no company found', () => {
      createMockDOMWithMissingElements();
      
      const company = extractor.extractCompany();
      expect(company).toBe('Company not found');
    });
  });

  describe('extractLocation', () => {
    it('should extract location from text with separator', () => {
      const location = extractor.extractLocation();
      expect(location).toBe('San Francisco, CA');
    });

    it('should extract full location when no separator', () => {
      document.querySelector('.job-details-jobs-unified-top-card__primary-description-text').textContent = 'New York, NY';
      
      const location = extractor.extractLocation();
      expect(location).toBe('New York, NY');
    });

    it('should try alternative selectors', () => {
      createMockDOMWithAlternativeSelectors();
      
      const location = extractor.extractLocation();
      expect(location).toBe('Alternative Location');
    });

    it('should return fallback message when no location found', () => {
      createMockDOMWithMissingElements();
      
      const location = extractor.extractLocation();
      expect(location).toBe('Location not found');
    });
  });

  describe('extractSalary', () => {
    it('should extract salary with currency symbols', () => {
      const salary = extractor.extractSalary();
      expect(salary).toBe('$120,000 - $160,000 per year');
    });

    it('should detect Euro currency', () => {
      document.querySelector('.job-details-jobs-unified-top-card__job-insight').textContent = '€80,000 - €120,000';
      
      const salary = extractor.extractSalary();
      expect(salary).toBe('€80,000 - €120,000');
    });

    it('should detect salary keywords in English', () => {
      document.querySelector('.job-details-jobs-unified-top-card__job-insight').textContent = 'Competitive salary offered';
      
      const salary = extractor.extractSalary();
      expect(salary).toBe('Competitive salary offered');
    });

    it('should detect salary keywords in Italian', () => {
      document.querySelector('.job-details-jobs-unified-top-card__job-insight').textContent = 'Stipendio competitivo';
      
      const salary = extractor.extractSalary();
      expect(salary).toBe('Stipendio competitivo');
    });

    it('should return fallback message when no salary found', () => {
      document.querySelector('.job-details-jobs-unified-top-card__job-insight').textContent = 'No salary info';
      
      const salary = extractor.extractSalary();
      expect(salary).toBe('Salary not specified');
    });
  });

  describe('extractDescription', () => {
    it('should extract description from primary selector', () => {
      const description = extractor.extractDescription();
      expect(description).toContain('talented Senior Software Engineer');
      expect(description.length).toBeGreaterThan(50);
    });

    it('should try alternative selectors', () => {
      createMockDOMWithAlternativeSelectors();
      
      const description = extractor.extractDescription();
      expect(description).toContain('Alternative description content');
    });

    it('should handle show more buttons', () => {
      // Add a show more button
      const showMoreBtn = document.createElement('button');
      showMoreBtn.setAttribute('aria-label', 'Show more');
      showMoreBtn.style.display = 'block';
      document.body.appendChild(showMoreBtn);
      
      const clickSpy = vi.spyOn(showMoreBtn, 'click');
      
      extractor.extractDescription();
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle Italian show more buttons', () => {
      const showMoreBtn = document.createElement('button');
      showMoreBtn.setAttribute('aria-label', 'Mostra di più');
      showMoreBtn.style.display = 'block';
      document.body.appendChild(showMoreBtn);
      
      const clickSpy = vi.spyOn(showMoreBtn, 'click');
      
      extractor.extractDescription();
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should return fallback message for short or missing descriptions', () => {
      document.querySelector('.jobs-description-content__text').textContent = 'Short';
      
      const description = extractor.extractDescription();
      expect(description).toBe('Description not found');
    });
  });

  describe('extractBenefits', () => {
    it('should extract benefits from description', () => {
      const benefits = extractor.extractBenefits();
      
      expect(benefits).toContain('health insurance');
      expect(benefits).toContain('dental coverage');
      expect(benefits).toContain('401k matching');
    });

    it('should limit to 3 benefits', () => {
      // Add more benefits to description
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = desc.textContent + ' Additional benefits include vision insurance. More perks available. Extra vacation days. Retirement planning. Stock options.';
      
      const benefits = extractor.extractBenefits();
      const benefitCount = benefits.split(';').length;
      
      expect(benefitCount).toBeLessThanOrEqual(3);
    });

    it('should detect Italian benefit keywords', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = 'Offriamo ottimi benefici come assicurazione sanitaria e welfare aziendale.';
      
      const benefits = extractor.extractBenefits();
      
      expect(benefits).toContain('assicurazione sanitaria');
    });

    it('should return fallback message when no benefits found', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = 'No benefits mentioned in this job posting.';
      
      const benefits = extractor.extractBenefits();
      
      expect(benefits).toBe('Benefits not specified');
    });

    it('should avoid duplicate benefits', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = 'Health insurance provided. Health insurance coverage available. Health insurance included.';
      
      const benefits = extractor.extractBenefits();
      
      // Should not have the same sentence repeated
      const sentences = benefits.split(';');
      const uniqueSentences = [...new Set(sentences.map(s => s.trim()))];
      expect(sentences.length).toBe(uniqueSentences.length);
    });
  });

  describe('extractRequirements', () => {
    it('should extract requirements from description', () => {
      const requirements = extractor.extractRequirements();
      
      expect(requirements).toContain('5 years of experience');
      expect(requirements).toContain('communication skills');
    });

    it('should limit to 3 requirements', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = desc.textContent + ' Additional requirements include Python skills. More qualifications needed. Advanced degree required. Certification mandatory. Leadership experience.';
      
      const requirements = extractor.extractRequirements();
      const requirementCount = requirements.split(';').length;
      
      expect(requirementCount).toBeLessThanOrEqual(3);
    });

    it('should detect Italian requirement keywords', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = 'I requisiti includono esperienza in JavaScript e competenze di comunicazione.';
      
      const requirements = extractor.extractRequirements();
      
      expect(requirements).toContain('requisiti');
    });

    it('should return fallback message when no requirements found', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = 'No specific requirements mentioned.';
      
      const requirements = extractor.extractRequirements();
      
      expect(requirements).toBe('Requirements not specified');
    });

    it('should filter out short sentences', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = 'Requirements: Short. Experience in software development required for this position.';
      
      const requirements = extractor.extractRequirements();
      
      expect(requirements).not.toContain('Short');
      expect(requirements).toContain('experience in software development required');
    });

    it('should avoid duplicate requirements', () => {
      const desc = document.querySelector('.jobs-description-content__text');
      desc.textContent = 'JavaScript experience required. JavaScript skills needed. JavaScript experience mandatory.';
      
      const requirements = extractor.extractRequirements();
      
      // Should not have the same sentence repeated
      const sentences = requirements.split(';');
      const uniqueSentences = [...new Set(sentences.map(s => s.trim()))];
      expect(sentences.length).toBe(uniqueSentences.length);
    });
  });

  describe('Multiple Selector Strategies', () => {
    it('should work with different LinkedIn page layouts', () => {
      // Test with alternative selectors
      document.body.innerHTML = `
        <div class="jobs-unified-top-card__job-title">
          <h1>Alternative Layout Title</h1>
        </div>
        <div class="jobs-unified-top-card__company-name">
          <a href="#">Alternative Company</a>
        </div>
        <div class="jobs-unified-top-card__bullet">Alternative Location</div>
        <div class="jobs-unified-top-card__job-insight-text">Alternative Salary</div>
        <div class="jobs-box__html-content">
          Alternative description with health benefits and JavaScript requirements.
        </div>
      `;
      
      const jobData = extractor.extractJobData();
      
      expect(jobData.title).toBe('Alternative Layout Title');
      expect(jobData.company).toBe('Alternative Company');
      expect(jobData.location).toBe('Alternative Location');
      expect(jobData.salary).toBe('Alternative Salary');
      expect(jobData.description).toContain('Alternative description');
    });

    it('should handle mixed availability of selectors', () => {
      // Remove some elements, keep others
      document.querySelector('h1[data-test-job-title]').remove();
      document.querySelector('.job-details-jobs-unified-top-card__job-insight').remove();
      
      const jobData = extractor.extractJobData();
      
      expect(jobData.title).toBe('Job title not found');
      expect(jobData.company).toBe('Tech Corporation'); // Still available
      expect(jobData.salary).toBe('Salary not specified');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined elements', () => {
      document.body.innerHTML = '<div>Empty page</div>';
      
      expect(() => extractor.extractJobData()).not.toThrow();
      
      const jobData = extractor.extractJobData();
      expect(jobData.title).toBe('Job title not found');
      expect(jobData.company).toBe('Company not found');
    });

    it('should handle elements with whitespace-only content', () => {
      const titleElement = document.querySelector('h1[data-test-job-title]');
      titleElement.textContent = '   \n\t   ';
      
      const title = extractor.extractJobTitle();
      expect(title).toBe('Job title not found');
    });

    it('should handle special characters in content', () => {
      const titleElement = document.querySelector('h1[data-test-job-title]');
      titleElement.textContent = 'Senior Software Engineer & Team Lead';
      
      const title = extractor.extractJobTitle();
      expect(title).toBe('Senior Software Engineer & Team Lead');
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'Very long description. '.repeat(1000);
      document.querySelector('.jobs-description-content__text').textContent = longDescription;
      
      const description = extractor.extractDescription();
      expect(description.length).toBeGreaterThan(50);
      expect(description).toContain('Very long description');
    });
  });

  describe('URL and Context Handling', () => {
    it('should include current URL in job data', () => {
      const jobData = extractor.extractJobData();
      
      expect(jobData.url).toBe('https://linkedin.com/jobs/view/123456789');
    });

    it('should handle different LinkedIn domains', () => {
      window.location.href = 'https://it.linkedin.com/jobs/view/987654321';
      
      const jobData = extractor.extractJobData();
      
      expect(jobData.url).toBe('https://it.linkedin.com/jobs/view/987654321');
    });
  });
});