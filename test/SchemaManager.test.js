import { describe, it, expect, beforeEach } from 'vitest';

// Since the classes are defined in background.js, we need to extract them
// For testing purposes, we'll create a test version or import them properly
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

describe('[LinkedIn Job Analyzer] SchemaManager', () => {
  let schemaManager;

  beforeEach(() => {
    schemaManager = new SchemaManager();
  });

  describe('Constructor', () => {
    it('should initialize with field definitions', () => {
      expect(schemaManager.fieldDefinitions).toBeDefined();
      expect(schemaManager.fieldDefinitions.jobTitle).toBeDefined();
      expect(schemaManager.fieldDefinitions.company).toBeDefined();
      expect(schemaManager.schemaCache).toBeInstanceOf(Map);
    });

    it('should have correct field definitions structure', () => {
      const jobTitleField = schemaManager.fieldDefinitions.jobTitle;
      expect(jobTitleField.type).toBe('string');
      expect(jobTitleField.description.en).toBe('Job title or position name');
      expect(jobTitleField.description.it).toBe('Titolo del lavoro o nome della posizione');
    });
  });

  describe('generateJobSchema - Predefined Format', () => {
    it('should generate schema for all fields when no selection provided', () => {
      const schema = schemaManager.generateJobSchema();
      
      expect(schema.type).toBe('object');
      expect(schema.additionalProperties).toBe(false);
      expect(Object.keys(schema.properties)).toHaveLength(7);
      expect(schema.properties.jobTitle).toBeDefined();
      expect(schema.properties.company).toBeDefined();
      expect(schema.properties.salary).toBeDefined();
    });

    it('should generate schema for selected fields only', () => {
      const selectedFields = ['jobTitle', 'company', 'salary'];
      const schema = schemaManager.generateJobSchema(selectedFields);
      
      expect(Object.keys(schema.properties)).toHaveLength(3);
      expect(schema.properties.jobTitle).toBeDefined();
      expect(schema.properties.company).toBeDefined();
      expect(schema.properties.salary).toBeDefined();
      expect(schema.properties.benefits).toBeUndefined();
    });

    it('should use correct language for field descriptions', () => {
      const schema = schemaManager.generateJobSchema(['jobTitle'], 'it');
      
      expect(schema.properties.jobTitle.description).toBe('Titolo del lavoro o nome della posizione');
    });

    it('should cache generated schemas', () => {
      const selectedFields = ['jobTitle', 'company'];
      const schema1 = schemaManager.generateJobSchema(selectedFields, 'en');
      const schema2 = schemaManager.generateJobSchema(selectedFields, 'en');
      
      expect(schema1).toBe(schema2); // Same reference due to caching
      expect(schemaManager.schemaCache.size).toBeGreaterThan(0);
    });

    it('should handle invalid field names gracefully', () => {
      const selectedFields = ['jobTitle', 'invalidField', 'company'];
      const schema = schemaManager.generateJobSchema(selectedFields);
      
      expect(schema.properties.jobTitle).toBeDefined();
      expect(schema.properties.company).toBeDefined();
      expect(schema.properties.invalidField).toBeUndefined();
    });
  });

  describe('generateCustomSchema', () => {
    it('should generate schema from custom prompt with comma-separated fields', () => {
      const customPrompt = 'job title, company name, salary range';
      const schema = schemaManager.generateCustomSchema('en', customPrompt);
      
      expect(schema.type).toBe('object');
      expect(schema.additionalProperties).toBe(false);
      expect(Object.keys(schema.properties)).toHaveLength(3);
      expect(schema.properties.jobTitle).toBeDefined();
      expect(schema.properties.companyName).toBeDefined();
      expect(schema.properties.salaryRange).toBeDefined();
    });

    it('should generate schema from bullet-separated fields', () => {
      const customPrompt = '- team size\n• remote policy\n* required skills';
      const schema = schemaManager.generateCustomSchema('en', customPrompt);
      
      expect(Object.keys(schema.properties)).toHaveLength(3);
      expect(schema.properties.teamSize).toBeDefined();
      expect(schema.properties.remotePolicy).toBeDefined();
      expect(schema.properties.requiredSkills).toBeDefined();
    });

    it('should use Italian descriptions when language is it', () => {
      const customPrompt = 'titolo lavoro, azienda';
      const schema = schemaManager.generateCustomSchema('it', customPrompt);
      
      expect(schema.properties.titoloLavoro.description).toContain('TRADOTTO IN ITALIANO');
      expect(schema.properties.titoloLavoro.description).toContain('Non specificato');
    });

    it('should create fallback field when no fields parsed', () => {
      const customPrompt = '';
      const schema = schemaManager.generateCustomSchema('en', customPrompt);
      
      expect(Object.keys(schema.properties)).toHaveLength(1);
      expect(schema.properties.informazioniRichieste).toBeDefined();
    });
  });

  describe('parseCustomPrompt', () => {
    it('should parse comma-separated fields', () => {
      const prompt = 'field one, field two, field three';
      const fields = schemaManager.parseCustomPrompt(prompt);
      
      expect(fields).toHaveLength(3);
      expect(fields[0].name).toBe('field one');
      expect(fields[1].name).toBe('field two');
      expect(fields[2].name).toBe('field three');
    });

    it('should parse newline-separated fields', () => {
      const prompt = 'field one\nfield two\nfield three';
      const fields = schemaManager.parseCustomPrompt(prompt);
      
      expect(fields).toHaveLength(3);
      expect(fields[0].name).toBe('field one');
    });

    it('should parse bullet-separated fields', () => {
      const prompt = '- field one\n• field two\n· field three\n* field four';
      const fields = schemaManager.parseCustomPrompt(prompt);
      
      expect(fields).toHaveLength(4);
      expect(fields[0].name).toBe('field one');
      expect(fields[1].name).toBe('field two');
      expect(fields[2].name).toBe('field three');
      expect(fields[3].name).toBe('field four');
    });

    it('should handle mixed delimiters', () => {
      const prompt = 'field one, field two\n- field three';
      const fields = schemaManager.parseCustomPrompt(prompt);
      
      expect(fields).toHaveLength(3);
    });

    it('should filter out empty fields', () => {
      const prompt = 'field one,, field two,   , field three';
      const fields = schemaManager.parseCustomPrompt(prompt);
      
      expect(fields).toHaveLength(3);
      expect(fields.every(f => f.name.trim().length > 0)).toBe(true);
    });

    it('should return empty array for empty prompt', () => {
      const fields = schemaManager.parseCustomPrompt('');
      expect(fields).toHaveLength(0);
    });
  });

  describe('createFieldKey', () => {
    it('should convert field name to camelCase', () => {
      expect(schemaManager.createFieldKey('job title')).toBe('jobTitle');
      expect(schemaManager.createFieldKey('company name')).toBe('companyName');
      expect(schemaManager.createFieldKey('required skills')).toBe('requiredSkills');
    });

    it('should handle special characters', () => {
      expect(schemaManager.createFieldKey('job-title')).toBe('jobtitle');
      expect(schemaManager.createFieldKey('job_title')).toBe('jobtitle');
      expect(schemaManager.createFieldKey('job & benefits')).toBe('jobBenefits');
    });

    it('should handle multiple spaces', () => {
      expect(schemaManager.createFieldKey('job   title   here')).toBe('jobTitleHere');
    });

    it('should handle edge cases', () => {
      expect(schemaManager.createFieldKey('')).toBe('campo');
      expect(schemaManager.createFieldKey('   ')).toBe('campo');
      expect(schemaManager.createFieldKey('123')).toBe('123');
    });

    it('should handle Italian field names', () => {
      expect(schemaManager.createFieldKey('titolo lavoro')).toBe('titoloLavoro');
      expect(schemaManager.createFieldKey('tipo contratto')).toBe('tipoContratto');
    });
  });

  describe('getDefaultNotSpecifiedValue', () => {
    it('should return English not specified value', () => {
      expect(schemaManager.getDefaultNotSpecifiedValue('en')).toBe('Not specified');
    });

    it('should return Italian not specified value', () => {
      expect(schemaManager.getDefaultNotSpecifiedValue('it')).toBe('Non specificato');
    });

    it('should default to English for unknown language', () => {
      expect(schemaManager.getDefaultNotSpecifiedValue('fr')).toBe('Not specified');
    });
  });

  describe('Schema Structure Validation', () => {
    it('should generate valid OpenAI schema structure', () => {
      const schema = schemaManager.generateJobSchema(['jobTitle', 'company']);
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toBeDefined();
      expect(schema.additionalProperties).toBe(false);
      
      // Check property structure
      Object.values(schema.properties).forEach(property => {
        expect(property.type).toBe('string');
        expect(property.description).toBeDefined();
        expect(typeof property.description).toBe('string');
      });
    });

    it('should include all required fields in required array', () => {
      const selectedFields = ['jobTitle', 'company', 'salary'];
      const schema = schemaManager.generateJobSchema(selectedFields);
      
      expect(schema.required).toEqual(selectedFields);
    });
  });
});