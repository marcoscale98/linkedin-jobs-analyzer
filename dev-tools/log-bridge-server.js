#!/usr/bin/env node

/**
 * LinkedIn Job Analyzer - Neural Log Bridge Server
 * Advanced real-time log streaming and AI-powered debugging assistance
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

class NeuralLogBridge {
  constructor(port = 3847) {
    this.port = port;
    this.connections = new Map();
    this.logBuffer = [];
    this.aiQueue = [];
    this.patterns = new Map();
    this.setupServer();
    this.setupPatternRecognition();
  }

  setupServer() {
    // Create HTTP server
    this.server = http.createServer((req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === 'POST' && req.url === '/api/extension-log') {
        this.handleHttpLog(req, res);
        return;
      }

      // Serve status page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.getStatusPage());
    });

    // Create WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on('connection', this.handleWebSocketConnection.bind(this));
  }

  handleHttpLog(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const logData = JSON.parse(body);
        this.processExtensionLog(logData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'received' }));
      } catch (error) {
        console.error('[Log Bridge] Error processing HTTP log:', error);
        res.writeHead(400);
        res.end();
      }
    });
  }

  handleWebSocketConnection(ws) {
    const connectionId = crypto.randomUUID();
    this.connections.set(connectionId, {
      ws,
      contexts: new Set(),
      lastActivity: Date.now()
    });

    ws.on('message', (data) => {
      try {
        const logData = JSON.parse(data.toString());
        logData.connectionId = connectionId;
        this.processExtensionLog(logData);
      } catch (error) {
        console.error('[Log Bridge] WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`[Log Bridge] Connection ${connectionId} closed`);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      connectionId,
      timestamp: Date.now()
    }));

    console.log(`[Log Bridge] New connection: ${connectionId}`);
  }

  processExtensionLog(logData) {
    // Add metadata
    const enhancedLog = {
      ...logData,
      bridgeTimestamp: Date.now(),
      id: crypto.randomUUID()
    };

    // Store in buffer
    this.logBuffer.push(enhancedLog);
    if (this.logBuffer.length > 1000) {
      this.logBuffer.shift(); // Keep last 1000 logs
    }

    // Process based on context and content
    this.analyzeLog(enhancedLog);
    this.displayLog(enhancedLog);
    
    // Check for critical issues
    if (this.isCriticalLog(enhancedLog)) {
      this.escalateToAI(enhancedLog);
    }
  }

  analyzeLog(log) {
    // Pattern recognition
    const message = log.message || '';
    
    // LinkedIn Job Analyzer specific patterns
    if (message.includes('[LinkedIn Job Analyzer]')) {
      log.source = 'extension';
      log.component = this.extractComponent(message);
    }

    // Error patterns
    if (log.level === 'error' || message.includes('ERROR')) {
      log.severity = 'high';
      this.trackErrorPattern(log);
    }

    // Performance patterns
    if (message.includes('performance') || message.includes('timing')) {
      log.category = 'performance';
    }
  }

  extractComponent(message) {
    const patterns = {
      'background': /background|service worker/i,
      'content': /content script|page analysis/i,
      'popup': /popup|ui|interface/i,
      'schema': /schema|ai|openai/i,
      'extractor': /extract|job data|linkedin/i
    };

    for (const [component, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        return component;
      }
    }
    return 'unknown';
  }

  trackErrorPattern(log) {
    const errorType = this.categorizeError(log.message);
    
    if (!this.patterns.has(errorType)) {
      this.patterns.set(errorType, { count: 0, lastSeen: 0, logs: [] });
    }

    const pattern = this.patterns.get(errorType);
    pattern.count++;
    pattern.lastSeen = Date.now();
    pattern.logs.push(log);

    // Keep only last 10 logs per pattern
    if (pattern.logs.length > 10) {
      pattern.logs.shift();
    }

    // Alert on repeated errors
    if (pattern.count > 3 && Date.now() - pattern.lastSeen < 60000) {
      console.log(`🚨 [Alert] Repeated error pattern detected: ${errorType} (${pattern.count} times)`);
    }
  }

  categorizeError(message) {
    if (message.includes('API') || message.includes('fetch')) return 'api_error';
    if (message.includes('DOM') || message.includes('element')) return 'dom_error';
    if (message.includes('permission') || message.includes('chrome.')) return 'extension_error';
    if (message.includes('schema') || message.includes('JSON')) return 'data_error';
    return 'unknown_error';
  }

  isCriticalLog(log) {
    const criticalPatterns = [
      /failed to extract/i,
      /api request failed/i,
      /extension error/i,
      /uncaught exception/i,
      /schema validation failed/i
    ];

    const message = log.message || '';
    return criticalPatterns.some(pattern => pattern.test(message)) || 
           log.level === 'error' ||
           log.severity === 'high';
  }

  escalateToAI(log) {
    console.log(`🤖 [AI Escalation] Critical issue detected:`);
    console.log(`   Component: ${log.component || 'unknown'}`);
    console.log(`   Context: ${log.context || 'unknown'}`);
    console.log(`   Message: ${log.message}`);
    console.log(`   Suggested Action: Check extension permissions and API configuration`);
    
    // Add to AI queue for future Claude integration
    this.aiQueue.push({
      log,
      escalationTime: Date.now(),
      status: 'pending'
    });
  }

  displayLog(log) {
    const timestamp = new Date(log.timestamp || log.bridgeTimestamp).toLocaleTimeString();
    const level = (log.level || 'info').toUpperCase();
    const context = log.context ? `[${log.context}]` : '';
    const component = log.component ? `[${log.component}]` : '';
    
    // Color coding
    const colors = {
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
      INFO: '\x1b[32m',    // Green
      LOG: '\x1b[36m',     // Cyan
      DEBUG: '\x1b[90m'    // Gray
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || colors.LOG;
    
    console.log(`${color}[${timestamp}] ${level}${reset} ${context}${component} ${log.message}`);
  }

  setupPatternRecognition() {
    // Set up periodic pattern analysis
    setInterval(() => {
      this.analyzePatterns();
    }, 30000); // Every 30 seconds
  }

  analyzePatterns() {
    if (this.logBuffer.length === 0) return;

    const recentLogs = this.logBuffer.filter(log => 
      Date.now() - (log.timestamp || log.bridgeTimestamp) < 300000 // Last 5 minutes
    );

    // Analyze trends
    const errorCount = recentLogs.filter(log => log.level === 'error').length;
    const warningCount = recentLogs.filter(log => log.level === 'warn').length;

    if (errorCount > 5) {
      console.log(`📊 [Analysis] High error rate detected: ${errorCount} errors in last 5 minutes`);
    }

    if (warningCount > 10) {
      console.log(`📊 [Analysis] High warning rate: ${warningCount} warnings in last 5 minutes`);
    }
  }

  getStatusPage() {
    const stats = {
      connections: this.connections.size,
      totalLogs: this.logBuffer.length,
      errors: this.logBuffer.filter(log => log.level === 'error').length,
      patterns: this.patterns.size,
      aiQueue: this.aiQueue.length
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>LinkedIn Job Analyzer - Log Bridge</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #1a1a1a; color: #00ff00; }
        .stats { background: #2a2a2a; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .status { color: #00ff00; }
        .error { color: #ff4444; }
        .warning { color: #ffaa00; }
    </style>
</head>
<body>
    <h1>🧠 Neural Log Bridge - LinkedIn Job Analyzer</h1>
    <div class="stats">
        <h3>System Status</h3>
        <p>Active Connections: <span class="status">${stats.connections}</span></p>
        <p>Total Logs Processed: <span class="status">${stats.totalLogs}</span></p>
        <p>Error Logs: <span class="error">${stats.errors}</span></p>
        <p>Pattern Types: <span class="status">${stats.patterns}</span></p>
        <p>AI Queue: <span class="warning">${stats.aiQueue}</span></p>
    </div>
    <div class="stats">
        <h3>WebSocket Endpoint</h3>
        <p>ws://localhost:${this.port}</p>
        <h3>HTTP Endpoint</h3>
        <p>POST http://localhost:${this.port}/api/extension-log</p>
    </div>
    <p><em>Server running since: ${new Date().toLocaleString()}</em></p>
</body>
</html>`;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log('🚀 LinkedIn Job Analyzer - Neural Log Bridge Server');
      console.log(`📡 Server running on http://localhost:${this.port}`);
      console.log(`🔌 WebSocket endpoint: ws://localhost:${this.port}`);
      console.log(`📨 HTTP endpoint: POST http://localhost:${this.port}/api/extension-log`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 Ready to receive LinkedIn Job Analyzer logs...');
    });
  }

  stop() {
    this.server.close();
    this.wss.close();
    console.log('🛑 Neural Log Bridge Server stopped');
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new NeuralLogBridge(process.env.PORT || 3847);
  server.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Neural Log Bridge...');
    server.stop();
    process.exit(0);
  });
}

module.exports = NeuralLogBridge;