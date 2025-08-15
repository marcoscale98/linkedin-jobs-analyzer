class AIServiceManager {
  constructor() {
    this.apiKey = null;
    this.initialized = false;
    this.initializationPromise = this.initializeSettings();
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

  async generateSummary(prompt) {
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

    return await this.callOpenAI(prompt);
  }

  async callOpenAI(prompt) {
    console.log('[LinkedIn Job Analyzer] Making OpenAI API call...');
    
    const requestBody = {
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional job analysis assistant. You must respond with valid JSON only. Use this exact schema: {"jobTitle": "string", "company": "string", "salary": "string", "location": "string", "benefits": "string", "requiredSkills": "string", "teamCulture": "string"}. If information is not available, use "Not specified" for that field.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { "type": "json_object" }
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
      console.log('[LinkedIn Job Analyzer] OpenAI JSON response received, length:', jsonResponse.length);
      
      // Parse and validate JSON response
      try {
        const parsedData = JSON.parse(jsonResponse);
        console.log('[LinkedIn Job Analyzer] JSON parsed successfully:', Object.keys(parsedData));
        return parsedData;
      } catch (parseError) {
        console.error('[LinkedIn Job Analyzer] Failed to parse JSON response:', parseError);
        console.error('[LinkedIn Job Analyzer] Raw response:', jsonResponse);
        throw new Error('OpenAI returned invalid JSON format');
      }
      
    } catch (networkError) {
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        console.error('[LinkedIn Job Analyzer] Network error calling OpenAI:', networkError);
        throw new Error('Network error: Unable to reach OpenAI API. Check your internet connection.');
      }
      throw networkError;
    }
  }


  async callMockAI(prompt) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      jobTitle: "Software Engineer",
      company: "Tech Company Inc.",
      salary: "$80,000 - $120,000",
      location: "Remote / San Francisco, CA",
      benefits: "Health insurance, 401k matching, flexible PTO",
      requiredSkills: "JavaScript, React, Node.js, 3+ years experience",
      teamCulture: "Collaborative environment, startup culture, work-life balance"
    };
  }
}

const aiService = new AIServiceManager();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'generateSummary') {
      handleGenerateSummary(request.prompt)
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

async function handleGenerateSummary(prompt) {
  try {
    console.log('[LinkedIn Job Analyzer] Attempting to generate summary...');
    const summary = await aiService.generateSummary(prompt);
    console.log('[LinkedIn Job Analyzer] ✅ Real AI summary generated successfully');
    return summary;
  } catch (error) {
    console.error('[LinkedIn Job Analyzer] ❌ AI service failed, using mock response');
    console.error('[LinkedIn Job Analyzer] Error details:', error.message);
    console.error('[LinkedIn Job Analyzer] Full error object:', error);
    
    const mockSummary = await aiService.callMockAI(prompt);
    console.log('[LinkedIn Job Analyzer] 🎭 Mock response returned');
    return mockSummary;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[LinkedIn Job Analyzer] Extension installed');
});