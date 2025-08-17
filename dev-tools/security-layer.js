/**
 * Security Layer - Advanced log sanitization and secure transport
 * Implements zero-trust architecture for log data handling
 */

const crypto = require('crypto');

class SecureLogTransport {
  constructor() {
    this.encryptionKey = this.generateSessionKey();
    this.sanitizer = new LogSanitizer();
    this.integrityChecker = new IntegrityChecker();
  }

  generateSessionKey() {
    return crypto.randomBytes(32);
  }

  async secureTransmit(logData) {
    try {
      // Step 1: Sanitize sensitive data
      const sanitized = this.sanitizer.sanitize(logData);
      
      // Step 2: Add integrity check
      const withIntegrity = this.integrityChecker.addChecksum(sanitized);
      
      // Step 3: Encrypt for secure transport
      const encrypted = this.encrypt(withIntegrity);
      
      return {
        data: encrypted,
        timestamp: Date.now(),
        version: '1.0'
      };
    } catch (error) {
      console.error('[Security Layer] Error in secure transmission:', error);
      return this.sanitizer.sanitize(logData); // Fallback to sanitized only
    }
  }

  encrypt(data) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }

  decrypt(encryptedData) {
    try {
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('[Security Layer] Decryption failed:', error);
      return null;
    }
  }
}

class LogSanitizer {
  constructor() {
    this.sensitivePatterns = [
      // API Keys
      /sk-[a-zA-Z0-9]{32,}/g,
      /pk_[a-zA-Z0-9]{24,}/g,
      /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
      
      // Personal Information
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card
      
      // URLs with tokens
      /https?:\/\/[^\s]*[\?&](?:token|key|secret|auth)=[^\s&]*/g,
      
      // LinkedIn specific
      /li_at=[^;]*/g,
      /JSESSIONID=[^;]*/g
    ];

    this.sensitiveFields = [
      'apiKey', 'api_key', 'password', 'passwd', 'secret', 'token', 'auth',
      'authorization', 'cookie', 'session', 'csrf', 'xsrf', 'private_key',
      'privateKey', 'clientSecret', 'client_secret', 'refreshToken', 'refresh_token'
    ];
  }

  sanitize(logData) {
    if (!logData || typeof logData !== 'object') {
      return logData;
    }

    const sanitized = this.deepClone(logData);
    
    // Sanitize all string values
    this.sanitizeObject(sanitized);
    
    return sanitized;
  }

  sanitizeObject(obj, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) return obj;

    if (Array.isArray(obj)) {
      obj.forEach(item => this.sanitizeObject(item, depth + 1));
      return obj;
    }

    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        // Check if field name is sensitive
        if (this.isSensitiveField(key)) {
          obj[key] = '[REDACTED]';
          return;
        }

        if (typeof value === 'string') {
          obj[key] = this.sanitizeString(value);
        } else if (typeof value === 'object') {
          this.sanitizeObject(value, depth + 1);
        }
      });
    }

    return obj;
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return str;

    let sanitized = str;
    
    // Apply all sensitive patterns
    this.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  isSensitiveField(fieldName) {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFields.some(sensitive => 
      lowerField.includes(sensitive)
    );
  }

  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
    return obj;
  }
}

class IntegrityChecker {
  generateChecksum(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  addChecksum(data) {
    return {
      ...data,
      _integrity: {
        checksum: this.generateChecksum(data),
        timestamp: Date.now()
      }
    };
  }

  verifyIntegrity(data) {
    if (!data._integrity) {
      return { valid: false, reason: 'No integrity data' };
    }

    const { checksum, timestamp } = data._integrity;
    const dataWithoutIntegrity = { ...data };
    delete dataWithoutIntegrity._integrity;

    const expectedChecksum = this.generateChecksum(dataWithoutIntegrity);
    
    if (checksum !== expectedChecksum) {
      return { valid: false, reason: 'Checksum mismatch' };
    }

    // Check if data is too old (more than 1 hour)
    if (Date.now() - timestamp > 3600000) {
      return { valid: false, reason: 'Data too old' };
    }

    return { valid: true };
  }
}

class SecurityAuditLogger {
  constructor() {
    this.auditLog = [];
    this.alertThresholds = {
      sensitiveDataAttempts: 5,
      timeWindow: 300000 // 5 minutes
    };
  }

  logSecurityEvent(event) {
    const auditEntry = {
      timestamp: Date.now(),
      event: event.type,
      severity: event.severity || 'info',
      details: event.details || {},
      source: event.source || 'unknown'
    };

    this.auditLog.push(auditEntry);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }

    // Check for suspicious patterns
    this.checkSuspiciousActivity(auditEntry);
  }

  checkSuspiciousActivity(entry) {
    if (entry.event === 'sensitive_data_blocked') {
      const recentAttempts = this.auditLog.filter(log => 
        log.event === 'sensitive_data_blocked' &&
        Date.now() - log.timestamp < this.alertThresholds.timeWindow
      ).length;

      if (recentAttempts >= this.alertThresholds.sensitiveDataAttempts) {
        console.warn(`🚨 [Security Alert] High number of sensitive data attempts: ${recentAttempts} in ${this.alertThresholds.timeWindow/1000}s`);
      }
    }
  }

  getAuditSummary() {
    const now = Date.now();
    const oneHour = 3600000;
    
    const recentEvents = this.auditLog.filter(log => 
      now - log.timestamp < oneHour
    );

    const summary = {
      totalEvents: recentEvents.length,
      byType: {},
      bySeverity: {}
    };

    recentEvents.forEach(event => {
      summary.byType[event.event] = (summary.byType[event.event] || 0) + 1;
      summary.bySeverity[event.severity] = (summary.bySeverity[event.severity] || 0) + 1;
    });

    return summary;
  }
}

// Enhanced security wrapper for the Neural Log Bridge
class SecureNeuralLogBridge {
  constructor(originalBridge) {
    this.bridge = originalBridge;
    this.secureTransport = new SecureLogTransport();
    this.auditLogger = new SecurityAuditLogger();
    this.wrapSecureMethods();
  }

  wrapSecureMethods() {
    const originalProcessLog = this.bridge.processExtensionLog.bind(this.bridge);
    
    this.bridge.processExtensionLog = async (logData) => {
      try {
        // Security audit
        this.auditLogger.logSecurityEvent({
          type: 'log_received',
          severity: 'info',
          details: { context: logData.context, level: logData.level }
        });

        // Secure the log data
        const secureLog = await this.secureTransport.secureTransmit(logData);
        
        // Verify integrity
        const integrity = this.secureTransport.integrityChecker.verifyIntegrity(secureLog.data);
        if (!integrity.valid) {
          this.auditLogger.logSecurityEvent({
            type: 'integrity_failure',
            severity: 'warning',
            details: { reason: integrity.reason }
          });
        }

        // Process with original method
        return originalProcessLog(secureLog);
        
      } catch (error) {
        this.auditLogger.logSecurityEvent({
          type: 'processing_error',
          severity: 'error',
          details: { error: error.message }
        });
        
        // Fallback to sanitized processing
        const sanitized = this.secureTransport.sanitizer.sanitize(logData);
        return originalProcessLog(sanitized);
      }
    };
  }

  getSecurityStatus() {
    return {
      auditSummary: this.auditLogger.getAuditSummary(),
      encryptionActive: !!this.secureTransport.encryptionKey,
      integrityChecksEnabled: true,
      sanitizationActive: true
    };
  }
}

module.exports = {
  SecureLogTransport,
  LogSanitizer,
  IntegrityChecker,
  SecurityAuditLogger,
  SecureNeuralLogBridge
};