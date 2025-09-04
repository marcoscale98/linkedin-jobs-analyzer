// === Console Bridge for Development ===
/**
 * Simple Console Bridge - Stream LinkedIn Job Analyzer logs to terminal
 * Service Worker compatible version
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
            source: 'service_worker'
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
          it: "Fascia salariale e dettagli compensi TRADOTTI IN ITALIANO, o 'Non specificato'"
        }
      },
      location: {
        type: "string",
        description: {
          en: "Work location, remote options, or 'Not specified'",
          it: "Luogo di lavoro e opzioni remote TRADOTTI IN ITALIANO, o 'Non specificato'"
        }
      },
      benefits: {
        type: "string",
        description: {
          en: "Benefits, perks, additional compensation, or 'Not specified'",
          it: "Benefit, vantaggi e compensi aggiuntivi TRADOTTI IN ITALIANO, o 'Non specificato'"
        }
      },
      requiredSkills: {
        type: "string",
        description: {
          en: "Required skills, experience, qualifications, or 'Not specified'",
          it: "Competenze, esperienza e qualifiche richieste TRADOTTE IN ITALIANO (eccetto nomi di tecnologie), o 'Non specificato'"
        }
      },
      teamCulture: {
        type: "string",
        description: {
          en: "Team culture, company values, work environment, or 'Not specified'",
          it: "Cultura del team, valori aziendali e ambiente di lavoro TRADOTTI IN ITALIANO, o 'Non specificato'"
        }
      },
      companyReviews: {
        type: "string",
        description: {
          en: "Overall employee satisfaction summary from recent web search of review platforms like Glassdoor, Indeed, and similar sites, or 'Not specified'",
          it: "Riassunto generale della soddisfazione dei dipendenti da ricerca web recente su piattaforme di recensioni come Glassdoor, Indeed e simili, o 'Non specificato'"
        }
      },
      workLifeBalance: {
        type: "string",
        description: {
          en: "Work-life balance insights from recent employee reviews found through web search, or 'Not specified'",
          it: "Informazioni sull'equilibrio vita-lavoro da recensioni recenti dei dipendenti trovate tramite ricerca web, o 'Non specificato'"
        }
      },
      managementQuality: {
        type: "string",
        description: {
          en: "Management and leadership feedback from employee review platforms found through web search, or 'Not specified'",
          it: "Feedback su management e leadership da piattaforme di recensioni dipendenti trovate tramite ricerca web, o 'Non specificato'"
        }
      },
      companyCultureReviews: {
        type: "string",
        description: {
          en: "Company culture observations from latest employee reviews found through web search, or 'Not specified'",
          it: "Osservazioni sulla cultura aziendale dalle ultime recensioni dei dipendenti trovate tramite ricerca web, o 'Non specificato'"
        }
      },
      platformUsed: {
        type: "string",
        description: {
          en: "Platform used for company reviews (Glassdoor, Indeed, or other), or 'Not specified'",
          it: "Piattaforma utilizzata per le recensioni azienda (Glassdoor, Indeed, o altra), o 'Non specificato'"
        }
      },
      overallRating: {
        type: "string",
        description: {
          en: "Overall company rating from review platform (e.g., '4.2/5 stars'), or 'Not specified'",
          it: "Valutazione complessiva dell'azienda dalla piattaforma di recensioni (es. '4.2/5 stelle'), o 'Non specificato'"
        }
      },
      reviewCount: {
        type: "string",
        description: {
          en: "Number of reviews available on the platform (e.g., '1,250 reviews'), or 'Not specified'",
          it: "Numero di recensioni disponibili sulla piattaforma (es. '1.250 recensioni'), o 'Non specificato'"
        }
      },
      companySize: {
        type: "string",
        description: {
          en: "Company size information (employees count, company scale), or 'Not specified'",
          it: "Informazioni sulla dimensione dell'azienda (numero dipendenti, scala aziendale), o 'Non specificato'"
        }
      },
      industry: {
        type: "string",
        description: {
          en: "Company industry and sector information, or 'Not specified'",
          it: "Informazioni su settore e industria dell'azienda, o 'Non specificato'"
        }
      },
      businessType: {
        type: "string",
        description: {
          en: "Type of business: Product company, Consultancy, Service provider, or other classification, or 'Not specified'",
          it: "Tipo di business: Azienda di prodotto, Consulenza, Fornitore di servizi, o altra classificazione, o 'Non specificato'"
        }
      }
    };
    
    this.schemaCache = new Map();
  }

  generateJobSchema(selectedFields = null, language = 'en', isCustomFormat = false, customPrompt = '') {
    // For custom format, use flexible schema that allows any fields
    if (isCustomFormat) {
      return this.generateCustomSchema(language, customPrompt);
    }
    
    // Create cache key for predefined format
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

  generateCustomSchema(language = 'en', customPrompt = '') {
    const notSpecifiedValue = this.getDefaultNotSpecifiedValue(language);
    
    // Parse the custom prompt to extract requested fields
    const requestedFields = this.parseCustomPrompt(customPrompt, language);
    
    // Generate schema with dynamic field names based on user request
    const properties = {};
    const required = [];
    
    requestedFields.forEach((fieldInfo, index) => {
      const fieldKey = this.createFieldKey(fieldInfo.name);
      properties[fieldKey] = {
        type: "string",
        description: language === 'it'
          ? `${fieldInfo.name} - estratto dall'offerta di lavoro e TRADOTTO IN ITALIANO, o "${notSpecifiedValue}" se non disponibile`
          : `${fieldInfo.name} - extracted from job posting, or "${notSpecifiedValue}" if not available`
      };
      required.push(fieldKey);
    });
    
    // If no fields parsed, create a single general field
    if (Object.keys(properties).length === 0) {
      properties.informazioniRichieste = {
        type: "string",
        description: language === 'it'
          ? `Informazioni richieste dall'utente, o "${notSpecifiedValue}" se non disponibili`
          : `User-requested information, or "${notSpecifiedValue}" if not available`
      };
      required.push('informazioniRichieste');
    }
    
    return {
      type: "object",
      properties: properties,
      required: required,
      additionalProperties: false
    };
  }
  
  parseCustomPrompt(prompt, language = 'en') {
    if (!prompt.trim()) return [];
    
    // Split by common delimiters and clean up
    const rawFields = prompt
      .split(/[,\n\-•·*]/)
      .map(field => field.trim())
      .filter(field => field.length > 0);
    
    return rawFields.map(field => ({
      name: field,
      originalText: field
    }));
  }
  
  createFieldKey(fieldName) {
    // Convert field name to a valid camelCase identifier
    return fieldName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '') || 'campo'; // Fallback
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

  async generateSummary(prompt, selectedFields = null, language = 'en', isCustomFormat = false, customPrompt = '', hasCompanyReviews = false) {
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

    return await this.callOpenAI(prompt, selectedFields, language, isCustomFormat, customPrompt, hasCompanyReviews);
  }

  async callOpenAI(prompt, selectedFields = null, language = 'en', isCustomFormat = false, customPrompt = '', hasCompanyReviews = false) {
    console.log('[LinkedIn Job Analyzer] Making OpenAI API call with structured outputs...');
    
    // Generate dynamic schema based on selected fields and format type
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
          ? ` RICERCA WEB INTELLIGENTE: Quando richiesto, esegui una ricerca web strategica per l'azienda menzionata:

1. CERCA SPECIFICAMENTE su Glassdoor E Indeed per l'azienda
2. CONFRONTA la qualità e quantità dei dati di entrambe le piattaforme
3. SCEGLI la piattaforma con più informazioni recenti e dettagliate
4. ESTRAI dalla piattaforma scelta:
   - Valutazione stelle complessiva (es. "4.2/5 stelle")
   - Numero di recensioni (es. "1.250 recensioni")
   - Piattaforma utilizzata (Glassdoor/Indeed)
   - Soddisfazione dipendenti, equilibrio vita-lavoro, qualità management, cultura aziendale
   - Dimensione azienda (numero dipendenti)
   - Settore/industria
   - Tipo di business (Prodotto/Consulenza/Servizi)

IMPORTANTE: Indica chiaramente quale piattaforma hai usato e perché (più recensioni, più recenti, più dettagliate).`
          : ` INTELLIGENT WEB SEARCH: When requested, perform strategic web search for the mentioned company:

1. SEARCH SPECIFICALLY on both Glassdoor AND Indeed for the company
2. COMPARE the quality and quantity of data from both platforms  
3. CHOOSE the platform with more recent and detailed information
4. EXTRACT from the chosen platform:
   - Overall star rating (e.g., "4.2/5 stars")
   - Review count (e.g., "1,250 reviews") 
   - Platform used (Glassdoor/Indeed)
   - Employee satisfaction, work-life balance, management quality, company culture
   - Company size (employee count)
   - Industry/sector
   - Business type (Product/Consultancy/Services)

IMPORTANT: Clearly indicate which platform you used and why (more reviews, more recent, more detailed).`)
      : '';

    const systemMessage = baseSystemMessage + webSearchInstructions;
    
    // Use Responses API with web search tool when company reviews are requested
    if (hasCompanyReviews) {
      console.log('[LinkedIn Job Analyzer] Using Responses API with web search tool');
      
      const requestBody = {
        model: 'gpt-4.1-mini',
        input: prompt,
        tools: [{
          type: "web_search_preview",
          search_context_size: "medium"
        }],
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
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('[LinkedIn Job Analyzer] Responses API Response status:', response.status, response.statusText);

        if (!response.ok) {
          console.log('[LinkedIn Job Analyzer] Responses API failed, falling back to Chat Completions');
          // Fall back to regular Chat Completions API
          return await this.callChatCompletionsAPI(prompt, systemMessage, schema);
        }

        const data = await response.json();
        console.log('[LinkedIn Job Analyzer] Responses API data received');
        
        if (data.output_text) {
          // Try to parse as JSON from the structured output
          try {
            const parsedData = JSON.parse(data.output_text);
            console.log('[LinkedIn Job Analyzer] Structured data received with web search:', Object.keys(parsedData));
            return parsedData;
          } catch (parseError) {
            console.error('[LinkedIn Job Analyzer] Failed to parse Responses API JSON output:', parseError);
            throw new Error('Invalid JSON response from Responses API');
          }
        } else {
          throw new Error('No output_text in Responses API response');
        }
        
      } catch (error) {
        console.error('[LinkedIn Job Analyzer] Responses API error:', error);
        console.log('[LinkedIn Job Analyzer] Falling back to Chat Completions API');
        // Fall back to regular Chat Completions API
        return await this.callChatCompletionsAPI(prompt, systemMessage, schema);
      }
    } else {
      // Use regular Chat Completions API
      return await this.callChatCompletionsAPI(prompt, systemMessage, schema);
    }
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

    console.log('[LinkedIn Job Analyzer] Chat Completions Request body:', {
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

      console.log('[LinkedIn Job Analyzer] Chat Completions Response status:', response.status, response.statusText);

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
      console.log('[LinkedIn Job Analyzer] Chat Completions Response received, choice count:', data.choices?.length || 0);
      
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


  async callMockAI(prompt, selectedFields = null, language = 'en', isCustomFormat = false) {
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
      handleGenerateSummary(request.prompt, request.selectedFields, request.language, request.isCustomFormat, request.customPrompt, request.hasCompanyReviews)
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

async function handleGenerateSummary(prompt, selectedFields = null, language = 'en', isCustomFormat = false, customPrompt = '', hasCompanyReviews = false) {
  try {
    console.log('[LinkedIn Job Analyzer] Attempting to generate summary...');
    const summary = await aiService.generateSummary(prompt, selectedFields, language, isCustomFormat, customPrompt, hasCompanyReviews);
    console.log('[LinkedIn Job Analyzer] ✅ Real AI summary generated successfully');
    return summary;
  } catch (error) {
    console.error('[LinkedIn Job Analyzer] ❌ AI service failed, using mock response');
    console.error('[LinkedIn Job Analyzer] Error details:', error.message);
    console.error('[LinkedIn Job Analyzer] Full error object:', error);
    
    const mockSummary = await aiService.callMockAI(prompt, selectedFields, language, isCustomFormat, customPrompt);
    console.log('[LinkedIn Job Analyzer] 🎭 Mock response returned');
    return mockSummary;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[LinkedIn Job Analyzer] Extension installed');
});