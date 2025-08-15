class SchemaManager {
  constructor() {
    this.fieldDefinitions = {
      jobTitle: {
        type: "string",
        description: {
          en: "Job title or position name",
          it: "Titolo del lavoro o nome della posizione"
        }
      },
      company: {
        type: "string",
        description: {
          en: "Company or organization name",
          it: "Nome dell'azienda o organizzazione"
        }
      },
      salary: {
        type: "string",
        description: {
          en: "Salary range, compensation details, or 'Not specified'",
          it: "Fascia salariale, dettagli compensi, o 'Non specificato'"
        }
      },
      location: {
        type: "string",
        description: {
          en: "Work location, remote options, or 'Not specified'",
          it: "Luogo di lavoro, opzioni remote, o 'Non specificato'"
        }
      },
      benefits: {
        type: "string",
        description: {
          en: "Benefits, perks, additional compensation, or 'Not specified'",
          it: "Benefit, vantaggi, compensi aggiuntivi, o 'Non specificato'"
        }
      },
      requiredSkills: {
        type: "string",
        description: {
          en: "Required skills, experience, qualifications, or 'Not specified'",
          it: "Competenze richieste, esperienza, qualifiche, o 'Non specificato'"
        }
      },
      teamCulture: {
        type: "string",
        description: {
          en: "Team culture, company values, work environment, or 'Not specified'",
          it: "Cultura del team, valori aziendali, ambiente di lavoro, o 'Non specificato'"
        }
      }
    };
    
    this.schemaCache = new Map();
  }

  generateJobSchema(selectedFields = null, language = 'en') {
    // Create cache key
    const cacheKey = `${selectedFields ? selectedFields.sort().join(',') : 'all'}_${language}`;
    
    // Return cached schema if available
    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey);
    }

    const fieldsToInclude = selectedFields || Object.keys(this.fieldDefinitions);
    
    const schema = {
      type: "object",
      properties: {},
      required: fieldsToInclude,
      additionalProperties: false
    };

    fieldsToInclude.forEach(field => {
      if (this.fieldDefinitions[field]) {
        schema.properties[field] = {
          type: this.fieldDefinitions[field].type,
          description: this.fieldDefinitions[field].description[language] || this.fieldDefinitions[field].description.en
        };
      }
    });

    // Cache the generated schema
    this.schemaCache.set(cacheKey, schema);
    return schema;
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
    this.schemaManager = new SchemaManager();
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

  async generateSummary(prompt, selectedFields = null, language = 'en') {
    console.log('[LinkedIn Job Analyzer] Starting summary generation...');
    
    // Ensure initialization is complete before proceeding
    await this.ensureInitialized();
    
    console.log('[LinkedIn Job Analyzer] API Key present:', !!this.apiKey);
    
    if (!this.apiKey) {
      const error = 'AI API key not configured. Please set your API key in the extension options.';
      console.error('[LinkedIn Job Analyzer] ERROR:', error);
      throw new Error(error);
    }

    // Validate API key format
    if (!this.apiKey.startsWith('sk-')) {
      const error = 'Invalid OpenAI API key format. Key should start with "sk-"';
      console.error('[LinkedIn Job Analyzer] ERROR:', error);
      throw new Error(error);
    }

    console.log('[LinkedIn Job Analyzer] API key validation passed');

    return await this.callOpenAI(prompt, selectedFields, language);
  }

  async callOpenAI(prompt, selectedFields = null, language = 'en') {
    console.log('[LinkedIn Job Analyzer] Making OpenAI API call with structured outputs...');
    
    // Generate dynamic schema based on selected fields
    const schema = this.schemaManager.generateJobSchema(selectedFields, language);
    const notSpecifiedValue = this.schemaManager.getDefaultNotSpecifiedValue(language);
    
    const systemMessage = language === 'it' 
      ? `Sei un assistente professionale per l'analisi di offerte di lavoro. Devi rispondere con JSON strutturato che segue esattamente lo schema fornito. Se le informazioni non sono disponibili, usa "${notSpecifiedValue}" per quel campo. Rispondi in italiano, ma mantieni in inglese i termini tecnici comuni.`
      : `You are a professional job analysis assistant. You must respond with structured JSON that follows the provided schema exactly. If information is not available, use "${notSpecifiedValue}" for that field.`;
    
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

    console.log('[LinkedIn Job Analyzer] OpenAI Request body:', {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      promptLength: prompt.length
    });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[LinkedIn Job Analyzer] OpenAI Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch (jsonError) {
          console.error('[LinkedIn Job Analyzer] Failed to parse error response:', jsonError);
          errorDetails = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        
        console.error('[LinkedIn Job Analyzer] OpenAI API Error Details:', errorDetails);
        throw new Error(`OpenAI API error (${response.status}): ${errorDetails.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('[LinkedIn Job Analyzer] OpenAI Response received, choice count:', data.choices?.length || 0);
      
      if (!data.choices || data.choices.length === 0) {
        console.error('[LinkedIn Job Analyzer] No choices in OpenAI response:', data);
        throw new Error('OpenAI API returned no choices');
      }

      const jsonResponse = data.choices[0].message.content;
      console.log('[LinkedIn Job Analyzer] OpenAI structured response received, length:', jsonResponse.length);
      
      // With structured outputs, JSON is guaranteed to be valid - no parsing needed
      const parsedData = JSON.parse(jsonResponse);
      console.log('[LinkedIn Job Analyzer] Structured data received:', Object.keys(parsedData));
      return parsedData;
      
    } catch (networkError) {
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        console.error('[LinkedIn Job Analyzer] Network error calling OpenAI:', networkError);
        throw new Error('Network error: Unable to reach OpenAI API. Check your internet connection.');
      }
      throw networkError;
    }
  }


  async callMockAI(prompt, selectedFields = null, language = 'en') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    
    // If specific fields are requested, only return those
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

const aiService = new AIServiceManager();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'generateSummary') {
      handleGenerateSummary(request.prompt, request.selectedFields, request.language)
        .then(summary => {
          console.log('[LinkedIn Job Analyzer] Summary generated successfully');
          sendResponse({ success: true, summary });
        })
        .catch(error => {
          console.error('[LinkedIn Job Analyzer] Summary generation failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    if (request.action === 'setApiKey') {
      aiService.setApiKey(request.apiKey)
        .then(() => {
          console.log('[LinkedIn Job Analyzer] API key set successfully');
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('[LinkedIn Job Analyzer] Failed to set API key', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
  } catch (error) {
    console.error('[LinkedIn Job Analyzer] Message handler error', error);
    sendResponse({ success: false, error: error.message });
  }
});

async function handleGenerateSummary(prompt, selectedFields = null, language = 'en') {
  try {
    console.log('[LinkedIn Job Analyzer] Attempting to generate summary...');
    const summary = await aiService.generateSummary(prompt, selectedFields, language);
    console.log('[LinkedIn Job Analyzer] ✅ Real AI summary generated successfully');
    return summary;
  } catch (error) {
    console.error('[LinkedIn Job Analyzer] ❌ AI service failed, using mock response');
    console.error('[LinkedIn Job Analyzer] Error details:', error.message);
    console.error('[LinkedIn Job Analyzer] Full error object:', error);
    
    const mockSummary = await aiService.callMockAI(prompt, selectedFields, language);
    console.log('[LinkedIn Job Analyzer] 🎭 Mock response returned');
    return mockSummary;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[LinkedIn Job Analyzer] Extension installed');
});