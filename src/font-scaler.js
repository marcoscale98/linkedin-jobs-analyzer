/**
 * LinkedIn Job Analyzer - Font Scaling System
 * Provides centralized font size control across all extension components
 */

class FontScaler {
  static STORAGE_KEY = 'fontScale';
  static DEFAULT_SCALE = 100; // 100% default
  static MIN_SCALE = 50;      // 50% minimum
  static MAX_SCALE = 200;     // 200% maximum

  /**
   * Load font scale from storage and apply to document
   * @param {Document} doc - Document to apply scaling to
   */
  static async loadAndApply(doc = document) {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      const scale = result[this.STORAGE_KEY] || this.DEFAULT_SCALE;
      this.applyScale(scale, doc);
      console.log(`[LinkedIn Job Analyzer] Font scale applied: ${scale}%`);
      return scale;
    } catch (error) {
      console.error('[LinkedIn Job Analyzer] Error loading font scale:', error);
      this.applyScale(this.DEFAULT_SCALE, doc);
      return this.DEFAULT_SCALE;
    }
  }

  /**
   * Save font scale to storage
   * @param {number} scale - Scale percentage (50-200)
   */
  static async saveScale(scale) {
    const clampedScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale));
    try {
      await chrome.storage.sync.set({ [this.STORAGE_KEY]: clampedScale });
      console.log(`[LinkedIn Job Analyzer] Font scale saved: ${clampedScale}%`);
      return clampedScale;
    } catch (error) {
      console.error('[LinkedIn Job Analyzer] Error saving font scale:', error);
      throw error;
    }
  }

  /**
   * Apply font scale to document root
   * @param {number} scale - Scale percentage
   * @param {Document} doc - Document to apply to
   */
  static applyScale(scale, doc = document) {
    const scaleDecimal = scale / 100;
    doc.documentElement.style.setProperty('--font-scale', scaleDecimal);
  }

  /**
   * Get current font scale from storage
   * @returns {Promise<number>} Current scale percentage
   */
  static async getCurrentScale() {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || this.DEFAULT_SCALE;
    } catch (error) {
      console.error('[LinkedIn Job Analyzer] Error getting current scale:', error);
      return this.DEFAULT_SCALE;
    }
  }

  /**
   * Reset font scale to default
   * @param {Document} doc - Document to apply to
   */
  static async resetScale(doc = document) {
    await this.saveScale(this.DEFAULT_SCALE);
    this.applyScale(this.DEFAULT_SCALE, doc);
    return this.DEFAULT_SCALE;
  }

  /**
   * Apply scaling to all open extension pages
   * Useful when changing scale from options page
   */
  static async applyToAllExtensionPages(newScale) {
    // Save the new scale
    await this.saveScale(newScale);
    
    // Apply to current document
    this.applyScale(newScale);

    // Send message to other extension pages to update their scale
    try {
      await chrome.runtime.sendMessage({
        action: 'fontScaleChanged',
        scale: newScale
      });
    } catch (error) {
      // It's okay if no other pages are listening
      console.log('[LinkedIn Job Analyzer] No other extension pages to update');
    }
  }
}

// Auto-initialize when script loads
if (typeof document !== 'undefined') {
  // Apply font scaling when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FontScaler.loadAndApply());
  } else {
    FontScaler.loadAndApply();
  }
}

// Listen for font scale changes from other extension pages
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fontScaleChanged') {
      FontScaler.applyScale(message.scale);
    }
  });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.FontScaler = FontScaler;
}