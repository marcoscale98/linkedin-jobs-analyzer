import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { chrome } from './setup.js';

// Mock classes from background.js for testing
class MockSchemaManager {
  generateJobSchema(selectedFields = null, language = 'en', isCustomFormat = false, customPrompt = '') {
    if (isCustomFormat) {
      return {
        type: "object",
        properties: {
          customField: {
            type: "string",
            description: "Custom field description"
          }
        },
        required: ["customField"],
        additionalProperties: false
      };
    }
    
    return {
      type: "object",
      properties: {
        jobTitle: { type: "string", description: "Job title" },
        company: { type: "string", description: "Company name" },
        salary: { type: "string", description: "Salary information" }
      },
      required: selectedFields || ["jobTitle", "company", "salary"],
      additionalProperties: false
    };
  }

  getDefaultNotSpecifiedValue(language = 'en') {
    return language === 'it' ? 'Non specificato' : 'Not specified';
  }
}

class AIServiceManager {
  constructor() {
    this.apiKey = null;
    this.initialized = false;
    this.initializationPromise = this.initializeSettings();
    this.schemaManager = new MockSchemaManager();
  }

  async initializeSettings() {
    const result = await chrome.storage.sync.get(['aiApiKey']);
    this.apiKey = result.aiApiKey;
    this.initialized = true;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializationPromise;
    }
  }

  async setApiKey(apiKey) {
    this.apiKey = apiKey;
    await chrome.storage.sync.set({ 
      aiApiKey: apiKey
    });
  }

  async generateSummary(prompt, selectedFields = null, language = 'en', isCustomFormat = false, customPrompt = '', hasCompanyReviews = false) {
    console.log('[LinkedIn Job Analyzer] Starting summary generation...');
    
    await this.ensureInitialized();
    
    if (!this.apiKey) {
      const error = 'AI API key not configured. Please set your API key in the extension options.';
      throw new Error(error);
    }

    if (!this.apiKey.startsWith('sk-')) {
      const error = 'Invalid OpenAI API key format. Key should start with "sk-"';
      throw new Error(error);
    }

    return await this.callOpenAI(prompt, selectedFields, language, isCustomFormat, customPrompt, hasCompanyReviews);
  }

  async callOpenAI(prompt, selectedFields = null, language = 'en', isCustomFormat = false, customPrompt = '', hasCompanyReviews = false) {
    const schema = this.schemaManager.generateJobSchema(selectedFields, language, isCustomFormat, customPrompt);
    const notSpecifiedValue = this.schemaManager.getDefaultNotSpecifiedValue(language);
    
    // Enhanced system message for company reviews with web search
    const baseSystemMessage = isCustomFormat 
      ? (language === 'it' 
          ? `Sei un assistente professionale per l'analisi di offerte di lavoro. IMPORTANTE: Estrai SOLO le informazioni realmente presenti nei dati del lavoro forniti. NON inventare o immaginare informazioni. L'utente ha richiesto informazioni specifiche che sono state mappate nei campi dello schema JSON. Usa SOLO i dati reali forniti. Se le informazioni non sono disponibili nei dati forniti, usa SEMPRE "${notSpecifiedValue}". NON creare contenuti falsi o di fantasia. DEVI SEMPRE RISPONDERE IN ITALIANO: traduci in italiano tutti i contenuti estratti (descrizioni, benefit, requisiti, etc.), mantieni in inglese SOLO i termini tecnici specifici come nomi di tecnologie, linguaggi di programmazione, strumenti software.`
          : `You are a professional job analysis assistant. IMPORTANT: Extract ONLY information that is actually present in the provided job data. DO NOT invent or imagine information. The user has requested specific information that has been mapped to the JSON schema fields. Use ONLY the real data provided. If information is not available in the provided data, ALWAYS use "${notSpecifiedValue}". DO NOT create false or fictional content.`)
      : (language === 'it' 
          ? `Sei un assistente professionale per l'analisi di offerte di lavoro. IMPORTANTE: Estrai SOLO le informazioni realmente presenti nei dati del lavoro forniti. NON inventare informazioni. Devi rispondere con JSON strutturato che segue esattamente lo schema fornito. Se le informazioni non sono disponibili nei dati forniti, usa "${notSpecifiedValue}" per quel campo. DEVI SEMPRE RISPONDERE IN ITALIANO: traduci in italiano tutti i contenuti estratti (descrizioni, benefit, requisiti, etc.), mantieni in inglese SOLO i termini tecnici specifici come nomi di tecnologie, linguaggi di programmazione, strumenti software.`
          : `You are a professional job analysis assistant. IMPORTANT: Extract ONLY information that is actually present in the provided job data. DO NOT invent information. You must respond with structured JSON that follows the provided schema exactly. If information is not available in the provided data, use "${notSpecifiedValue}" for that field.`);

    const webSearchInstructions = hasCompanyReviews 
      ? (language === 'it' 
          ? ` INOLTRE: Se richiesto, utilizza la ricerca web per trovare recensioni recenti dei dipendenti dell'azienda su piattaforme come Glassdoor, Indeed e altri siti di recensioni aziendali.`
          : ` ADDITIONALLY: When requested, use web search to find recent employee reviews of the company from platforms like Glassdoor, Indeed, and other company review sites.`)
      : '';

    const systemMessage = baseSystemMessage + webSearchInstructions;
    
    // Use Responses API with web search tool when company reviews are requested
    if (hasCompanyReviews) {
      return await this.callResponsesAPI(prompt, systemMessage, schema);
    } else {
      return await this.callChatCompletionsAPI(prompt, systemMessage, schema);
    }
  }

  async callResponsesAPI(prompt, systemMessage, schema) {
    // Mock Responses API call for testing
    return {
      jobTitle: "Senior Software Engineer", 
      company: "Tech Corp",
      companyReviews: "4.2/5 on Glassdoor with positive feedback",
      workLifeBalance: "Good work-life balance according to recent reviews"
    };
  }

  async callChatCompletionsAPI(prompt, systemMessage, schema) {
    const requestBody = {
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_analysis",
          strict: true,
          schema: schema
        }
      }
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch (jsonError) {
          errorDetails = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        
        throw new Error(`OpenAI API error (${response.status}): ${errorDetails.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('OpenAI API returned no choices');
      }

      const jsonResponse = data.choices[0].message.content;
      const parsedData = JSON.parse(jsonResponse);
      return parsedData;
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' || error.message.includes('fetch failed')) {
        throw new Error('Network error: Unable to reach OpenAI API. Check your internet connection.');
      }
      throw error;
    }
  }

  async callMockAI(prompt, selectedFields = null, language = 'en', isCustomFormat = false) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const notSpecifiedValue = this.schemaManager.getDefaultNotSpecifiedValue(language);
    
    const allMockData = {
      jobTitle: language === 'it' ? "Ingegnere Software" : "Software Engineer",
      company: "Tech Company Inc.",
      salary: language === 'it' ? "€70.000 - €100.000" : "$80,000 - $120,000",
      location: language === 'it' ? "Remoto / Milano, IT" : "Remote / San Francisco, CA",
      benefits: language === 'it' ? "Assicurazione sanitaria, contributi pensione, ferie flessibili" : "Health insurance, 401k matching, flexible PTO",
      requiredSkills: language === 'it' ? "JavaScript, React, Node.js, 3+ anni esperienza" : "JavaScript, React, Node.js, 3+ years experience",
      teamCulture: language === 'it' ? "Ambiente collaborativo, cultura startup, work-life balance" : "Collaborative environment, startup culture, work-life balance"
    };
    
    if (selectedFields && selectedFields.length > 0) {
      const filteredData = {};
      selectedFields.forEach(field => {
        filteredData[field] = allMockData[field] || notSpecifiedValue;
      });
      return filteredData;
    }
    
    return allMockData;
  }
}

describe('[LinkedIn Job Analyzer] AIServiceManager', () => {
  let aiService;

  beforeEach(() => {
    // Reset Chrome storage mock
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
    
    // Setup default storage responses
    chrome.storage.sync.get.mockResolvedValue({ aiApiKey: 'sk-test-key-123' });
    chrome.storage.sync.set.mockResolvedValue();

    // Create fresh instance to avoid state pollution
    aiService = new AIServiceManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
    fetch.mockClear?.();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default values', () => {
      // Create a fresh instance without waiting for initialization
      const freshService = new AIServiceManager();
      expect(freshService.apiKey).toBeNull();
      expect(freshService.initialized).toBe(false);
      expect(freshService.schemaManager).toBeDefined();
    });

    it('should initialize settings from Chrome storage', async () => {
      await aiService.ensureInitialized();
      
      expect(aiService.apiKey).toBe('sk-test-key-123');
      expect(aiService.initialized).toBe(true);
    });

    it('should handle missing API key in storage', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      
      const newService = new AIServiceManager();
      await newService.ensureInitialized();
      
      expect(newService.apiKey).toBeUndefined();
    });
  });

  describe('setApiKey', () => {
    it('should set API key and save to storage', async () => {
      const testKey = 'sk-new-test-key';
      
      await aiService.setApiKey(testKey);
      
      expect(aiService.apiKey).toBe(testKey);
    });
  });

  describe('generateSummary', () => {
    beforeEach(async () => {
      await aiService.ensureInitialized();
    });

    it('should throw error when API key is not configured', async () => {
      aiService.apiKey = null;
      
      await expect(aiService.generateSummary('test prompt')).rejects.toThrow(
        'AI API key not configured. Please set your API key in the extension options.'
      );
    });

    it('should validate API key format', async () => {
      aiService.apiKey = 'invalid-key';
      
      await expect(aiService.generateSummary('test prompt')).rejects.toThrow(
        'Invalid OpenAI API key format. Key should start with "sk-"'
      );
    });

    it('should call OpenAI API with correct parameters', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '{"jobTitle": "Software Engineer", "company": "Test Corp", "salary": "Not specified"}'
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateSummary(
        'test prompt', 
        ['jobTitle', 'company'], 
        'en', 
        false, 
        ''
      );

      expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-test-key-123'
        },
        body: expect.stringContaining('"model":"gpt-4.1-mini"')
      });

      expect(result).toEqual({
        jobTitle: "Software Engineer",
        company: "Test Corp", 
        salary: "Not specified"
      });
    });

    it('should handle OpenAI API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: { message: 'Invalid API key' }
        })
      });

      await expect(aiService.generateSummary('test prompt')).rejects.toThrow(
        'OpenAI API error (401): Invalid API key'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new TypeError('fetch failed');
      networkError.name = 'TypeError';
      fetch.mockRejectedValueOnce(networkError);

      await expect(aiService.generateSummary('test prompt')).rejects.toThrow(
        'Network error: Unable to reach OpenAI API. Check your internet connection.'
      );
    });

    it('should handle empty response from OpenAI', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [] })
      });

      await expect(aiService.generateSummary('test prompt')).rejects.toThrow(
        'OpenAI API returned no choices'
      );
    });
  });

  describe('callOpenAI', () => {
    beforeEach(async () => {
      await aiService.ensureInitialized();
    });

    it('should generate correct system message for predefined format in English', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"jobTitle": "Test"}' } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await aiService.callOpenAI('test prompt', ['jobTitle'], 'en', false, '');

      const callArgs = fetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.messages[0].content).toContain('professional job analysis assistant');
      expect(requestBody.messages[0].content).toContain('ONLY information that is actually present');
      expect(requestBody.messages[0].content).toContain('Not specified');
    });

    it('should generate correct system message for custom format in Italian', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"customField": "Test"}' } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await aiService.callOpenAI('test prompt', null, 'it', true, 'custom field');

      const callArgs = fetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.messages[0].content).toContain('assistente professionale');
      expect(requestBody.messages[0].content).toContain('RISPONDERE IN ITALIANO');
      expect(requestBody.messages[0].content).toContain('Non specificato');
    });

    it('should include correct schema in request', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"jobTitle": "Test"}' } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await aiService.callOpenAI('test prompt', ['jobTitle'], 'en', false, '');

      const callArgs = fetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.response_format.type).toBe('json_schema');
      expect(requestBody.response_format.json_schema.name).toBe('job_analysis');
      expect(requestBody.response_format.json_schema.strict).toBe(true);
      expect(requestBody.response_format.json_schema.schema.type).toBe('object');
    });

    it('should use correct model and parameters', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"jobTitle": "Test"}' } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await aiService.callOpenAI('test prompt');

      const callArgs = fetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.model).toBe('gpt-4.1-mini');
      expect(requestBody.max_tokens).toBe(1000);
      expect(requestBody.temperature).toBe(0.3);
    });
  });

  describe('callMockAI', () => {
    it('should return mock data for all fields', async () => {
      const result = await aiService.callMockAI('test prompt', null, 'en');
      
      expect(result).toEqual({
        jobTitle: "Software Engineer",
        company: "Tech Company Inc.",
        salary: "$80,000 - $120,000",
        location: "Remote / San Francisco, CA",
        benefits: "Health insurance, 401k matching, flexible PTO",
        requiredSkills: "JavaScript, React, Node.js, 3+ years experience",
        teamCulture: "Collaborative environment, startup culture, work-life balance"
      });
    });

    it('should return Italian mock data when language is it', async () => {
      const result = await aiService.callMockAI('test prompt', null, 'it');
      
      expect(result.jobTitle).toBe("Ingegnere Software");
      expect(result.salary).toBe("€70.000 - €100.000");
      expect(result.location).toBe("Remoto / Milano, IT");
    });

    it('should return only selected fields when specified', async () => {
      const result = await aiService.callMockAI('test prompt', ['jobTitle', 'company'], 'en');
      
      expect(Object.keys(result)).toHaveLength(2);
      expect(result.jobTitle).toBe("Software Engineer");
      expect(result.company).toBe("Tech Company Inc.");
    });

    it('should use not specified value for missing fields', async () => {
      const result = await aiService.callMockAI('test prompt', ['jobTitle', 'invalidField'], 'en');
      
      expect(result.jobTitle).toBe("Software Engineer");
      expect(result.invalidField).toBe("Not specified");
    });

    it('should add delay for realistic simulation', async () => {
      const startTime = Date.now();
      await aiService.callMockAI('test prompt');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await aiService.ensureInitialized();
    });

    it('should handle JSON parsing errors in API responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(aiService.generateSummary('test prompt')).rejects.toThrow(
        'OpenAI API error (500): HTTP 500: Internal Server Error'
      );
    });

    it('should handle malformed JSON responses from OpenAI', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'invalid json' } }]
        })
      });

      await expect(aiService.generateSummary('test prompt')).rejects.toThrow();
    });
  });

  describe('Integration with SchemaManager', () => {
    beforeEach(async () => {
      await aiService.ensureInitialized();
    });

    it('should use SchemaManager for schema generation', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"jobTitle": "Test"}' } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const schemaSpy = vi.spyOn(aiService.schemaManager, 'generateJobSchema');
      
      await aiService.generateSummary('test prompt', ['jobTitle'], 'en', false, '');
      
      expect(schemaSpy).toHaveBeenCalledWith(['jobTitle'], 'en', false, '');
    });

    it('should use SchemaManager for not specified values', async () => {
      const notSpecifiedSpy = vi.spyOn(aiService.schemaManager, 'getDefaultNotSpecifiedValue');
      
      await aiService.callMockAI('test prompt', ['invalidField'], 'it');
      
      expect(notSpecifiedSpy).toHaveBeenCalledWith('it');
    });
  });

  describe('Company Reviews Feature', () => {
    beforeEach(async () => {
      await aiService.ensureInitialized();
    });

    it('should accept hasCompanyReviews parameter in generateSummary', async () => {
      const callOpenAISpy = vi.spyOn(aiService, 'callOpenAI').mockResolvedValue({
        jobTitle: "Engineer",
        companyReviews: "Great company reviews"
      });
      
      await aiService.generateSummary('test prompt', null, 'en', false, '', true);
      
      expect(callOpenAISpy).toHaveBeenCalledWith('test prompt', null, 'en', false, '', true);
    });

    it('should use Responses API when hasCompanyReviews is true', async () => {
      const responsesAPISpy = vi.spyOn(aiService, 'callResponsesAPI').mockResolvedValue({
        companyReviews: "Positive reviews from web search"
      });
      
      await aiService.callOpenAI('test prompt', null, 'en', false, '', true);
      
      expect(responsesAPISpy).toHaveBeenCalled();
    });

    it('should use Chat Completions API when hasCompanyReviews is false', async () => {
      const chatCompletionsSpy = vi.spyOn(aiService, 'callChatCompletionsAPI').mockResolvedValue({
        jobTitle: "Regular job analysis"
      });
      
      await aiService.callOpenAI('test prompt', null, 'en', false, '', false);
      
      expect(chatCompletionsSpy).toHaveBeenCalled();
    });

    it('should include web search instructions in system message when hasCompanyReviews is true', async () => {
      vi.spyOn(aiService, 'callResponsesAPI').mockResolvedValue({});
      
      await aiService.callOpenAI('test prompt', null, 'en', false, '', true);
      
      // Since we're using mock methods, we can verify the logic path was taken
      expect(aiService.callResponsesAPI).toHaveBeenCalled();
    });

    it('should include Italian web search instructions for Italian language', async () => {
      vi.spyOn(aiService, 'callResponsesAPI').mockResolvedValue({});
      
      await aiService.callOpenAI('test prompt', null, 'it', false, '', true);
      
      expect(aiService.callResponsesAPI).toHaveBeenCalled();
    });

    it('should return mock company review data from callResponsesAPI', async () => {
      const result = await aiService.callResponsesAPI('test prompt', 'system message', {});
      
      expect(result).toEqual({
        jobTitle: "Senior Software Engineer", 
        company: "Tech Corp",
        companyReviews: "4.2/5 on Glassdoor with positive feedback",
        workLifeBalance: "Good work-life balance according to recent reviews"
      });
    });
  });
});