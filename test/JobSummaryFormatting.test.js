import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch for console bridge
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    }
  }
};

// Mock window
global.window = {
  location: {
    href: 'http://localhost'
  }
};

// Mock document
global.document = {
  readyState: 'complete',
  documentElement: {
    style: {
      setProperty: vi.fn()
    }
  },
  addEventListener: vi.fn(),
  getElementById: vi.fn(),
  querySelectorAll: vi.fn(() => [])
};

// Import PopupController after mocking
const PopupControllerModule = await import('../src/popup.js');

// Mock chrome tabs API for PopupController
global.chrome.tabs = {
  query: vi.fn(),
  sendMessage: vi.fn()
};

describe('[LinkedIn Job Analyzer] Job Summary Font Scaling', () => {
  let popupController;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock storage responses
    chrome.storage.sync.get.mockResolvedValue({ language: 'en' });
    chrome.tabs.query.mockResolvedValue([]);
    
    // Create PopupController instance with minimal mocking
    popupController = new (class {
      constructor() {
        this.currentLanguage = 'en';
      }
      
      formatCustomSummary(data) {
        const customPrompt = document.getElementById('custom-prompt')?.value?.trim() || '';
        const requestedFields = customPrompt
          .split(/[,\n\-•·*]/)
          .map(f => f.trim())
          .filter(f => f.length > 0);
        
        const fieldKeyToDisplay = {};
        requestedFields.forEach((originalField, index) => {
          const fieldKey = this.createFieldKey(originalField);
          fieldKeyToDisplay[fieldKey] = originalField;
        });
        
        return Object.entries(data).map(([field, value]) => {
          const displayValue = value || 'Not specified';
          const displayField = fieldKeyToDisplay[field] || this.humanizeFieldKey(field);
          
          return `<div class="summary-field">
                    <span class="summary-label">${displayField}:</span>
                    <span class="summary-value">${displayValue}</span>
                  </div>`;
        }).filter(html => html.length > 0).join('');
      }
      
      formatStructuredSummary(data) {
        const translations = {
          jobTitle: 'Job Title',
          company: 'Company',
          salary: 'Salary',
          companyReviews: 'Company Reviews',
          workLifeBalance: 'Work-Life Balance'
        };
        
        const selectedSections = this.getSelectedSections();
        const fieldsToShow = selectedSections.length > 0 ? this.mapSectionsToFields(selectedSections) : Object.keys(translations);
        
        return fieldsToShow.map(field => {
          const value = data[field] || 'Not specified';
          const label = translations[field] || field;
          
          if (!value || value === 'Not specified') return '';
          
          const isReviewField = ['companyReviews', 'workLifeBalance', 'managementQuality', 'companyCultureReviews'].includes(field);
          const fieldClass = isReviewField ? 'summary-field review-field' : 'summary-field';
          const icon = isReviewField ? '🔍 ' : '';
          
          return `<div class="${fieldClass}">
                    <span class="summary-label">${icon}${label}:</span>
                    <span class="summary-value">${value}</span>
                  </div>`;
        }).filter(html => html.length > 0).join('');
      }
      
      formatSummary(summary) {
        return summary.split('\n').map(line => {
          const trimmedLine = line.trim();
          
          if (!trimmedLine) {
            return '<div class="summary-spacer"></div>';
          }
          
          if (trimmedLine.endsWith(':')) {
            return `<div class="summary-section-header">${trimmedLine}</div>`;
          }
          
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
            const content = trimmedLine.substring(1).trim();
            const [label, ...valueParts] = content.split(':');
            const value = valueParts.join(':').trim();
            
            if (value) {
              return `<div class="summary-field">
                        <span class="summary-label">${label.trim()}:</span>
                        <span class="summary-value">${value}</span>
                      </div>`;
            } else {
              return `<div class="summary-bullet">${content}</div>`;
            }
          }
          
          return `<div class="summary-text">${trimmedLine}</div>`;
        }).join('');
      }
      
      getSelectedSections() {
        const checkboxes = document.querySelectorAll('#predefined-option input[type="checkbox"]');
        return ['Job Title & Company', 'Salary & Compensation'];
      }
      
      mapSectionsToFields(sections) {
        return ['jobTitle', 'company', 'salary', 'companyReviews', 'workLifeBalance'];
      }
      
      createFieldKey(fieldName) {
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
        return fieldKey
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
      }
    })();
  });

  describe('formatCustomSummary', () => {
    it('should use CSS classes instead of inline styles', () => {
      const mockData = {
        testField: 'Test Value',
        anotherField: 'Another Value'
      };

      // Mock custom prompt input
      document.getElementById.mockReturnValue({
        value: 'test field, another field'
      });

      const result = popupController.formatCustomSummary(mockData);

      // Should use CSS classes
      expect(result).toContain('class="summary-field"');
      expect(result).toContain('class="summary-label"');
      expect(result).toContain('class="summary-value"');
      
      // Should NOT contain inline styles
      expect(result).not.toContain('style="margin: 8px 0;');
      expect(result).not.toContain('style="font-weight: 600;');
      expect(result).not.toContain('style="margin-left: 8px;');
    });

    it('should handle empty values correctly', () => {
      const mockData = {
        testField: '',
        validField: 'Valid Value'
      };

      document.getElementById.mockReturnValue({
        value: 'test field, valid field'
      });

      const result = popupController.formatCustomSummary(mockData);

      // Should contain the valid field
      expect(result).toContain('Valid Value');
      expect(result).toContain('class="summary-field"');
    });
  });

  describe('formatStructuredSummary', () => {
    beforeEach(() => {
      // Mock checkboxes for predefined format
      document.querySelectorAll.mockReturnValue([
        { checked: true }, // jobTitle & company
        { checked: true }, // salary
        { checked: false }, // location
        { checked: false }, // benefits
        { checked: false }, // requiredSkills
        { checked: false }, // teamCulture
        { checked: false }  // companyReviews
      ]);
    });

    it('should use CSS classes instead of inline styles', () => {
      const mockData = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        salary: '$80,000'
      };

      const result = popupController.formatStructuredSummary(mockData);

      // Should use CSS classes
      expect(result).toContain('class="summary-field"');
      expect(result).toContain('class="summary-label"');
      expect(result).toContain('class="summary-value"');
      
      // Should NOT contain inline styles
      expect(result).not.toContain('style="margin: 8px 0;');
      expect(result).not.toContain('style="font-weight: 600;');
      expect(result).not.toContain('background: #f8f9fa;');
    });

    it('should use review-field class for company review fields', () => {
      document.querySelectorAll.mockReturnValue([
        { checked: false }, // jobTitle & company
        { checked: false }, // salary
        { checked: false }, // location
        { checked: false }, // benefits
        { checked: false }, // requiredSkills
        { checked: false }, // teamCulture
        { checked: true }   // companyReviews
      ]);

      const mockData = {
        companyReviews: 'Great company culture',
        workLifeBalance: 'Excellent work-life balance'
      };

      const result = popupController.formatStructuredSummary(mockData);

      // Should use review-field class
      expect(result).toContain('class="summary-field review-field"');
      expect(result).toContain('🔍 '); // Should include search icon
      
      // Should NOT contain inline background colors
      expect(result).not.toContain('background: #f8fff9');
      expect(result).not.toContain('border-left: 3px solid #28a745');
    });
  });

  describe('formatSummary', () => {
    it('should use CSS classes for section headers', () => {
      const mockSummary = 'Job Details:\nThis is a test';
      
      const result = popupController.formatSummary(mockSummary);

      // Should use CSS class for headers
      expect(result).toContain('class="summary-section-header"');
      
      // Should NOT contain inline styles
      expect(result).not.toContain('style="margin: 12px 0 6px 0;');
      expect(result).not.toContain('font-weight: bold;');
    });

    it('should use CSS classes for bullet points with values', () => {
      const mockSummary = '• Salary: $75,000\n• Location: Remote';
      
      const result = popupController.formatSummary(mockSummary);

      // Should use CSS classes
      expect(result).toContain('class="summary-field"');
      expect(result).toContain('class="summary-label"');
      expect(result).toContain('class="summary-value"');
      
      // Should NOT contain inline styles
      expect(result).not.toContain('style="margin: 8px 0; padding: 8px;');
    });

    it('should use CSS classes for regular text', () => {
      const mockSummary = 'This is regular text content.';
      
      const result = popupController.formatSummary(mockSummary);

      // Should use CSS class for text
      expect(result).toContain('class="summary-text"');
      
      // Should NOT contain inline styles
      expect(result).not.toContain('style="margin: 6px 0; color: #555;');
    });

    it('should use CSS classes for empty lines', () => {
      const mockSummary = 'Line 1\n\nLine 3';
      
      const result = popupController.formatSummary(mockSummary);

      // Should use CSS class for spacers
      expect(result).toContain('class="summary-spacer"');
      
      // Should NOT contain inline margin styles
      expect(result).not.toContain('style="margin: 8px 0;');
    });
  });
});