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
      expect(Object.keys(schema.properties)).toHaveLength(17);
      expect(schema.properties.jobTitle).toBeDefined();
      expect(schema.properties.company).toBeDefined();
      expect(schema.properties.salary).toBeDefined();
      expect(schema.properties.companyReviews).toBeDefined();
      expect(schema.properties.workLifeBalance).toBeDefined();
      expect(schema.properties.managementQuality).toBeDefined();
      expect(schema.properties.companyCultureReviews).toBeDefined();
      expect(schema.properties.platformUsed).toBeDefined();
      expect(schema.properties.overallRating).toBeDefined();
      expect(schema.properties.reviewCount).toBeDefined();
      expect(schema.properties.companySize).toBeDefined();
      expect(schema.properties.industry).toBeDefined();
      expect(schema.properties.businessType).toBeDefined();
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

  describe('Company Review Fields', () => {
    it('should include all company review fields in field definitions', () => {
      expect(schemaManager.fieldDefinitions.companyReviews).toBeDefined();
      expect(schemaManager.fieldDefinitions.workLifeBalance).toBeDefined();
      expect(schemaManager.fieldDefinitions.managementQuality).toBeDefined();
      expect(schemaManager.fieldDefinitions.companyCultureReviews).toBeDefined();
    });

    it('should generate schema with company review fields only', () => {
      const reviewFields = ['companyReviews', 'workLifeBalance', 'managementQuality', 'companyCultureReviews'];
      const schema = schemaManager.generateJobSchema(reviewFields);
      
      expect(Object.keys(schema.properties)).toHaveLength(4);
      expect(schema.properties.companyReviews).toBeDefined();
      expect(schema.properties.workLifeBalance).toBeDefined();
      expect(schema.properties.managementQuality).toBeDefined();
      expect(schema.properties.companyCultureReviews).toBeDefined();
    });

    it('should have web search descriptions for company review fields', () => {
      const schema = schemaManager.generateJobSchema(['companyReviews'], 'en');
      const companyReviewsDesc = schema.properties.companyReviews.description;
      
      expect(companyReviewsDesc).toContain('web search');
      expect(companyReviewsDesc).toContain('Glassdoor');
      expect(companyReviewsDesc).toContain('Indeed');
    });

    it('should have Italian web search descriptions for company review fields', () => {
      const schema = schemaManager.generateJobSchema(['workLifeBalance'], 'it');
      const workLifeBalanceDesc = schema.properties.workLifeBalance.description;
      
      expect(workLifeBalanceDesc).toContain('ricerca web');
      expect(workLifeBalanceDesc).toContain('Non specificato');
    });

    it('should generate combined traditional and review fields schema', () => {
      const mixedFields = ['jobTitle', 'company', 'companyReviews', 'workLifeBalance'];
      const schema = schemaManager.generateJobSchema(mixedFields);
      
      expect(Object.keys(schema.properties)).toHaveLength(4);
      expect(schema.properties.jobTitle).toBeDefined();
      expect(schema.properties.company).toBeDefined();
      expect(schema.properties.companyReviews).toBeDefined();
      expect(schema.properties.workLifeBalance).toBeDefined();
      expect(schema.required).toEqual(mixedFields);
    });
  });

  describe('Star Ratings and Platform Fields', () => {
    it('should include all star rating fields in field definitions', () => {
      expect(schemaManager.fieldDefinitions.platformUsed).toBeDefined();
      expect(schemaManager.fieldDefinitions.overallRating).toBeDefined();
      expect(schemaManager.fieldDefinitions.reviewCount).toBeDefined();
    });

    it('should generate schema with star rating fields only', () => {
      const ratingFields = ['platformUsed', 'overallRating', 'reviewCount'];
      const schema = schemaManager.generateJobSchema(ratingFields);
      
      expect(Object.keys(schema.properties)).toHaveLength(3);
      expect(schema.properties.platformUsed).toBeDefined();
      expect(schema.properties.overallRating).toBeDefined();
      expect(schema.properties.reviewCount).toBeDefined();
    });

    it('should have platform-specific descriptions for rating fields', () => {
      const schema = schemaManager.generateJobSchema(['platformUsed'], 'en');
      const platformDesc = schema.properties.platformUsed.description;
      
      expect(platformDesc).toContain('Glassdoor');
      expect(platformDesc).toContain('Indeed');
      expect(platformDesc).toContain('Not specified');
    });

    it('should have star rating description with examples', () => {
      const schema = schemaManager.generateJobSchema(['overallRating'], 'en');
      const ratingDesc = schema.properties.overallRating.description;
      
      expect(ratingDesc).toContain('4.2/5 stars');
      expect(ratingDesc).toContain('Not specified');
    });

    it('should have review count description with examples', () => {
      const schema = schemaManager.generateJobSchema(['reviewCount'], 'it');
      const countDesc = schema.properties.reviewCount.description;
      
      expect(countDesc).toContain('1.250 recensioni');
      expect(countDesc).toContain('Non specificato');
    });
  });

  describe('Company Summary Fields', () => {
    it('should include all company summary fields in field definitions', () => {
      expect(schemaManager.fieldDefinitions.companySize).toBeDefined();
      expect(schemaManager.fieldDefinitions.industry).toBeDefined();
      expect(schemaManager.fieldDefinitions.businessType).toBeDefined();
    });

    it('should generate schema with company summary fields only', () => {
      const summaryFields = ['companySize', 'industry', 'businessType'];
      const schema = schemaManager.generateJobSchema(summaryFields);
      
      expect(Object.keys(schema.properties)).toHaveLength(3);
      expect(schema.properties.companySize).toBeDefined();
      expect(schema.properties.industry).toBeDefined();
      expect(schema.properties.businessType).toBeDefined();
    });

    it('should have appropriate descriptions for company size', () => {
      const schema = schemaManager.generateJobSchema(['companySize'], 'en');
      const sizeDesc = schema.properties.companySize.description;
      
      expect(sizeDesc).toContain('employees count');
      expect(sizeDesc).toContain('company scale');
      expect(sizeDesc).toContain('Not specified');
    });

    it('should have business type classification options', () => {
      const schema = schemaManager.generateJobSchema(['businessType'], 'en');
      const typeDesc = schema.properties.businessType.description;
      
      expect(typeDesc).toContain('Product company');
      expect(typeDesc).toContain('Consultancy');
      expect(typeDesc).toContain('Service provider');
    });

    it('should have Italian descriptions for company summary fields', () => {
      const schema = schemaManager.generateJobSchema(['businessType'], 'it');
      const typeDesc = schema.properties.businessType.description;
      
      expect(typeDesc).toContain('Azienda di prodotto');
      expect(typeDesc).toContain('Consulenza');
      expect(typeDesc).toContain('Non specificato');
    });
  });

  describe('Enhanced Web Research Integration', () => {
    it('should generate full schema with all traditional and web research fields', () => {
      const allFields = Object.keys(schemaManager.fieldDefinitions);
      const schema = schemaManager.generateJobSchema(allFields);
      
      expect(Object.keys(schema.properties)).toHaveLength(17);
      
      // Traditional fields
      expect(schema.properties.jobTitle).toBeDefined();
      expect(schema.properties.company).toBeDefined();
      expect(schema.properties.salary).toBeDefined();
      expect(schema.properties.location).toBeDefined();
      expect(schema.properties.benefits).toBeDefined();
      expect(schema.properties.requiredSkills).toBeDefined();
      expect(schema.properties.teamCulture).toBeDefined();
      
      // Review fields
      expect(schema.properties.companyReviews).toBeDefined();
      expect(schema.properties.workLifeBalance).toBeDefined();
      expect(schema.properties.managementQuality).toBeDefined();
      expect(schema.properties.companyCultureReviews).toBeDefined();
      
      // New rating fields
      expect(schema.properties.platformUsed).toBeDefined();
      expect(schema.properties.overallRating).toBeDefined();
      expect(schema.properties.reviewCount).toBeDefined();
      
      // New company summary fields
      expect(schema.properties.companySize).toBeDefined();
      expect(schema.properties.industry).toBeDefined();
      expect(schema.properties.businessType).toBeDefined();
    });

    it('should support mixed field selection including new fields', () => {
      const mixedFields = [
        'jobTitle', 'company', 'companyReviews', 
        'overallRating', 'platformUsed', 'companySize', 'businessType'
      ];
      const schema = schemaManager.generateJobSchema(mixedFields);
      
      expect(Object.keys(schema.properties)).toHaveLength(7);
      expect(schema.required).toEqual(mixedFields);
      
      // Verify specific new fields are included
      expect(schema.properties.overallRating).toBeDefined();
      expect(schema.properties.platformUsed).toBeDefined();
      expect(schema.properties.companySize).toBeDefined();
      expect(schema.properties.businessType).toBeDefined();
    });
  });
});