class AIServiceManager {
  constructor() {
    this.apiKey = null;
    this.serviceProvider = 'openai';
    this.initialized = false;
    this.initializationPromise = this.initializeSettings();
  }

  async initializeSettings() {
    const result = await chrome.storage.sync.get(['aiApiKey', 'aiProvider']);
    this.apiKey = result.aiApiKey;
    this.serviceProvider = result.aiProvider || 'openai';
    this.initialized = true;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializationPromise;
    }
  }

  async setApiKey(apiKey, provider = 'openai') {
    this.apiKey = apiKey;
    this.serviceProvider = provider;
    await chrome.storage.sync.set({ 
      aiApiKey: apiKey, 
      aiProvider: provider 
    });
  }

  async generateSummary(prompt) {
    console.log('[LinkedIn Job Analyzer] Starting summary generation...');
    
    // Ensure initialization is complete before proceeding
    await this.ensureInitialized();
    
    console.log('[LinkedIn Job Analyzer] API Key present:', !!this.apiKey);
    console.log('[LinkedIn Job Analyzer] Service provider:', this.serviceProvider);
    
    if (!this.apiKey) {
      const error = 'AI API key not configured. Please set your API key in the extension options.';
      console.error('[LinkedIn Job Analyzer] ERROR:', error);
      throw new Error(error);
    }

    // Validate API key format
    if (this.serviceProvider === 'openai' && !this.apiKey.startsWith('sk-')) {
      const error = 'Invalid OpenAI API key format. Key should start with "sk-"';
      console.error('[LinkedIn Job Analyzer] ERROR:', error);
      throw new Error(error);
    }

    if (this.serviceProvider === 'anthropic' && !this.apiKey.startsWith('sk-ant-')) {
      const error = 'Invalid Anthropic API key format. Key should start with "sk-ant-"';
      console.error('[LinkedIn Job Analyzer] ERROR:', error);
      throw new Error(error);
    }

    console.log('[LinkedIn Job Analyzer] API key validation passed');

    switch (this.serviceProvider) {
      case 'openai':
        return await this.callOpenAI(prompt);
      case 'anthropic':
        return await this.callAnthropic(prompt);
      default:
        const error = 'Unsupported AI provider: ' + this.serviceProvider;
        console.error('[LinkedIn Job Analyzer] ERROR:', error);
        throw new Error(error);
    }
  }

  async callOpenAI(prompt) {
    console.log('[LinkedIn Job Analyzer] Making OpenAI API call...');
    
    const requestBody = {
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional job analysis assistant. Provide clear, structured summaries of job postings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
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

      const summary = data.choices[0].message.content;
      console.log('[LinkedIn Job Analyzer] OpenAI summary generated successfully, length:', summary.length);
      return summary;
      
    } catch (networkError) {
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        console.error('[LinkedIn Job Analyzer] Network error calling OpenAI:', networkError);
        throw new Error('Network error: Unable to reach OpenAI API. Check your internet connection.');
      }
      throw networkError;
    }
  }

  async callAnthropic(prompt) {
    console.log('[LinkedIn Job Analyzer] Making Anthropic API call...');
    
    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    console.log('[LinkedIn Job Analyzer] Anthropic Request body:', {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      promptLength: prompt.length
    });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[LinkedIn Job Analyzer] Anthropic Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch (jsonError) {
          console.error('[LinkedIn Job Analyzer] Failed to parse error response:', jsonError);
          errorDetails = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        
        console.error('[LinkedIn Job Analyzer] Anthropic API Error Details:', errorDetails);
        throw new Error(`Anthropic API error (${response.status}): ${errorDetails.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('[LinkedIn Job Analyzer] Anthropic Response received, content count:', data.content?.length || 0);
      
      if (!data.content || data.content.length === 0) {
        console.error('[LinkedIn Job Analyzer] No content in Anthropic response:', data);
        throw new Error('Anthropic API returned no content');
      }

      const summary = data.content[0].text;
      console.log('[LinkedIn Job Analyzer] Anthropic summary generated successfully, length:', summary.length);
      return summary;
      
    } catch (networkError) {
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        console.error('[LinkedIn Job Analyzer] Network error calling Anthropic:', networkError);
        throw new Error('Network error: Unable to reach Anthropic API. Check your internet connection.');
      }
      throw networkError;
    }
  }

  async callMockAI(prompt) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `
• Job Title: Software Engineer
• Company: Tech Company Inc.
• Salary Range: $80,000 - $120,000
• Work Location: Remote / San Francisco, CA
• Benefits: Health insurance, 401k matching, flexible PTO

This is a mock AI response for demonstration purposes. 
Configure your AI API key to get real summaries.
    `.trim();
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
      aiService.setApiKey(request.apiKey, request.provider)
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