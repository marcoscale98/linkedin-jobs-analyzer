#!/usr/bin/env node

/**
 * Simple Log Server - Stream LinkedIn Job Analyzer console logs to terminal
 */

const http = require('http');

const PORT = 8000;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const logData = JSON.parse(body);
        
        // Only show LinkedIn Job Analyzer logs
        if (logData.message && logData.message.includes('[LinkedIn Job Analyzer]')) {
          const timestamp = new Date(logData.timestamp).toLocaleTimeString();
          const level = logData.level.toUpperCase();
          
          // Simple color coding
          let color = '';
          if (level === 'ERROR') color = '\x1b[31m';      // Red
          else if (level === 'WARN') color = '\x1b[33m';  // Yellow
          else if (level === 'INFO') color = '\x1b[32m';  // Green
          else color = '\x1b[36m';                         // Cyan
          
          console.log(`${color}[${timestamp}] ${level}\x1b[0m ${logData.message}`);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"status": "ok"}');
      } catch (error) {
        res.writeHead(400);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log('🚀 LinkedIn Job Analyzer - Simple Log Server');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('📨 Endpoint: POST http://localhost:8000/log');
  console.log('-'.repeat(50));
  console.log('Extension logs will appear here...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping log server...');
  server.close();
  process.exit(0);
});