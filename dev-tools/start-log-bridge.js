#!/usr/bin/env node

/**
 * LinkedIn Job Analyzer - Log Bridge Startup Script
 * Orchestrates the complete log bridge system with all components
 */

const NeuralLogBridge = require('./log-bridge-server');
const { SecureNeuralLogBridge } = require('./security-layer');
const ClaudeCodeIntegration = require('./claude-integration');
const fs = require('fs').promises;
const path = require('path');

class LogBridgeOrchestrator {
  constructor() {
    this.server = null;
    this.claudeIntegration = null;
    this.isRunning = false;
    this.config = {
      port: process.env.LOG_BRIDGE_PORT || 3847,
      enableSecurity: true,
      enableClaudeIntegration: true,
      logLevel: 'info'
    };
  }

  async start() {
    try {
      console.log('🚀 Starting LinkedIn Job Analyzer Neural Log Bridge...\n');
      
      // Create necessary directories
      await this.setupDirectories();
      
      // Initialize components
      await this.initializeComponents();
      
      // Start the server
      await this.startServer();
      
      // Setup graceful shutdown
      this.setupShutdown();
      
      // Display startup information
      this.displayStartupInfo();
      
      this.isRunning = true;
      
    } catch (error) {
      console.error('❌ Failed to start Log Bridge:', error);
      process.exit(1);
    }
  }

  async setupDirectories() {
    const dirs = [
      'dev-tools/reports',
      'dev-tools/logs',
      'dev-tools/backups'
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async initializeComponents() {
    console.log('⚙️  Initializing components...');
    
    // Create Neural Log Bridge
    this.server = new NeuralLogBridge(this.config.port);
    
    // Wrap with security layer if enabled
    if (this.config.enableSecurity) {
      console.log('🔒 Enabling security layer...');
      this.server = new SecureNeuralLogBridge(this.server);
    }
    
    // Initialize Claude integration if enabled
    if (this.config.enableClaudeIntegration) {
      console.log('🤖 Initializing Claude Code integration...');
      this.claudeIntegration = new ClaudeCodeIntegration();
      this.setupClaudeIntegration();
    }
    
    console.log('✅ All components initialized\n');
  }

  setupClaudeIntegration() {
    // Enhance server with Claude integration
    const originalProcessLog = this.server.processExtensionLog?.bind(this.server) || 
                              this.server.bridge?.processExtensionLog?.bind(this.server.bridge);
    
    if (originalProcessLog) {
      const enhancedProcessLog = async (logData) => {
        // Process with original method
        const result = await originalProcessLog(logData);
        
        // Collect logs for Claude analysis
        if (!this.claudeLogBuffer) this.claudeLogBuffer = [];
        this.claudeLogBuffer.push(logData);
        
        // Keep buffer manageable
        if (this.claudeLogBuffer.length > 100) {
          this.claudeLogBuffer.shift();
        }
        
        // Analyze every 50 logs or if critical error detected
        if (this.claudeLogBuffer.length % 50 === 0 || 
            logData.level === 'error' && logData.message?.includes('critical')) {
          
          setTimeout(() => this.analyzeLogsWithClaude(), 1000);
        }
        
        return result;
      };
      
      // Replace the method
      if (this.server.processExtensionLog) {
        this.server.processExtensionLog = enhancedProcessLog;
      } else if (this.server.bridge?.processExtensionLog) {
        this.server.bridge.processExtensionLog = enhancedProcessLog;
      }
    }
  }

  async analyzeLogsWithClaude() {
    if (!this.claudeIntegration || !this.claudeLogBuffer || this.claudeLogBuffer.length === 0) {
      return;
    }

    try {
      const analysis = await this.claudeIntegration.analyzeLogStream(this.claudeLogBuffer);
      
      if (analysis.needsAttention) {
        console.log('\n🚨 Claude analysis indicates issues requiring attention!');
        console.log('   Check the generated debugging report for details.\n');
      }
      
    } catch (error) {
      console.error('Error during Claude analysis:', error);
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      try {
        if (this.server.start) {
          this.server.start();
        } else if (this.server.bridge?.start) {
          this.server.bridge.start();
        } else {
          // Direct server start
          this.server.server?.listen(this.config.port, () => {
            resolve();
          });
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  setupShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      
      if (this.isRunning) {
        await this.stop();
      }
      
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  async stop() {
    if (!this.isRunning) return;
    
    console.log('🔌 Stopping Neural Log Bridge...');
    
    if (this.server?.stop) {
      this.server.stop();
    } else if (this.server?.bridge?.stop) {
      this.server.bridge.stop();
    }
    
    // Save session data
    await this.saveSessionData();
    
    this.isRunning = false;
    console.log('✅ Neural Log Bridge stopped');
  }

  async saveSessionData() {
    try {
      const sessionData = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        config: this.config,
        stats: this.getSessionStats()
      };

      const sessionFile = path.join('dev-tools', 'logs', `session-${Date.now()}.json`);
      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
      
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  getSessionStats() {
    const stats = {
      startTime: this.startTime,
      endTime: Date.now(),
      securityEnabled: this.config.enableSecurity,
      claudeEnabled: this.config.enableClaudeIntegration
    };

    // Add server stats if available
    if (this.server?.logBuffer) {
      stats.totalLogs = this.server.logBuffer.length;
      stats.errorLogs = this.server.logBuffer.filter(log => log.level === 'error').length;
    }

    return stats;
  }

  displayStartupInfo() {
    this.startTime = Date.now();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧠 NEURAL LOG BRIDGE - LINKEDIN JOB ANALYZER 🧠');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Server: http://localhost:${this.config.port}`);
    console.log(`🔌 WebSocket: ws://localhost:${this.config.port}`);
    console.log(`📨 HTTP API: POST http://localhost:${this.config.port}/api/extension-log`);
    console.log(`🔒 Security: ${this.config.enableSecurity ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`🤖 Claude Integration: ${this.config.enableClaudeIntegration ? '✅ Enabled' : '❌ Disabled'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 SETUP INSTRUCTIONS:');
    console.log('1. Load your Chrome extension in Developer Mode');
    console.log('2. Include quantum-bridge.js in your extension contexts');
    console.log('3. Extension logs will automatically stream here');
    console.log('4. Critical issues will trigger Claude Code assistance');
    console.log('\n🎯 READY TO RECEIVE LOGS...\n');
  }

  async getStatus() {
    const status = {
      running: this.isRunning,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      config: this.config,
      server: !!this.server,
      claudeIntegration: !!this.claudeIntegration
    };

    if (this.server?.getSecurityStatus) {
      status.security = this.server.getSecurityStatus();
    }

    return status;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const orchestrator = new LogBridgeOrchestrator();

  switch (command) {
    case 'start':
    case undefined:
      await orchestrator.start();
      break;
      
    case 'status':
      const status = await orchestrator.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'help':
      console.log(`
LinkedIn Job Analyzer - Neural Log Bridge

Usage:
  node start-log-bridge.js [command]

Commands:
  start     Start the log bridge server (default)
  status    Show current status
  help      Show this help message

Environment Variables:
  LOG_BRIDGE_PORT=3847    Set server port
  NODE_ENV=development    Set environment

Examples:
  node start-log-bridge.js
  LOG_BRIDGE_PORT=8080 node start-log-bridge.js start
      `);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use "help" for usage information');
      process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = LogBridgeOrchestrator;