/**
 * Quantum Bridge - Multi-Context Chrome Extension Log Aggregator
 * Intercepts and forwards logs from all extension contexts to the Neural Log Bridge
 */

(function() {
  'use strict';

  class QuantumLogBridge {
    constructor() {
      this.serverUrl = 'http://localhost:3847';
      this.wsUrl = 'ws://localhost:3847';
      this.contextType = this.detectContext();
      this.sessionId = this.generateSessionId();
      this.logQueue = [];
      this.connected = false;
      this.setupConnection();
      this.interceptConsoleLogs();
      this.setupExtensionSpecificLogging();
      this.sendInitialLog();
    }

    detectContext() {
      // Detect which Chrome extension context we're running in
      if (typeof chrome !== 'undefined') {
        if (chrome.runtime && chrome.runtime.getBackgroundPage) {
          return 'background';
        }
        if (chrome.tabs && chrome.storage) {
          return 'background';
        }
      }

      if (window.location && window.location.protocol === 'chrome-extension:') {
        if (window.location.pathname.includes('popup')) {
          return 'popup';
        }
        if (window.location.pathname.includes('options')) {
          return 'options';
        }
        return 'extension-page';
      }

      if (document && document.contentType && window.location.protocol.startsWith('http')) {
        return 'content-script';
      }

      return 'unknown';
    }

    generateSessionId() {
      return `${this.contextType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    setupConnection() {
      // Try WebSocket first, fallback to HTTP
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          this.connected = true;
          console.log(`[LinkedIn Job Analyzer] Quantum Bridge connected (${this.contextType})`);
          this.flushQueue();
        };

        this.ws.onclose = () => {
          this.connected = false;
          console.log(`[LinkedIn Job Analyzer] Quantum Bridge disconnected, using HTTP fallback`);
        };

        this.ws.onerror = (error) => {
          console.log(`[LinkedIn Job Analyzer] WebSocket error, using HTTP fallback:`, error);
          this.connected = false;
        };

      } catch (error) {
        console.log(`[LinkedIn Job Analyzer] WebSocket not available, using HTTP mode`);
        this.connected = false;
      }
    }

    interceptConsoleLogs() {
      // Store original console methods
      const originalMethods = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
      };

      // Intercept each console method
      Object.keys(originalMethods).forEach(method => {
        console[method] = (...args) => {
          // Call original method first
          originalMethods[method].apply(console, args);
          
          // Send to bridge if it's our extension log
          const message = this.formatLogMessage(args);
          if (this.isExtensionLog(message)) {
            this.sendLog(method, message, args);
          }
        };
      });
    }

    setupExtensionSpecificLogging() {
      // Set up Chrome extension specific error handling
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Background script error handling
        if (this.contextType === 'background') {
          chrome.runtime.onInstalled?.addListener(() => {
            this.sendLog('info', '[LinkedIn Job Analyzer] Extension installed/updated', []);
          });

          // Monitor extension errors
          if (chrome.runtime.onMessage) {
            const originalOnMessage = chrome.runtime.onMessage.addListener;
            chrome.runtime.onMessage.addListener = (callback) => {
              return originalOnMessage.call(chrome.runtime.onMessage, (message, sender, sendResponse) => {
                try {
                  return callback(message, sender, sendResponse);
                } catch (error) {
                  this.sendLog('error', `[LinkedIn Job Analyzer] Message handler error: ${error.message}`, [error]);
                  throw error;
                }
              });
            };
          }
        }

        // Content script specific monitoring
        if (this.contextType === 'content-script') {
          // Monitor DOM mutations for LinkedIn page changes
          if (window.location.hostname.includes('linkedin.com')) {
            this.monitorLinkedInPageChanges();
          }
        }
      }

      // Global error handler
      window.addEventListener('error', (event) => {
        this.sendLog('error', `[LinkedIn Job Analyzer] Global error: ${event.error?.message}`, [event.error]);
      });

      // Promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.sendLog('error', `[LinkedIn Job Analyzer] Unhandled promise rejection: ${event.reason}`, [event.reason]);
      });
    }

    monitorLinkedInPageChanges() {
      // Monitor for job page navigation
      let currentUrl = window.location.href;
      
      const observer = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          if (currentUrl.includes('/jobs/view/')) {
            this.sendLog('info', '[LinkedIn Job Analyzer] Job page detected', [{ url: currentUrl }]);
          }
        }
      });

      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    }

    formatLogMessage(args) {
      return args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    }

    isExtensionLog(message) {
      // Check if this log is from our LinkedIn Job Analyzer extension
      return message.includes('[LinkedIn Job Analyzer]') ||
             message.includes('linkedin-job-analyzer') ||
             message.includes('SchemaManager') ||
             message.includes('LinkedInJobExtractor') ||
             message.includes('OptionsManager') ||
             message.includes('PopupController') ||
             message.includes('AIServiceManager');
    }

    sendLog(level, message, originalArgs) {
      const logData = {
        level,
        message,
        context: this.contextType,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location?.href || 'N/A',
        userAgent: navigator.userAgent,
        originalArgs: this.sanitizeArgs(originalArgs)
      };

      // Add extension-specific metadata
      if (typeof chrome !== 'undefined') {
        logData.extensionId = chrome.runtime?.id;
        logData.manifestVersion = chrome.runtime?.getManifest?.()?.manifest_version;
      }

      if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(logData));
        } catch (error) {
          this.queueLog(logData);
        }
      } else {
        this.queueLog(logData);
      }
    }

    sanitizeArgs(args) {
      // Remove sensitive data from log arguments
      return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          const sanitized = { ...arg };
          
          // Remove potential sensitive fields
          ['apiKey', 'password', 'token', 'secret', 'authorization'].forEach(field => {
            if (sanitized[field]) {
              sanitized[field] = '[REDACTED]';
            }
          });
          
          return sanitized;
        }
        
        // Sanitize strings that might contain API keys
        if (typeof arg === 'string') {
          return arg.replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-[REDACTED]');
        }
        
        return arg;
      });
    }

    queueLog(logData) {
      this.logQueue.push(logData);
      
      // Limit queue size
      if (this.logQueue.length > 100) {
        this.logQueue.shift();
      }

      // Try HTTP fallback
      this.sendViaHttp(logData);
    }

    async sendViaHttp(logData) {
      try {
        await fetch(`${this.serverUrl}/api/extension-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData)
        });
      } catch (error) {
        // Fail silently if server is not available
        // Don't create infinite loop by logging this error
      }
    }

    flushQueue() {
      if (this.logQueue.length === 0) return;

      this.logQueue.forEach(logData => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify(logData));
          } catch (error) {
            // Skip failed sends
          }
        }
      });

      this.logQueue = [];
    }

    sendInitialLog() {
      this.sendLog('info', `[LinkedIn Job Analyzer] Quantum Bridge initialized in ${this.contextType} context`, [{
        contextType: this.contextType,
        sessionId: this.sessionId,
        url: window.location?.href,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  // Initialize Quantum Bridge
  if (typeof window !== 'undefined') {
    // Avoid double initialization
    if (!window.linkedInJobAnalyzerQuantumBridge) {
      window.linkedInJobAnalyzerQuantumBridge = new QuantumLogBridge();
      
      // Send ready signal
      console.log('[LinkedIn Job Analyzer] Quantum Bridge active - logs streaming to Neural Bridge');
    }
  }

  // Export for use in modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuantumLogBridge;
  }

})();