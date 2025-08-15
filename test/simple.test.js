import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple test to verify basic functionality
describe('[LinkedIn Job Analyzer] Basic Functionality Tests', () => {
  describe('SchemaManager Core Logic', () => {
    // Mock SchemaManager without Chrome dependencies
    class SchemaManager {
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

      parseCustomPrompt(prompt) {
        if (!prompt.trim()) return [];
        
        const rawFields = prompt
          .split(/[,\n\-•·*]/)
          .map(field => field.trim())
          .filter(field => field.length > 0);
        
        return rawFields.map(field => ({
          name: field,
          originalText: field
        }));
      }

      getDefaultNotSpecifiedValue(language = 'en') {
        return language === 'it' ? 'Non specificato' : 'Not specified';
      }
    }

    let schemaManager;

    beforeEach(() => {
      schemaManager = new SchemaManager();
    });

    it('should convert field names to camelCase', () => {
      expect(schemaManager.createFieldKey('job title')).toBe('jobTitle');
      expect(schemaManager.createFieldKey('company name')).toBe('companyName');
      expect(schemaManager.createFieldKey('required skills')).toBe('requiredSkills');
    });

    it('should handle special characters in field names', () => {
      expect(schemaManager.createFieldKey('job-title')).toBe('jobtitle');
      expect(schemaManager.createFieldKey('job & benefits')).toBe('jobBenefits');
      expect(schemaManager.createFieldKey('salary/compensation')).toBe('salarycompensation');
    });

    it('should parse comma-separated custom prompts', () => {
      const result = schemaManager.parseCustomPrompt('job title, company name, salary');
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('job title');
      expect(result[1].name).toBe('company name');
      expect(result[2].name).toBe('salary');
    });

    it('should parse bullet-separated custom prompts', () => {
      const result = schemaManager.parseCustomPrompt('- team size\n• remote policy\n* benefits');
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('team size');
      expect(result[1].name).toBe('remote policy');
      expect(result[2].name).toBe('benefits');
    });

    it('should return correct default values for languages', () => {
      expect(schemaManager.getDefaultNotSpecifiedValue('en')).toBe('Not specified');
      expect(schemaManager.getDefaultNotSpecifiedValue('it')).toBe('Non specificato');
    });

    it('should handle empty prompts', () => {
      expect(schemaManager.parseCustomPrompt('')).toHaveLength(0);
      expect(schemaManager.parseCustomPrompt('   ')).toHaveLength(0);
    });
  });

  describe('LinkedIn URL Detection', () => {
    function isLinkedInJobPage(url) {
      return !!(url.includes('linkedin.com/jobs/view/') || 
               url.includes('it.linkedin.com/jobs/view/') ||
               url.match(/linkedin\.com\/jobs\/view\/\d+/) ||
               url.match(/it\.linkedin\.com\/jobs\/view\/\d+/));
    }

    it('should detect valid LinkedIn job URLs', () => {
      const validUrls = [
        'https://www.linkedin.com/jobs/view/123456789',
        'https://it.linkedin.com/jobs/view/987654321',
        'https://linkedin.com/jobs/view/555'
      ];
      
      validUrls.forEach(url => {
        expect(isLinkedInJobPage(url)).toBe(true);
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
        expect(isLinkedInJobPage(url)).toBe(false);
      });
    });
  });

  describe('API Key Validation', () => {
    function validateApiKey(apiKey) {
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    }

    it('should validate correct API key format', () => {
      const validKeys = [
        'sk-123456789012345678901234567890',
        'sk-abcdef123456789012345678901234567890'
      ];
      
      validKeys.forEach(key => {
        expect(validateApiKey(key)).toBe(true);
      });
    });

    it('should reject invalid API key formats', () => {
      const invalidKeys = [
        'invalid-key',
        'sk-',
        'sk-short',
        'pk-123456789012345678901234567890',
        ''
      ];
      
      invalidKeys.forEach(key => {
        expect(validateApiKey(key)).toBe(false);
      });
    });
  });

  describe('Summary Formatting', () => {
    function formatCustomSummary(data, language = 'en') {
      const notSpecifiedValue = language === 'it' ? 'Non specificato' : 'Not specified';
      
      return Object.entries(data).map(([field, value]) => {
        const displayValue = value || notSpecifiedValue;
        const displayField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        
        return `${displayField}: ${displayValue}`;
      }).join('\n');
    }

    it('should format summary data correctly', () => {
      const data = {
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        salaryRange: 'Not specified'
      };
      
      const formatted = formatCustomSummary(data);
      
      expect(formatted).toContain('Job Title: Software Engineer');
      expect(formatted).toContain('Company Name: Tech Corp');
      expect(formatted).toContain('Salary Range: Not specified');
    });

    it('should use Italian not specified values', () => {
      const data = {
        jobTitle: '',
        company: 'Azienda Test'
      };
      
      const formatted = formatCustomSummary(data, 'it');
      
      expect(formatted).toContain('Job Title: Non specificato');
      expect(formatted).toContain('Company: Azienda Test');
    });
  });

  describe('Text Processing', () => {
    function extractSalaryFromText(text) {
      const currencyRegex = /[\$€£][\d,]+(?:-[\$€£]?[\d,]+)?/g;
      const match = text.match(currencyRegex);
      return match ? match[0] : 'Salary not specified';
    }

    function extractBenefitsFromText(text) {
      const benefitsKeywords = ['benefits', 'insurance', 'vacation', 'health', 'dental'];
      const sentences = text.toLowerCase().split(/[.!?]/);
      
      const benefits = sentences.filter(sentence => 
        benefitsKeywords.some(keyword => sentence.includes(keyword))
      );
      
      return benefits.length > 0 ? benefits.slice(0, 3).join('; ') : 'Benefits not specified';
    }

    it('should extract salary information from text', () => {
      expect(extractSalaryFromText('Salary: $80,000-$120,000 per year')).toBe('$80,000-$120,000');
      expect(extractSalaryFromText('€70,000 - €100,000')).toBe('€70,000');
      expect(extractSalaryFromText('No salary mentioned')).toBe('Salary not specified');
    });

    it('should extract benefits from job descriptions', () => {
      const text = 'We offer great health insurance. Dental coverage included. Vacation time is flexible.';
      const benefits = extractBenefitsFromText(text);
      
      expect(benefits).toContain('health insurance');
      expect(benefits).toContain('dental coverage');
      expect(benefits).toContain('vacation time');
    });

    it('should handle text with no benefits', () => {
      const text = 'This is a great job opportunity with competitive salary.';
      const benefits = extractBenefitsFromText(text);
      
      expect(benefits).toBe('Benefits not specified');
    });
  });
});